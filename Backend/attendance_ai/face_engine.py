"""
Face Engine — Core CV logic for AI Attendance System.

Features:
  1. register_face()   — 5-10 base64 images → augment → average embedding → .npy
  2. recognize_face()  — single face match against stored embeddings
  3. recognize_multi() — YOLO-powered multi-face detection in a single classroom frame
  4. Image augmentation pipeline for robust embeddings

YOLO is used for fast, accurate face detection (bounding boxes).
DeepFace VGG-Face is used for face embedding / recognition.
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
SIMILARITY_THRESHOLD = 0.60          # cosine similarity threshold for match
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


# ── YOLO Face Detector lazy import ───────────────────────────────────────────
_yolo_model = None
YOLO_MODEL_PATH = os.path.join(settings.MEDIA_ROOT, "models", "yolov8n-face.pt")
YOLO_AVAILABLE = False


def _get_yolo():
    """Lazy-load YOLOv8 face detection model."""
    global _yolo_model, YOLO_AVAILABLE
    if _yolo_model is not None:
        return _yolo_model
    try:
        from ultralytics import YOLO
        model_dir = os.path.join(settings.MEDIA_ROOT, "models")
        os.makedirs(model_dir, exist_ok=True)

        if os.path.exists(YOLO_MODEL_PATH):
            _yolo_model = YOLO(YOLO_MODEL_PATH)
        else:
            # Download yolov8n-face model from HuggingFace / auto-download
            logger.info("Downloading YOLOv8 face model...")
            _yolo_model = YOLO("yolov8n.pt")   # fallback: object detection
            # Attempt specialized face model
            try:
                import requests as _req
                url = "https://github.com/akanametov/yolov8-face/releases/download/v0.0.0/yolov8n-face.pt"
                r = _req.get(url, timeout=30, stream=True)
                if r.status_code == 200:
                    with open(YOLO_MODEL_PATH, "wb") as f:
                        for chunk in r.iter_content(chunk_size=8192):
                            f.write(chunk)
                    _yolo_model = YOLO(YOLO_MODEL_PATH)
                    logger.info("YOLOv8 face model downloaded successfully.")
            except Exception as dl_err:
                logger.warning(f"Face model download failed, using generic YOLO: {dl_err}")

        YOLO_AVAILABLE = True
        logger.info("YOLO face detector loaded successfully.")
        return _yolo_model
    except Exception as e:
        logger.warning(f"YOLO unavailable, falling back to OpenCV: {e}")
        YOLO_AVAILABLE = False
        return None


# ── OpenCV Haar cascade fallback ─────────────────────────────────────────────
_haar_cascade = None


def _get_haar_cascade():
    global _haar_cascade
    if _haar_cascade is None:
        cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        _haar_cascade = cv2.CascadeClassifier(cascade_path)
    return _haar_cascade


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
    """
    augmented = [rgb_image]
    pil_img = Image.fromarray(rgb_image)
    h, w = rgb_image.shape[:2]

    augmented.append(np.fliplr(rgb_image).copy())

    for factor in [0.75, 0.85, 1.15, 1.30]:
        enhancer = ImageEnhance.Brightness(pil_img)
        augmented.append(np.array(enhancer.enhance(factor)))

    for factor in [0.8, 1.2]:
        enhancer = ImageEnhance.Contrast(pil_img)
        augmented.append(np.array(enhancer.enhance(factor)))

    augmented.append(cv2.GaussianBlur(rgb_image, (3, 3), 0))

    center = (w // 2, h // 2)
    for angle in [-10, -5, 5, 10]:
        M = cv2.getRotationMatrix2D(center, angle, 1.0)
        rotated = cv2.warpAffine(rgb_image, M, (w, h), borderMode=cv2.BORDER_REPLICATE)
        augmented.append(rotated)

    return augmented


# ═══════════════════════════════════════════════════════════════════════════════
# FACE DETECTION — YOLO + OpenCV fallback
# ═══════════════════════════════════════════════════════════════════════════════


def detect_faces_yolo(rgb_image):
    """
    Detect all faces in an image.
    Robust version:
      1. If YOLO face model exists -> use it.
      2. If general YOLO exists -> use it (it might detect heads/faces as objects).
      3. Fallback: Haar cascade on full frame.
    """
    yolo = _get_yolo()
    faces = []
    h_img, w_img = rgb_image.shape[:2]
    
    if yolo is not None and YOLO_AVAILABLE:
        try:
            bgr = cv2.cvtColor(rgb_image, cv2.COLOR_RGB2BGR)
            # Use lower confidence for multi-face
            results = yolo(bgr, conf=0.15, verbose=False)
            for result in results:
                for box in result.boxes:
                    x1, y1, x2, y2 = map(int, box.xyxy[0].cpu().numpy())
                    conf = float(box.conf[0])
                    cls = int(box.cls[0])
                    
                    # If it's a face model, class 0 is face.
                    # If it's generic YOLO, class 0 is person.
                    is_face_model = "face" in str(getattr(yolo, 'ckpt_path', '')).lower()
                    
                    # For generic model, we might want to crop the top 1/3 for "face"
                    # but for now let's just accept the box if it's small or we're desperate.
                    
                    x1, y1 = max(0, x1), max(0, y1)
                    x2, y2 = min(w_img, x2), min(h_img, y2)
                    if x2 - x1 < 15 or y2 - y1 < 15: continue
                    
                    face_crop = rgb_image[y1:y2, x1:x2]
                    faces.append({
                        "x": x1, "y": y1, "w": x2 - x1, "h": y2 - y1,
                        "confidence": conf, "face_crop": face_crop
                    })
            if faces:
                return faces
        except Exception as e:
            logger.error(f"YOLO detection error: {e}")

    # ── Fallback to Haar Cascade (Reliable and Fast) ──
    try:
        cascade = _get_haar_cascade()
        gray = cv2.cvtColor(rgb_image, cv2.COLOR_RGB2GRAY)
        gray = cv2.equalizeHist(gray)
        
        # Detect multiple sizes - more aggressive parameters for small faces
        rects = cascade.detectMultiScale(
            gray, scaleFactor=1.05, minNeighbors=3, 
            minSize=(30, 30), flags=cv2.CASCADE_SCALE_IMAGE
        )
        
        for (x, y, w, h) in rects:
            x, y = max(0, x), max(0, y)
            x2, y2 = min(w_img, x + w), min(h_img, y + h)
            face_crop = rgb_image[y:y2, x:x2]
            faces.append({
                "x": x, "y": y, "w": w, "h": h,
                "confidence": 0.5, # Haar doesn't provide confidence
                "face_crop": face_crop
            })
            
        if faces:
            logger.info(f"Haar detected {len(faces)} face(s)")
            return faces
    except Exception as e:
        logger.error(f"Haar detection error: {e}")

    return faces


# ═══════════════════════════════════════════════════════════════════════════════
# EMBEDDING EXTRACTION
# ═══════════════════════════════════════════════════════════════════════════════


def get_embedding(rgb_image, already_cropped=False):
    """
    Extract face embedding using DeepFace VGG-Face model.
    Returns normalized embedding vector.
    """
    DeepFace = _get_deepface()
    temp_path = None
    try:
        pil_img = Image.fromarray(rgb_image)
        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
            temp_path = tmp.name
            pil_img.save(tmp, format="JPEG")

        # Optimization: if already cropped by YOLO/Haar, skip redundant detection
        if already_cropped:
            detector_backends = ["skip", "opencv"]
        else:
            detector_backends = ["opencv", "ssd", "skip"]

        result = None
        for backend in detector_backends:
            try:
                result = DeepFace.represent(
                    img_path=temp_path,
                    model_name=MODEL_NAME,
                    enforce_detection=(backend != "skip"),
                    detector_backend=backend,
                    align=True
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
    Detect ALL faces in a frame using YOLO (fast) then extract embedding per face.
    Returns list of {embedding, facial_area, detection_confidence}
    """
    faces = detect_faces_yolo(rgb_image)
    results = []

    for face_info in faces:
        face_crop = face_info["face_crop"]
        if face_crop is None or face_crop.size == 0:
            continue
            
        # Resize for faster embedding
        try:
            face_resized = cv2.resize(face_crop, (224, 224))
        except Exception:
            face_resized = face_crop

        # We pass already_cropped=True to skip redundant detection in DeepFace
        emb = get_embedding(face_resized, already_cropped=True)
        
        # We append even if emb is None, to show a box on UI
        results.append({
            "embedding": emb, # May be None
            "facial_area": {
                "x": face_info["x"],
                "y": face_info["y"],
                "w": face_info["w"],
                "h": face_info["h"],
            },
            "detection_confidence": face_info["confidence"],
        })

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
    2. For each image: generate augmented variations
    3. Extract face embedding from each augmented image
    4. Average ALL valid embeddings into one robust master vector
    5. Save as {student_id}.npy in ENCODINGS_DIR
    """
    all_embeddings = []
    failed_indices = []
    processed_originals = 0

    for idx, b64 in enumerate(base64_images):
        rgb = decode_base64_image(b64)
        if rgb is None:
            failed_indices.append(idx + 1)
            continue

        # Try YOLO crop first for cleaner face
        faces = detect_faces_yolo(rgb)
        if faces:
            rgb = cv2.resize(faces[0]["face_crop"], (224, 224))

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
            logger.info(f"Registered sample {idx + 1}: {aug_count} augmented embeddings")
        else:
            failed_indices.append(idx + 1)
            logger.warning(f"Sample {idx + 1}: no face detected")

    if len(all_embeddings) < 1:
        return {
            "success": False,
            "message": "No valid face detected in any image. Ensure good lighting and face clearly visible.",
            "encoding_count": 0,
            "failed_indices": failed_indices,
        }

    master_embedding = np.mean(all_embeddings, axis=0)
    norm = np.linalg.norm(master_embedding)
    if norm > 0:
        master_embedding = master_embedding / norm

    npy_path = os.path.join(ENCODINGS_DIR, f"{student_id}.npy")
    np.save(npy_path, master_embedding)
    logger.info(f"Saved embedding for {student_id}: {processed_originals} originals, {len(all_embeddings)} augmented")

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

    # Use YOLO to crop face first
    faces = detect_faces_yolo(rgb)
    if faces:
        face_rgb = cv2.resize(faces[0]["face_crop"], (224, 224))
    else:
        face_rgb = rgb

    live_embedding = get_embedding(face_rgb)
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
# RECOGNITION — MULTI-FACE (classroom scanning) — YOLO powered
# ═══════════════════════════════════════════════════════════════════════════════


def recognize_multi_faces(b64_frame, session_id=None):
    """
    Detect and recognize ALL faces in a single frame using YOLO + DeepFace.
    Used for classroom-wide attendance scanning.

    Returns:
      {
        "faces_detected": int,
        "recognized": [
          {"student_id": ..., "confidence": ..., "facial_area": ...},
        ],
        "unknown_count": int,
        "bounding_boxes": [{"x":..,"y":..,"w":..,"h":..,"label":..,"confidence":..}]
      }
    """
    rgb = decode_base64_image(b64_frame)
    if rgb is None:
        return {"faces_detected": 0, "recognized": [], "unknown_count": 0,
                "bounding_boxes": [], "message": "Cannot decode frame"}

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
                "bounding_boxes": [],
            }
        return {"faces_detected": 0, "recognized": [], "unknown_count": 0,
                "bounding_boxes": [], "message": "No faces detected"}

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
    bounding_boxes = []

    for face in face_data:
        live_emb = face["embedding"]
        area = face.get("facial_area", {})
        best_sid = None
        best_score = 0.0

        if live_emb is not None:
            for sid, stored_emb in stored_embeddings.items():
                score = cosine_similarity(live_emb, stored_emb)
                if score > best_score:
                    best_score = score
                    best_sid = sid

        if best_score >= SIMILARITY_THRESHOLD and best_sid:
            recognized.append({
                "student_id": best_sid,
                "confidence": round(best_score * 100, 2),
                "facial_area": area,
            })
            bounding_boxes.append({
                "x": area.get("x", 0),
                "y": area.get("y", 0),
                "w": area.get("w", 0),
                "h": area.get("h", 0),
                "label": best_sid,
                "confidence": round(best_score * 100, 1),
                "recognized": True,
            })
        else:
            unknown_count += 1
            bounding_boxes.append({
                "x": area.get("x", 0),
                "y": area.get("y", 0),
                "w": area.get("w", 0),
                "h": area.get("h", 0),
                "label": "Unknown",
                "confidence": round(best_score * 100, 1),
                "recognized": False,
            })

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
        "bounding_boxes": bounding_boxes,
        "snapshot_path": f"attendance_snapshots/{today}/{os.path.basename(snap_path)}",
    }
