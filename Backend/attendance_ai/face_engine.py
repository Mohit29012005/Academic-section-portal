"""
Face Engine — Core CV logic for AI Attendance System.

Features:
  1. register_face()   — 5-10 base64 images → augment → average embedding → .npy
  2. recognize_face()  — single face match against stored embeddings
  3. recognize_multi() — multi-face detection in a single classroom frame
  4. Image augmentation pipeline for robust embeddings
"""

import os
import base64
import logging
import tempfile

import numpy as np
import cv2
from PIL import Image, ImageEnhance
from django.conf import settings

logger = logging.getLogger(__name__)

ENCODINGS_DIR = os.path.join(settings.MEDIA_ROOT, "face_encodings")
SNAPSHOTS_DIR = os.path.join(settings.MEDIA_ROOT, "attendance_snapshots")
MODEL_NAME = "VGG-Face"
SIMILARITY_THRESHOLD = 0.60          # cosine similarity threshold for match (strict)
LATE_THRESHOLD_MINUTES = 15          # minutes after start_time → mark as Late

os.makedirs(ENCODINGS_DIR, exist_ok=True)
os.makedirs(SNAPSHOTS_DIR, exist_ok=True)

# ── DeepFace lazy import ──────────────────────────────────────────────────────
_deepface = None


def _get_deepface():
    """Lazy-load DeepFace to avoid slow startup."""
    global _deepface
    if _deepface is None:
        from deepface import DeepFace
        _deepface = DeepFace
    return _deepface


# ═══════════════════════════════════════════════════════════════════════════════
# IMAGE UTILITIES
# ═══════════════════════════════════════════════════════════════════════════════


def decode_base64_image(b64_string):
    """Convert base64 string from browser to numpy RGB array."""
    try:
        if "," in b64_string:
            b64_string = b64_string.split(",")[1]
        img_bytes = base64.b64decode(b64_string.strip())
        np_arr = np.frombuffer(img_bytes, dtype=np.uint8)
        bgr = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        if bgr is None:
            return None
        return cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
    except Exception as e:
        logger.error(f"decode_base64_image error: {e}")
        return None


