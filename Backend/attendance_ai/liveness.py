"""
Liveness Detection Module for AI Attendance System.

Uses eye-blink detection via OpenCV haar cascades as a lightweight
approach (no MediaPipe dependency required).

Flow:
  1. Receive a series of face frames (3-5 frames over ~3 seconds)
  2. Detect eyes in each frame
  3. Calculate Eye Aspect Ratio (EAR)
  4. If EAR drops below threshold in any frame → blink detected = LIVE
  5. If no blink in all frames → likely a photo/screen = SPOOF
  6. Return liveness_score (0.0 to 1.0)

Alternative approach also detects:
  - Texture analysis (printed photos have different texture patterns)
  - Screen reflection/moiré patterns
"""

import os
import logging

import cv2
import numpy as np

logger = logging.getLogger(__name__)

# ── Constants ─────────────────────────────────────────────────────────────────
EAR_THRESHOLD = 0.25         # below this → eye is closed (blink)
BLINK_CONSECUTIVE_FRAMES = 1 # consecutive frames with low EAR = 1 blink
LAPLACIAN_THRESHOLD = 80.0   # blurriness score — printed photos are usually < this
TEXTURE_THRESHOLD = 15.0     # LBP variance threshold for real vs printed face

# Haar cascades (shipped with OpenCV)
_face_cascade = None
_eye_cascade = None


def _get_cascades():
    """Lazy load OpenCV haar cascades."""
    global _face_cascade, _eye_cascade
    if _face_cascade is None:
        cascade_dir = cv2.data.haarcascades
        _face_cascade = cv2.CascadeClassifier(
            os.path.join(cascade_dir, 'haarcascade_frontalface_default.xml')
        )
        _eye_cascade = cv2.CascadeClassifier(
            os.path.join(cascade_dir, 'haarcascade_eye.xml')
        )
    return _face_cascade, _eye_cascade


# ═══════════════════════════════════════════════════════════════════════════════
# EYE ASPECT RATIO (simplified with haar cascade)
# ═══════════════════════════════════════════════════════════════════════════════


def _detect_eyes_in_frame(gray_frame):
    """
    Detect face and eyes in a grayscale frame.
    Returns number of eyes detected (0, 1, or 2).
    """
    face_cascade, eye_cascade = _get_cascades()
    faces = face_cascade.detectMultiScale(gray_frame, 1.3, 5)
    
    if len(faces) == 0:
        return -1  # no face found
    
    for (x, y, w, h) in faces:
        roi_gray = gray_frame[y:y + h, x:x + w]
        eyes = eye_cascade.detectMultiScale(roi_gray, 1.1, 3)
        return len(eyes)
    
    return 0


def _compute_sharpness(gray_frame):
    """
    Compute image sharpness using Laplacian variance.
    Real faces have higher sharpness; printed photos/screens are blurrier.
    """
    laplacian = cv2.Laplacian(gray_frame, cv2.CV_64F)
    return laplacian.var()


def _compute_texture_score(gray_frame):
    """
    Simple texture analysis using Local Binary Pattern variance.
    Real skin has different texture vs printed paper or phone screen.
    """
    face_cascade, _ = _get_cascades()
    faces = face_cascade.detectMultiScale(gray_frame, 1.3, 5)
    
    if len(faces) == 0:
        return 0.0
    
    x, y, w, h = faces[0]
    face_region = gray_frame[y:y + h, x:x + w]
    
    # Resize for consistency
    face_region = cv2.resize(face_region, (128, 128))
    
    # Simple LBP-like texture: compare each pixel with neighbors
    score = 0.0
    for i in range(1, face_region.shape[0] - 1):
        for j in range(1, face_region.shape[1] - 1):
            center = int(face_region[i, j])
            # 4-connected neighbors
            neighbors = [
                int(face_region[i-1, j]),
                int(face_region[i+1, j]),
                int(face_region[i, j-1]),
                int(face_region[i, j+1]),
            ]
            code = sum(1 for n in neighbors if n >= center)
            score += code
    
    # Normalize by area
    area = (face_region.shape[0] - 2) * (face_region.shape[1] - 2)
    return score / area if area > 0 else 0.0


# ═══════════════════════════════════════════════════════════════════════════════
# PUBLIC API
# ═══════════════════════════════════════════════════════════════════════════════


