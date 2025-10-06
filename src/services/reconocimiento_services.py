import os
import json
import base64
import numpy as np
import cv2
import face_recognition
from typing import List, Dict, Tuple, Optional
import time
import threading

# ---------------- Configuración ----------------
UPLOADS_DIR = os.path.join("uploads")
DB_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "face_db")
ENC_PATH = os.path.join(DB_DIR, "encodings.npy")
LAB_PATH = os.path.join(DB_DIR, "labels.json")

# ---------------- Control de tasa mejorado ----------------
last_processing_time = 0
processing_lock = threading.Lock()
MIN_TIME_BETWEEN_REQUESTS = 0.2  # 200ms entre requests (5 FPS máximo)

# ---------------- Utilidades DB (sin cambios) ----------------
def ensure_dirs():
    os.makedirs(DB_DIR, exist_ok=True)
    os.makedirs(UPLOADS_DIR, exist_ok=True)

def load_db() -> Tuple[np.ndarray, List[Dict[str, str]]]:
    ensure_dirs()
    if os.path.exists(ENC_PATH) and os.path.exists(LAB_PATH):
        encodings = np.load(ENC_PATH)
        with open(LAB_PATH, "r", encoding="utf-8") as f:
            labels = json.load(f)
        return encodings.astype(np.float32), labels
    return np.empty((0, 128), dtype=np.float32), []

def save_db(encodings: np.ndarray, labels: List[Dict[str, str]]):
    np.save(ENC_PATH, encodings)
    with open(LAB_PATH, "w", encoding="utf-8") as f:
        json.dump(labels, f, ensure_ascii=False, indent=2)
    print(f"Encodings y labels guardados en: {ENC_PATH}, {LAB_PATH}")

def b64_to_bgr_image(data_url: str) -> Optional[np.ndarray]:
    try:
        header, b64data = data_url.split(",", 1)
    except ValueError:
        b64data = data_url
    binary = base64.b64decode(b64data)
    npimg = np.frombuffer(binary, np.uint8)
    img = cv2.imdecode(npimg, cv2.IMREAD_COLOR)
    return img

def extract_face_embedding(image_bgr: np.ndarray) -> Optional[np.ndarray]:
    """Extrae el embedding del rostro de la imagen dada."""
    rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
    
    face_locations = face_recognition.face_locations(rgb)
    
    if not face_locations:
        return None
    
    face_encodings = face_recognition.face_encodings(rgb, face_locations)
    
    if not face_encodings:
        return None
    
    return face_encodings[0]

def normalize(vec):
    norm = np.linalg.norm(vec)
    epsilon = 1e-6
    return vec if norm < epsilon else vec / norm

def cosine_distance(a, b):
    a_norm = normalize(a)
    b_norm = normalize(b)
    return 1 - np.dot(a_norm, b_norm)

def should_process_request() -> bool:
    """Control mejorado de tasa de procesamiento"""
    global last_processing_time
    current_time = time.time()
    
    with processing_lock:
        time_since_last = current_time - last_processing_time
        if time_since_last >= MIN_TIME_BETWEEN_REQUESTS:
            last_processing_time = current_time
            return True
        return False