def augment_image(rgb_image):
    """
    Generate augmented variations of a single face image.
    Returns list of RGB numpy arrays (original + augmented).
    
    Augmentations:
      - Horizontal flip
      - Brightness adjustments (brighter/darker)
      - Slight Gaussian blur
      - Small rotations (±5°, ±10°)
      - Contrast adjustment
    """
    augmented = [rgb_image]  # include original
    pil_img = Image.fromarray(rgb_image)
    h, w = rgb_image.shape[:2]

    # 1. Horizontal flip
    flipped = np.fliplr(rgb_image).copy()
    augmented.append(flipped)

    # 2. Brightness variations
    for factor in [0.75, 0.85, 1.15, 1.30]:
        enhancer = ImageEnhance.Brightness(pil_img)
        bright = np.array(enhancer.enhance(factor))
        augmented.append(bright)

    # 3. Contrast variations
    for factor in [0.8, 1.2]:
        enhancer = ImageEnhance.Contrast(pil_img)
        contrasted = np.array(enhancer.enhance(factor))
        augmented.append(contrasted)

    # 4. Slight Gaussian blur
    blurred = cv2.GaussianBlur(rgb_image, (3, 3), 0)
    augmented.append(blurred)

    # 5. Small rotations (±5°, ±10°)
    center = (w // 2, h // 2)
    for angle in [-10, -5, 5, 10]:
        M = cv2.getRotationMatrix2D(center, angle, 1.0)
        rotated = cv2.warpAffine(rgb_image, M, (w, h), borderMode=cv2.BORDER_REPLICATE)
        augmented.append(rotated)

    return augmented


# ═══════════════════════════════════════════════════════════════════════════════
# EMBEDDING EXTRACTION
# ═══════════════════════════════════════════════════════════════════════════════


def get_embedding(rgb_image):
    """
    Extract face embedding using DeepFace VGG-Face model.
    Returns normalized embedding vector.
    Tries multiple detector backends for robustness.
    """
    DeepFace = _get_deepface()
    temp_path = None
    try:
        pil_img = Image.fromarray(rgb_image)
        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
            temp_path = tmp.name
            pil_img.save(tmp, format="JPEG")

        # Try multiple detector backends for better face detection
        detector_backends = ["opencv", "ssd", "skip"]
        result = None
        for backend in detector_backends:
            try:
                result = DeepFace.represent(
                    img_path=temp_path,
                    model_name=MODEL_NAME,
                    enforce_detection=(backend != "skip"),
                    detector_backend=backend,
                )
                if result and len(result) > 0:
                    break
            except Exception as det_err:
                logger.debug(f"detector '{backend}' failed: {det_err}")
                continue

        if result and len(result) > 0:
            embedding = np.array(result[0]["embedding"], dtype=np.float32)
            norm = np.linalg.norm(embedding)
            if norm > 0:
                embedding = embedding / norm
            return embedding
        return None
    except Exception as e:
        logger.error(f"get_embedding error: {e}")
        return None
    finally:
        if temp_path and os.path.exists(temp_path):
            try:
                os.unlink(temp_path)
            except Exception:
                pass


def get_all_embeddings_in_frame(rgb_image):
    """
    Detect ALL faces in a frame and return list of (face_region, embedding).
    Used for multi-face classroom attendance.
    """
    DeepFace = _get_deepface()
    temp_path = None
    results = []
    try:
        pil_img = Image.fromarray(rgb_image)
        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
            temp_path = tmp.name
            pil_img.save(tmp, format="JPEG")

        # Try detectors that support multi-face
        for backend in ["opencv", "ssd"]:
            try:
                reps = DeepFace.represent(
                    img_path=temp_path,
                    model_name=MODEL_NAME,
                    enforce_detection=True,
                    detector_backend=backend,
                )
                if reps and len(reps) > 0:
                    for rep in reps:
                        emb = np.array(rep["embedding"], dtype=np.float32)
                        norm = np.linalg.norm(emb)
                        if norm > 0:
                            emb = emb / norm
                        face_area = rep.get("facial_area", {})
                        results.append({
                            "embedding": emb,
                            "facial_area": face_area,
                        })
                    break
            except Exception as e:
                logger.debug(f"multi-detect '{backend}' failed: {e}")
                continue
    except Exception as e:
        logger.error(f"get_all_embeddings_in_frame error: {e}")
    finally:
        if temp_path and os.path.exists(temp_path):
            try:
                os.unlink(temp_path)
            except Exception:
                pass

    return results


# ═══════════════════════════════════════════════════════════════════════════════
# SIMILARITY
# ═══════════════════════════════════════════════════════════════════════════════


def cosine_similarity(vec1, vec2):
    """Cosine similarity between two vectors."""
    norm1 = np.linalg.norm(vec1)
    norm2 = np.linalg.norm(vec2)
    if norm1 == 0 or norm2 == 0:
        return 0.0
    return float(np.dot(vec1, vec2) / (norm1 * norm2))


# ═══════════════════════════════════════════════════════════════════════════════
# REGISTRATION
# ═══════════════════════════════════════════════════════════════════════════════


def register_face(student_id, base64_images):
    """
    Enhanced registration flow:
    1. Take 5-10 base64 images from browser webcam
    2. For each image: generate augmented variations (flip, brightness, blur, rotation)
    3. Extract face embedding from each augmented image
    4. Average ALL valid embeddings into one robust master vector
    5. Save as {student_id}.npy in ENCODINGS_DIR
    
    This creates 50+ embedding samples from 5 original photos for maximum accuracy.
    """
    all_embeddings = []
    failed_indices = []
    processed_originals = 0

    for idx, b64 in enumerate(base64_images):
        rgb = decode_base64_image(b64)
        if rgb is None:
            failed_indices.append(idx + 1)
            continue

        # Generate augmented variations
        augmented_images = augment_image(rgb)
        original_embedding = None
        aug_count = 0

        for aug_img in augmented_images:
            embedding = get_embedding(aug_img)
            if embedding is not None:
                all_embeddings.append(embedding)
                aug_count += 1
                if original_embedding is None:
                    original_embedding = embedding

        if original_embedding is not None:
            processed_originals += 1
            logger.info(
                f"Registered sample {idx + 1}: {aug_count} augmented embeddings extracted"
            )
        else:
            failed_indices.append(idx + 1)
            logger.warning(f"Sample {idx + 1}: no face detected in any augmentation")

    if len(all_embeddings) < 1:
        return {
            "success": False,
            "message": "No valid face detected in any image. Ensure good lighting and face clearly visible.",
            "encoding_count": 0,
            "failed_indices": failed_indices,
        }

    # Average all valid embeddings into one master embedding
    master_embedding = np.mean(all_embeddings, axis=0)
    norm = np.linalg.norm(master_embedding)
    if norm > 0:
        master_embedding = master_embedding / norm

    npy_path = os.path.join(ENCODINGS_DIR, f"{student_id}.npy")
    np.save(npy_path, master_embedding)
    logger.info(
        f"Saved embedding for {student_id}: {processed_originals} originals, "
        f"{len(all_embeddings)} total augmented samples averaged"
    )

    return {
        "success": True,
        "message": f"Face registered with {processed_originals} photos ({len(all_embeddings)} augmented samples).",
        "encoding_count": processed_originals,
        "total_samples": len(all_embeddings),
        "encoding_path": npy_path,
        "failed_indices": failed_indices,
    }


# ═══════════════════════════════════════════════════════════════════════════════
# RECOGNITION — SINGLE FACE
# ═══════════════════════════════════════════════════════════════════════════════


def recognize_face(b64_frame, session_id=None):
    """Compare a single face against all stored embeddings. Returns best match."""
    rgb = decode_base64_image(b64_frame)
    if rgb is None:
        return {"status": "error", "message": "Cannot decode frame"}

    live_embedding = get_embedding(rgb)
    if live_embedding is None:
        return {
            "status": "no_face",
            "message": "No face detected in frame",
            "recognized": False,
        }

    best_student_id = None
    best_score = 0.0

    npy_files = [f for f in os.listdir(ENCODINGS_DIR) if f.endswith(".npy")]
    if not npy_files:
        return {
            "status": "error",
            "message": "No registered students found.",
            "recognized": False,
        }

    for filename in npy_files:
        student_id = filename.replace(".npy", "")
        fpath = os.path.join(ENCODINGS_DIR, filename)
        try:
            stored_embedding = np.load(fpath)
        except Exception as e:
            logger.error(f"Failed to load {fpath}: {e}")
            continue

        score = cosine_similarity(live_embedding, stored_embedding)
        if score > best_score:
            best_score = score
            best_student_id = student_id

    logger.info(f"Best match: {best_student_id} with score {best_score:.4f}")
    confidence = round(best_score * 100, 2)

    if best_score < SIMILARITY_THRESHOLD:
        return {
            "status": "unknown",
            "message": "Face not recognized",
            "confidence": confidence,
            "recognized": False,
        }

    # Save snapshot
    from datetime import date
    today = date.today().strftime("%Y-%m-%d")
    snap_dir = os.path.join(SNAPSHOTS_DIR, today)
    os.makedirs(snap_dir, exist_ok=True)

    suffix = f"_{session_id}" if session_id else ""
    snap_path = os.path.join(snap_dir, f"{best_student_id}{suffix}.jpg")
    bgr = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
    cv2.imwrite(snap_path, bgr)

    return {
        "status": "recognized",
        "student_id": best_student_id,
        "confidence": confidence,
        "snapshot_path": f"attendance_snapshots/{today}/{os.path.basename(snap_path)}",
        "message": "Student recognized",
        "recognized": True,
    }


# ═══════════════════════════════════════════════════════════════════════════════
# RECOGNITION — MULTI-FACE (classroom scanning)
# ═══════════════════════════════════════════════════════════════════════════════


def recognize_multi_faces(b64_frame, session_id=None):
    """
    Detect and recognize ALL faces in a single frame.
    Used for classroom-wide attendance scanning.
    
    Returns:
      {
        "faces_detected": int,
        "recognized": [
          {"student_id": ..., "confidence": ..., "facial_area": ...},
        ],
        "unknown_count": int,
      }
    """
    rgb = decode_base64_image(b64_frame)
    if rgb is None:
        return {"faces_detected": 0, "recognized": [], "unknown_count": 0,
                "message": "Cannot decode frame"}

    face_data = get_all_embeddings_in_frame(rgb)
    if not face_data:
        # Fallback to single face
        single = recognize_face(b64_frame, session_id)
        if single.get("recognized"):
            return {
                "faces_detected": 1,
                "recognized": [{
                    "student_id": single["student_id"],
                    "confidence": single["confidence"],
                    "snapshot_path": single.get("snapshot_path", ""),
                }],
                "unknown_count": 0,
            }
        return {"faces_detected": 0, "recognized": [], "unknown_count": 0,
                "message": "No faces detected"}

    # Load all stored embeddings
    npy_files = [f for f in os.listdir(ENCODINGS_DIR) if f.endswith(".npy")]
    stored_embeddings = {}
    for filename in npy_files:
        sid = filename.replace(".npy", "")
        fpath = os.path.join(ENCODINGS_DIR, filename)
        try:
            stored_embeddings[sid] = np.load(fpath)
        except Exception:
            continue

    recognized = []
    unknown_count = 0

    for face in face_data:
        live_emb = face["embedding"]
        best_sid = None
        best_score = 0.0

        for sid, stored_emb in stored_embeddings.items():
            score = cosine_similarity(live_emb, stored_emb)
            if score > best_score:
                best_score = score
                best_sid = sid

        if best_score >= SIMILARITY_THRESHOLD:
            recognized.append({
                "student_id": best_sid,
                "confidence": round(best_score * 100, 2),
                "facial_area": face.get("facial_area", {}),
            })
        else:
            unknown_count += 1

    # Save snapshot of the full frame
    from datetime import date
    today = date.today().strftime("%Y-%m-%d")
    snap_dir = os.path.join(SNAPSHOTS_DIR, today)
    os.makedirs(snap_dir, exist_ok=True)
    suffix = f"_multi_{session_id}" if session_id else "_multi"
    snap_path = os.path.join(snap_dir, f"classroom{suffix}.jpg")
    bgr = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
    cv2.imwrite(snap_path, bgr)

    return {
        "faces_detected": len(face_data),
        "recognized": recognized,
        "unknown_count": unknown_count,
        "snapshot_path": f"attendance_snapshots/{today}/{os.path.basename(snap_path)}",
    }
