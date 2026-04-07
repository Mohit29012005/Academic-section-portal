"""
Face Recognition Engine for AI Attendance System.

Uses face_recognition (dlib-based) + OpenCV.
All image I/O is via base64 strings to stay API-friendly.
"""
import os
import pickle
import base64
import logging
import numpy as np
from datetime import date
from django.conf import settings

logger = logging.getLogger(__name__)

# ── Try importing face_recognition & cv2 (may not be installed in dev) ──
try:
    import face_recognition
    import cv2
    FACE_RECOGNITION_AVAILABLE = True
except ImportError:
    face_recognition = None
    cv2 = None
    FACE_RECOGNITION_AVAILABLE = False
    logger.warning(
        "face_recognition / OpenCV not installed. "
        "Face-recognition endpoints are disabled until dependencies are installed."
    )

TOLERANCE = 0.6          # face_recognition distance threshold (0.5 is strict, 0.6 is standard)
MIN_CONFIDENCE = 40.0    # 1.0 - 0.6 = 0.4 (40%)
ENCODING_DIR = os.path.join(settings.MEDIA_ROOT, 'face_encodings')
REG_PHOTO_DIR = os.path.join(settings.MEDIA_ROOT, 'registered_faces')
SNAPSHOT_BASE = os.path.join(settings.MEDIA_ROOT, 'attendance_snapshots')
os.makedirs(ENCODING_DIR, exist_ok=True)
os.makedirs(REG_PHOTO_DIR, exist_ok=True)


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def _b64_to_file(b64_string: str, path: str):
    """Save base64 string directly to an image file."""
    if ',' in b64_string:
        b64_string = b64_string.split(',', 1)[1]
    img_bytes = base64.b64decode(b64_string)
    with open(path, 'wb') as f:
        f.write(img_bytes)
    return True

def _b64_to_np(b64_string: str) -> np.ndarray:
    """Decode a base64 image string to a NumPy RGB array."""
    if ',' in b64_string:
        b64_string = b64_string.split(',', 1)[1]
    img_bytes = base64.b64decode(b64_string)
    img_array = np.frombuffer(img_bytes, dtype=np.uint8)
    img_bgr = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
    if img_bgr is None:
        raise ValueError("Could not decode image from base64 data.")
    return cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)


def _encoding_path(student_id: str) -> str:
    return os.path.join(ENCODING_DIR, f"{student_id}.pkl")


def _snapshot_path(student_id: str) -> str:
    today = date.today().isoformat()
    directory = os.path.join(SNAPSHOT_BASE, today)
    os.makedirs(directory, exist_ok=True)
    return os.path.join(directory, f"{student_id}.jpg"), f"attendance_snapshots/{today}/{student_id}.jpg"


# ─────────────────────────────────────────────────────────────────────────────
# Registration
# ─────────────────────────────────────────────────────────────────────────────

def register_face_encodings(student_id: str, b64_images: list) -> dict:
    """
    Extract face encodings from 5 base64 images and save as .pkl.

    Returns:
        {"success": bool, "encoding_count": int, "message": str, "encoding_path": str}
    """
    if not FACE_RECOGNITION_AVAILABLE:
        return {
            "success": False,
            "encoding_count": 0,
            "message": "Face engine unavailable on server. Contact admin.",
            "encoding_path": None,
        }

    encodings = []
    errors = []

    for idx, b64 in enumerate(b64_images):
        try:
            rgb = _b64_to_np(b64)
            locs = face_recognition.face_locations(rgb, model='hog')
            if not locs:
                errors.append(f"Image {idx + 1}: No face detected.")
                continue
            enc_list = face_recognition.face_encodings(rgb, known_face_locations=locs)
            if enc_list:
                encodings.append(enc_list[0])
            else:
                errors.append(f"Image {idx + 1}: Could not encode face.")
        except Exception as e:
            errors.append(f"Image {idx + 1}: {str(e)}")

    if not encodings:
        return {
            "success": False,
            "encoding_count": 0,
            "message": f"No valid face encodings extracted. Errors: {'; '.join(errors)}",
            "encoding_path": None,
        }

    pkl_path = _encoding_path(student_id)
    with open(pkl_path, 'wb') as f:
        pickle.dump(encodings, f)

    msg = f"Saved {len(encodings)} face encodings."
    if errors:
        msg += f" Warnings: {'; '.join(errors)}"

    return {
        "success": True,
        "encoding_count": len(encodings),
        "message": msg,
        "encoding_path": f"face_encodings/{student_id}.pkl",
    }