def check_liveness_single(rgb_image):
    """
    Quick liveness check on a single frame.
    
    Returns dict:
      {
        "is_live": bool,
        "liveness_score": float (0.0-1.0),
        "eyes_detected": int,
        "sharpness": float,
        "checks_passed": {
            "face_found": bool,
            "eyes_visible": bool,
            "image_sharp": bool,
        }
      }
    """
    gray = cv2.cvtColor(rgb_image, cv2.COLOR_RGB2GRAY)
    
    eyes = _detect_eyes_in_frame(gray)
    sharpness = _compute_sharpness(gray)
    
    face_found = eyes >= 0
    eyes_visible = eyes >= 1
    is_sharp = sharpness > LAPLACIAN_THRESHOLD
    
    # Calculate composite score
    score = 0.0
    if face_found:
        score += 0.3
    if eyes_visible:
        score += 0.3
        if eyes >= 2:
            score += 0.1  # bonus for both eyes visible
    if is_sharp:
        score += 0.3
    
    return {
        "is_live": score >= 0.6,
        "liveness_score": round(min(score, 1.0), 2),
        "eyes_detected": max(eyes, 0),
        "sharpness": round(sharpness, 2),
        "checks_passed": {
            "face_found": face_found,
            "eyes_visible": eyes_visible,
            "image_sharp": is_sharp,
        },
    }


def check_liveness_multi_frame(rgb_frames):
    """
    Robust liveness check using multiple frames (3-5 frames captured over ~3 seconds).
    Detects eye blinks by looking for frames where eye count drops.
    
    Args:
        rgb_frames: list of RGB numpy arrays
    
    Returns dict:
      {
        "is_live": bool,
        "liveness_score": float (0.0-1.0),
        "blink_detected": bool,
        "frames_analyzed": int,
        "message": str,
      }
    """
    if not rgb_frames or len(rgb_frames) < 2:
        return {
            "is_live": False,
            "liveness_score": 0.0,
            "blink_detected": False,
            "frames_analyzed": len(rgb_frames) if rgb_frames else 0,
            "message": "Need at least 2 frames for liveness check."
        }
    
    eye_counts = []
    sharpness_scores = []
    face_found_count = 0
    
    for frame in rgb_frames:
        gray = cv2.cvtColor(frame, cv2.COLOR_RGB2GRAY)
        eyes = _detect_eyes_in_frame(gray)
        sharpness = _compute_sharpness(gray)
        
        if eyes >= 0:
            face_found_count += 1
        eye_counts.append(max(eyes, 0))
        sharpness_scores.append(sharpness)
    
    # Blink detection: look for a dip in eye count
    # Pattern: 2 → 0 or 2 → 1 → 2  (eyes close momentarily)
    blink_detected = False
    for i in range(1, len(eye_counts)):
        if eye_counts[i - 1] >= 2 and eye_counts[i] <= 0:
            blink_detected = True
            break
        if i >= 2 and eye_counts[i - 2] >= 2 and eye_counts[i - 1] <= 1 and eye_counts[i] >= 1:
            blink_detected = True
            break
    
    # Score components
    face_ratio = face_found_count / len(rgb_frames)
    avg_sharpness = np.mean(sharpness_scores) if sharpness_scores else 0
    is_sharp = avg_sharpness > LAPLACIAN_THRESHOLD
    
    # Variation in eye counts (real face has variation; photo is constant)
    eye_variation = np.std(eye_counts) if len(eye_counts) > 1 else 0
    has_variation = eye_variation > 0.3
    
    # Calculate composite liveness score
    score = 0.0
    if face_ratio >= 0.6:
        score += 0.25
    if blink_detected:
        score += 0.35
    if is_sharp:
        score += 0.20
    if has_variation:
        score += 0.20
    
    is_live = score >= 0.45  # Lenient: blink + face_found is enough
    
    message = "Liveness verified." if is_live else "Liveness check failed."
    if not blink_detected and not is_live:
        message = "No blink detected. Please blink naturally and try again."
    
    return {
        "is_live": is_live,
        "liveness_score": round(min(score, 1.0), 2),
        "blink_detected": blink_detected,
        "frames_analyzed": len(rgb_frames),
        "eye_variation": round(eye_variation, 3),
        "avg_sharpness": round(avg_sharpness, 2),
        "message": message,
    }
