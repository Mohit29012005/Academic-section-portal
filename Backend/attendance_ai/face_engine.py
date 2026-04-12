import os
import base64
import numpy as np
import cv2
from PIL import Image
from deepface import DeepFace
from django.conf import settings

ENCODINGS_DIR = os.path.join(settings.MEDIA_ROOT, "face_encodings")
SNAPSHOTS_DIR = os.path.join(settings.MEDIA_ROOT, "attendance_snapshots")
MODEL_NAME = "VGG-Face"
SIMILARITY_THRESHOLD = 0.40

os.makedirs(ENCODINGS_DIR, exist_ok=True)
os.makedirs(SNAPSHOTS_DIR, exist_ok=True)


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
        print(f"[face_engine] decode_base64_image error: {e}")
        return None


def get_embedding(rgb_image):
    """
    Extract face embedding using DeepFace VGG-Face model.
    Returns 4096D embedding vector.
    """
    import tempfile

    temp_path = None
    try:
        pil_img = Image.fromarray(rgb_image)
        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
            temp_path = tmp.name
            pil_img.save(tmp, format="JPEG")

        result = DeepFace.represent(
            img_path=temp_path,
            model_name=MODEL_NAME,
            enforce_detection=True,
            detector_backend="opencv",
        )

        if result and len(result) > 0:
            embedding = np.array(result[0]["embedding"], dtype=np.float32)
            embedding = embedding / np.linalg.norm(embedding)
            return embedding
        return None
    except Exception as e:
        print(f"[face_engine] get_embedding error: {e}")
        return None
    finally:
        if temp_path and os.path.exists(temp_path):
            try:
                os.unlink(temp_path)
            except:
                pass


def cosine_similarity(vec1, vec2):
    """Cosine similarity between two vectors."""
    norm1 = np.linalg.norm(vec1)
    norm2 = np.linalg.norm(vec2)
    if norm1 == 0 or norm2 == 0:
        return 0.0
    return float(np.dot(vec1, vec2) / (norm1 * norm2))


def register_face(student_id, base64_images):
    """
    Registration flow:
    1. Take 3-5 base64 images from browser webcam
    2. Extract face embedding from each using VGG-Face
    3. Average all valid embeddings into one master vector
    4. Save as {student_id}.npy in ENCODINGS_DIR
    """
    embeddings = []
    failed_indices = []

    for idx, b64 in enumerate(base64_images):
        rgb = decode_base64_image(b64)
        if rgb is None:
            failed_indices.append(idx + 1)
            continue

        embedding = get_embedding(rgb)
        if embedding is None:
            failed_indices.append(idx + 1)
            continue

        embeddings.append(embedding)
        print(
            f"[face_engine] Registered sample {idx + 1}: embedding shape {embedding.shape}"
        )

    if len(embeddings) < 2:
        return {
            "success": False,
            "message": f"Only {len(embeddings)} valid face(s) found. Ensure good lighting and face clearly visible.",
            "encoding_count": len(embeddings),
            "failed_indices": failed_indices,
        }

    master_embedding = np.mean(embeddings, axis=0)
    master_embedding = master_embedding / np.linalg.norm(master_embedding)

    npy_path = os.path.join(ENCODINGS_DIR, f"{student_id}.npy")
    np.save(npy_path, master_embedding)
    print(
        f"[face_engine] Saved embedding for {student_id} with {len(embeddings)} samples"
    )

    return {
        "success": True,
        "message": f"Face registered with {len(embeddings)} samples.",
        "encoding_count": len(embeddings),
        "encoding_path": npy_path,
        "failed_indices": failed_indices,
    }


def recognize_face(b64_frame, session_id=None):
    """Compare face against stored embeddings and return best match."""
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
            print(f"[face_engine] Failed to load {fpath}: {e}")
            continue

        score = cosine_similarity(live_embedding, stored_embedding)
        print(
            f"[face_engine] Compared with {student_id}: score={score:.4f}, threshold={SIMILARITY_THRESHOLD}"
        )

        if score > best_score:
            best_score = score
            best_student_id = student_id

    print(f"[face_engine] Best match: {best_student_id} with score {best_score:.4f}")
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

    if session_id:
        snap_path = os.path.join(snap_dir, f"{best_student_id}_{session_id}.jpg")
    else:
        snap_path = os.path.join(snap_dir, f"{best_student_id}.jpg")

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
