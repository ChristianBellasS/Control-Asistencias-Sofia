import os
import numpy as np
import cv2
from flask import Blueprint, jsonify, render_template, request, send_from_directory, url_for
from src.services.reconocimiento_services import load_db, save_db, b64_to_bgr_image, extract_face_embedding, cosine_distance, should_process_request
from src.models.models import db, Personal, Asistencia
import datetime
from datetime import datetime

# Configuración de rutas y directorios
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOADS_DIR = os.path.join(BASE_DIR, "..", "uploads")
DB_DIR = os.path.join(BASE_DIR, "..", "face_db")
ENC_PATH = os.path.join(DB_DIR, "encodings.npy")
LAB_PATH = os.path.join(DB_DIR, "labels.json")

MATCH_THRESHOLD = float(os.environ.get("FACE_MATCH_THRESHOLD", 0.05))

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
    # Control de tasa de requests - si hay muchos requests, rechazar algunos
    if not should_process_request():
        return jsonify({
            "ok": True, 
            "skipped": True, 
            "message": "Request skipped due to rate limiting"
        }), 200
    
    encodings, labels = load_db()
    data = request.get_json(force=True)
    img_data = data.get("image")

    if not img_data:
        return jsonify({"ok": False, "error": "no_image"}), 400

    frame = b64_to_bgr_image(img_data)
    if frame is None:
        return jsonify({"ok": False, "error": "decode_failed"}), 400

    emb = extract_face_embedding(frame)
    if emb is None:
        return jsonify({"ok": True, "recognized": False, "reason": "no_face"})

    if encodings.size == 0:
        return jsonify({"ok": True, "recognized": False, "reason": "db_empty"})

    min_dist = float('inf')
    recognized_person = None

    # Comparar con todos los rostros registrados
    for idx, person in enumerate(labels):
        person_embedding = encodings[idx]
        
        # Normalización de los embeddings
        person_embedding = person_embedding / np.linalg.norm(person_embedding)
        emb = emb / np.linalg.norm(emb)

        dist = cosine_distance(person_embedding, emb)

        if dist < min_dist:
            min_dist = dist
            recognized_person = person

    # Si no hay coincidencia con las personas registradas
    if min_dist >= MATCH_THRESHOLD:
        # Guardar foto en la carpeta 'desconocidos'
        unknown_folder = os.path.join(BASE_DIR, "..", "desconocidos")
        
        if not os.path.exists(unknown_folder):
            os.makedirs(unknown_folder)

        # Verificar si ya existe un desconocido con la misma distancia
        unknown_images = os.listdir(unknown_folder)
        similar_found = False
        similar_image_path = ""
        
        for unknown_image in unknown_images:
            unknown_image_path = os.path.join(unknown_folder, unknown_image)
            unknown_image_bgr = cv2.imread(unknown_image_path)
            unknown_emb = extract_face_embedding(unknown_image_bgr)

            if unknown_emb is not None:
                unknown_emb = unknown_emb / np.linalg.norm(unknown_emb)
                dist_to_unknown = cosine_distance(unknown_emb, emb)

                if dist_to_unknown < MATCH_THRESHOLD:
                    similar_found = True
                    similar_image_path = unknown_image_path
                    break

        if similar_found:
            return jsonify({
                "ok": True,
                "recognized": False,
                "reason": "similar_unknown_person",
                "photo": similar_image_path
            })

        # Si no se encontró una imagen similar, guardamos una nueva
        unknown_id = len(unknown_images) + 1
        unknown_image_path = os.path.join(unknown_folder, f"DESCONOCIDO_{unknown_id}.jpg")
        success = cv2.imwrite(unknown_image_path, frame)
        
        if not success:
            print("Error al guardar la imagen como desconocido.")

        return jsonify({
            "ok": True,
            "recognized": False,
            "reason": "unknown_person",
            "photo": unknown_image_path
        })

    # Si la persona fue reconocida
    if recognized_person:
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
                asistencia.asistencia = True
                asistencia.fecha_registro = datetime.now()
            else:
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