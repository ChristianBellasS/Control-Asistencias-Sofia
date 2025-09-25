from flask import Blueprint, jsonify, render_template, request, redirect, url_for
from src.models.models import db, Personal, TipoPersonal
from src.services.personal_service import crear_personal_service, editar_personal_service, eliminar_personal_service, obtener_personal
from src.services.reconocimiento_services import b64_to_bgr_image, extract_face_embedding, save_db, load_db
import os
import time
import cv2
import numpy as np
import face_recognition  # Usamos face_recognition en lugar de dlib

# Crear el blueprint
main = Blueprint("personal", __name__, url_prefix="/personal")

# ---------------- Configuración ----------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOADS_DIR = os.path.join("uploads")  # Ruta a la carpeta de imágenes
DB_DIR = os.path.join(BASE_DIR, "..", "face_db")  # Ruta a la base de datos de embeddings
ENC_PATH = os.path.join(DB_DIR, "encodings.npy")
LAB_PATH = os.path.join(DB_DIR, "labels.json")

DOWNSCALE = float(os.environ.get("FRAME_DOWNSCALE", 0.5))  # Reducir resolución para optimizar

# Asegurar que las carpetas necesarias existan
def ensure_dirs():
    os.makedirs(UPLOADS_DIR, exist_ok=True)
    os.makedirs(DB_DIR, exist_ok=True)

# ---------------- Ruta para crear un nuevo personal ----------------
# Ruta para crear un nuevo personal
@main.route('/crear_personal', methods=['POST'])
def crear_personal():
    try:
        data = request.get_json()

        if not data:
            return jsonify({"message": "Datos incompletos o mal formateados."}), 400

        nombres = data.get('nombres')
        apellido_paterno = data.get('apellido_paterno')
        apellido_materno = data.get('apellido_materno')
        grado = data.get('grado')
        tipo_personal_id = data.get('tipo_personal')
        estado = data.get('estado')
        seccion = data.get('seccion')
        fotos_base64 = data.get('fotos')

        if tipo_personal_id is None or tipo_personal_id == 'undefined':
            return jsonify({"message": "Tipo de personal inválido."}), 400

        if not fotos_base64 or len(fotos_base64) == 0:
            return jsonify({"message": "No se proporcionaron fotos."}), 400

        ensure_dirs()

        photo_paths = []
        embeddings = []

        for i, foto_url in enumerate(fotos_base64):
            image_bgr = b64_to_bgr_image(foto_url)
            if image_bgr is None:
                return jsonify({"message": f"No se pudo decodificar la imagen {i+1}."}), 400

            emb = extract_face_embedding(image_bgr)
            if emb is None:
                return jsonify({"message": f"No se detectó rostro en la imagen {i+1}."}), 400

            embeddings.append(emb)

            ts = int(time.time())
            photo_filename = f"{nombres}_{apellido_paterno}_{ts}_{i+1}.jpg"
            photo_path = os.path.join(UPLOADS_DIR, photo_filename)
            cv2.imwrite(photo_path, image_bgr)
            photo_paths.append(photo_path)

        if not embeddings:
            return jsonify({"message": "No se pudo extraer rostro de las imágenes proporcionadas."}), 400

        # Cargar encodings y labels
        encodings, labels = load_db()

        mean_embedding = np.mean(embeddings, axis=0)
        encodings = np.vstack([encodings, mean_embedding]) if encodings.size else mean_embedding.reshape(1, -1)

        # Registrar el nuevo personal
        persona = crear_personal_service(nombres, apellido_paterno, apellido_materno, grado, tipo_personal_id, seccion, estado, photo_paths)
        
        if persona is None:
            return jsonify({"message": "Error al registrar el personal."}), 500

        # Normalizar las rutas de las fotos
        normalized_photo_paths = [path.replace("\\", "/") for path in photo_paths]
        labels.append({
            "id": persona.id,
            "name": f"{persona.nombres} {persona.apellido_paterno}",
            "photos": normalized_photo_paths
        })

        # Guardar encodings y labels
        save_db(encodings, labels)

        return jsonify({"message": "Personal registrado y rostro procesado exitosamente!"}), 200
    except Exception as e:
        print(f"Error en el proceso de registro: {str(e)}")
        return jsonify({"message": f"Error interno: {str(e)}"}), 500


# Ruta para listar todos los registros de personal
@main.route('/personal')
def listar_personal():
    personas = Personal.query.all()
    personal = obtener_personal()  # Obtener todos los registros de personal
    return render_template('personal.html', personas=personas, personal=personal)

# Ruta para registrar un nuevo personal
@main.route('/registrar_personal')
def registrar_personal():
    personal = obtener_personal()  # Obtener los roles desde la base de datos
    return render_template('registro_personal.html', personal=personal)

@main.route('/obtener_personal_todos', methods=['GET'])
def obtener_personal_todos():
    try:
        # Obtener todos los roles activos de la base de datos
        personal = TipoPersonal.query.all()
        roles = [{'rol_id': p.id, 'nombre': p.tipo} for p in personal]  # Preparar la respuesta
        return jsonify(roles)  # Devolver los roles en formato JSON
    except Exception as e:
        print(f"Error al obtener los roles: {e}")
        return jsonify({'error': 'No se pudieron cargar los roles.'}), 500

@main.route('/eliminar/<int:persona_id>', methods=['GET'])
def eliminar_personal(persona_id):
    try:
        persona = Personal.query.get(persona_id)
        if persona:
            persona.estado = 'INACTIVO'
            db.session.commit()
            return jsonify({"message": "¡Registro eliminado exitosamente!"}), 200
        else:
            return jsonify({"message": "Personal no encontrado."}), 404
    except Exception as e:
        print(f"Error al eliminar: {str(e)}")
        return jsonify({"message": "Error al eliminar el personal."}), 500