# ─────────────────────────────────────────────────────────────────────────────
# Recognition
# ─────────────────────────────────────────────────────────────────────────────

def _load_all_encodings() -> dict[str, list]:
    """
    Load all stored .pkl files from ENCODING_DIR.

    Returns:
        {student_id: [encoding_array, ...]}
    """
    all_enc = {}
    if not os.path.isdir(ENCODING_DIR):
        return all_enc
    for fname in os.listdir(ENCODING_DIR):
        if fname.endswith('.pkl'):
            sid = fname[:-4]
            try:
                with open(os.path.join(ENCODING_DIR, fname), 'rb') as f:
                    all_enc[sid] = pickle.load(f)
            except Exception as e:
                logger.error(f"Failed to load encoding for {sid}: {e}")
    return all_enc


def recognize_face(b64_frame: str, encodings_map: dict = None) -> dict:
    """
    Identify a face in a live camera frame.

    Returns:
        {
            "success": bool,
            "student_id": str | None,
            "confidence_score": float,   # 0-100
            "status": "present" | "unknown",
            "snapshot_rel_path": str | None,
            "error": str | None,
        }
    """
    if not FACE_RECOGNITION_AVAILABLE:
        return {
            "recognized": False,
            "student_id": None,
            "confidence": 0.0,
            "message": "Face engine unavailable on server. Contact admin.",
        }

    try:
        rgb = _b64_to_np(b64_frame)
    except Exception as e:
        return {"recognized": False, "student_id": None, "confidence": 0.0, "message": str(e)}

    locs = face_recognition.face_locations(rgb, model='hog')
    if not locs:
        return {"recognized": False, "student_id": None, "confidence": 0.0, "message": "No face detected."}

    live_enc = face_recognition.face_encodings(rgb, known_face_locations=locs)
    if not live_enc:
        return {"recognized": False, "student_id": None, "confidence": 0.0, "message": "Could not encode face."}

    live = live_enc[0]

    # Build comparison data from encodings_map or from disk
    if encodings_map:
        compare_data = {
            sid: pickle.load(open(os.path.join(settings.MEDIA_ROOT, info['encoding_path']), 'rb'))
            for sid, info in encodings_map.items()
            if os.path.exists(os.path.join(settings.MEDIA_ROOT, info['encoding_path']))
        }
    else:
        compare_data = _load_all_encodings()

    best_sid = None
    best_distance = 1.0

    for sid, stored_list in compare_data.items():
        distances = face_recognition.face_distance(stored_list, live)
        if len(distances) == 0:
            continue
        min_dist = float(np.min(distances))
        if min_dist < best_distance:
            best_distance = min_dist
            best_sid = sid

    confidence = max(0.0, (1.0 - best_distance) * 100.0)
    matched = (best_sid is not None) and (best_distance <= TOLERANCE) and (confidence >= MIN_CONFIDENCE)

    snapshot_rel = None
    if matched:
        abs_path, snapshot_rel = _snapshot_path(best_sid)
        try:
            bgr = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
            cv2.imwrite(abs_path, bgr)
        except Exception as e:
            logger.warning(f"Snapshot save failed: {e}")

    return {
        "recognized": matched,
        "student_id": best_sid if matched else None,
        "confidence": round(confidence, 2),
        "snapshot_rel_path": snapshot_rel,
        "message": "Recognized" if matched else "Face not recognized.",
    }
