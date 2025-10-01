import os
import numpy as np
import cv2
from flask import Blueprint, jsonify, render_template, request, send_from_directory, url_for
from src.services.reconocimiento_services import load_db, save_db, b64_to_bgr_image, extract_face_embedding, cosine_distance
from src.models.models import db, Personal, Asistencia
import datetime
from datetime import datetime

# Configuración de rutas y directorios
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOADS_DIR = os.path.join(BASE_DIR, "..", "uploads")  # Ruta a la carpeta de imágenes
DB_DIR = os.path.join(BASE_DIR, "..", "face_db")
ENC_PATH = os.path.join(DB_DIR, "encodings.npy")
LAB_PATH = os.path.join(DB_DIR, "labels.json")

MATCH_THRESHOLD = float(os.environ.get("FACE_MATCH_THRESHOLD", 0.5))

main = Blueprint("reconocimiento", __name__, url_prefix="/reconocimiento")

@main.route("/reconocimiento_rostros", methods=["GET"])
def reconocimiento_rostros():
    return render_template("reconocimiento.html")


@main.route("/<path:filename>")
def photos(filename):
    directory = os.path.join(BASE_DIR, "..", "uploads")
    return send_from_directory(directory, filename)

@main.route("/recognize", methods=["POST"])
def recognize():
    encodings, labels = load_db()  # Cargar los embeddings y etiquetas
    data = request.get_json(force=True)
    img_data = data.get("image")  # Obtener la imagen

    if not img_data:
        return jsonify({"ok": False, "error": "no_image"}), 400

    frame = b64_to_bgr_image(img_data)  # Convertir la imagen base64 a una imagen BGR
    if frame is None:
        return jsonify({"ok": False, "error": "decode_failed"}), 400

    emb = extract_face_embedding(frame)  # Extraer el embedding del rostro
    if emb is None:
        return jsonify({"ok": True, "recognized": False, "reason": "no_face"})

    if encodings.size == 0:
        return jsonify({"ok": True, "recognized": False, "reason": "db_empty"})

    min_dist = float('inf')
    recognized_person = None

    for idx, person in enumerate(labels):
        person_embedding = encodings[idx]
        dist = cosine_distance(person_embedding, emb)
        if dist < min_dist:
            min_dist = dist
            recognized_person = person

    if min_dist < MATCH_THRESHOLD:
        persona_id = recognized_person.get("id", None)
        persona = None
        if persona_id:
            persona = Personal.query.filter_by(id=persona_id).first()
        if persona:
            hoy = datetime.now().date()
            
            # Verificar si ya hay un registro de asistencia hoy
            asistencia = Asistencia.query.filter(
                Asistencia.persona_id == persona.id,
                db.func.date(Asistencia.fecha_registro) == hoy
            ).first()

            if asistencia:
                # Si ya existe el registro, actualiza el estado de asistencia
                asistencia.asistencia = True
                asistencia.fecha_registro = datetime.now()
            else:
                # Si no existe, crea un nuevo registro de asistencia
                nueva_asistencia = Asistencia(
                    persona_id=persona.id,
                    fecha_registro=datetime.now(),
                    asistencia=True
                )
                db.session.add(nueva_asistencia)

            db.session.commit()

        photo_rel = recognized_person.get("photos", [])
        photo_url = url_for("reconocimiento.photos", filename=photo_rel[0].replace(" ", "_")).replace("/uploads", "")


        response_data = {
            "ok": True,
            "recognized": True,
            "id": persona.id if persona else "",
            "name": recognized_person.get("name", ""),
            "distance": float(min_dist),
            "photo": photo_url
        }
        return jsonify(response_data)
    else:
        return jsonify({"ok": True, "recognized": False, "distance": float(min_dist)})
