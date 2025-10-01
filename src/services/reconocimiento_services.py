import os
import json
import base64
import numpy as np
import cv2
import face_recognition  # Usamos face_recognition en lugar de dlib
from typing import List, Dict, Tuple, Optional

# ---------------- Configuración ----------------
UPLOADS_DIR = os.path.join("uploads")  # Ruta a la carpeta de imágenes
DB_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "face_db")
ENC_PATH = os.path.join(DB_DIR, "encodings.npy")
LAB_PATH = os.path.join(DB_DIR, "labels.json")

# ---------------- Utilidades DB ----------------
def ensure_dirs():
    os.makedirs(DB_DIR, exist_ok=True)
    os.makedirs(UPLOADS_DIR, exist_ok=True)

def load_db() -> Tuple[np.ndarray, List[Dict[str, str]]]:
    ensure_dirs()  # Asegura que las carpetas existan
    if os.path.exists(ENC_PATH) and os.path.exists(LAB_PATH):
        encodings = np.load(ENC_PATH)
        with open(LAB_PATH, "r", encoding="utf-8") as f:
            labels = json.load(f)
        return encodings.astype(np.float32), labels
    # Si no existen, devolvemos valores vacíos
    return np.empty((0, 128), dtype=np.float32), []


def save_db(encodings: np.ndarray, labels: List[Dict[str, str]]):
    """
    Guarda los embeddings y etiquetas en los archivos correspondientes.
    Asegura que no haya duplicados en los embeddings y que los archivos se actualicen correctamente.
    """
    # Guardamos los embeddings
    np.save(ENC_PATH, encodings)
    
    # Guardamos las etiquetas
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
    rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
    # Detectar las ubicaciones de las caras
    face_locations = face_recognition.face_locations(rgb)
    
    if not face_locations:
        return None
    
    # Extraer los embeddings de las caras detectadas
    face_encodings = face_recognition.face_encodings(rgb, face_locations)
    return face_encodings[0] if face_encodings else None


def normalize(vec):
    norm = np.linalg.norm(vec)
    return vec if norm == 0 else vec / norm

def cosine_distance(a, b):
    a_norm = normalize(a)
    b_norm = normalize(b)
    return 1 - np.dot(a_norm, b_norm)
