from flask import Blueprint, jsonify, render_template, request, redirect, url_for, flash
from src.models.models import db, Asistencia, Personal, TipoPersonal
from src.services.asistencias_services import obtener_asistencias, guardar_asistencia_service, eliminar_asistencia_service
from src.services.personal_service import crear_personal_service, editar_personal_service, eliminar_personal_service, obtener_personal
from datetime import datetime, timedelta
from sqlalchemy.orm import joinedload
from sqlalchemy import func
import pytz

main = Blueprint('asistencias', __name__, url_prefix='/asistencias')

LIMA_TZ = pytz.timezone("America/Lima")
def rango_dia_lima(yyyy=None, mm=None, dd=None):
    if yyyy is None:
        ahora = datetime.now(LIMA_TZ)
        inicio = ahora.replace(hour=0, minute=0, second=0, microsecond=0)
    else:
        inicio = LIMA_TZ.localize(datetime(yyyy, mm, dd, 0, 0, 0))
    fin = inicio + timedelta(days=1) - timedelta(microseconds=1)
    return inicio, fin

@main.route('/listar_asistencias')
def listar_asistencias():
    return render_template('asistencias.html')

@main.route('/listar')
def listar_json():
    """
    JSON con filtros:
      ?tipo=ALUMNA|DOCENTE...
      &grado=1..5
      &seccion=A..J
      &fecha=YYYY-MM-DD  (por defecto: HOY Lima)
      &q=busqueda por nombre
      &page=1&per_page=10
    """
    tipo = (request.args.get('tipo') or '').strip()
    grado = (request.args.get('grado') or '').strip()
    seccion = (request.args.get('seccion') or '').strip()
    q = (request.args.get('q') or '').strip()
    fecha_str = (request.args.get('fecha') or '').strip()
    page = max(int(request.args.get('page', 1)), 1)
    per_page = min(max(int(request.args.get('per_page', 10)), 1), 100)

    # Rango de fecha (por defecto HOY Lima)
    if fecha_str:
        try:
            y, m, d = map(int, fecha_str.split('-'))
            inicio, fin = rango_dia_lima(y, m, d)
        except Exception:
            inicio, fin = rango_dia_lima()
    else:
        inicio, fin = rango_dia_lima()

    # Query base
    query = (
        Asistencia.query
        .options(joinedload(Asistencia.personal).joinedload(Personal.tipo_personal))
        .join(Personal, Asistencia.personal)
        .join(TipoPersonal, Personal.tipo_personal)
        .filter(Asistencia.fecha_registro.between(inicio, fin))
        .order_by(Asistencia.fecha_registro.desc())
    )

    # Filtro por tipo
    if tipo:
        query = query.filter(func.lower(TipoPersonal.tipo) == tipo.lower())

    # Si es ALUMNA, filtra grado/sección (solo si vienen)
    if tipo.lower() == 'alumna':
        if grado:
            query = query.filter(func.lower(Personal.grado) == grado.lower())
        if seccion:
            query = query.filter(func.lower(Personal.seccion) == seccion.lower())

    # Búsqueda por nombre completo
    if q:
        buscado = f"%{q.lower()}%"
        query = query.filter(
            func.lower(
                func.concat(
                    Personal.nombres, " ",
                    Personal.apellido_paterno, " ",
                    func.coalesce(Personal.apellido_materno, "")
                )
            ).like(buscado)
        )

    total = query.count()
    items = query.offset((page - 1) * per_page).limit(per_page).all()

    def row(a: Asistencia):
        p = a.personal
        # Mostrar en zona Lima por coherencia con filtros
        fh = a.fecha_registro.astimezone(LIMA_TZ)
        return {
            "id": a.id,
            "nombre_completo": f"{p.nombres} {p.apellido_paterno} {p.apellido_materno or ''}".strip(),
            "grado": p.grado or "NO APLICA",
            "seccion": p.seccion or "NO APLICA",
            "fecha_hora": fh.strftime("%Y-%m-%d %H:%M:%S"),
            "fecha": fh.strftime("%Y-%m-%d"),
            "asistencia": "PRESENTE" if a.asistencia else "AUSENTE",
            "tipo": p.tipo_personal.tipo,
            "data": {
                "tipo": (p.tipo_personal.tipo or '').lower(),
                "grado": (p.grado or '').lower(),
                "seccion": (p.seccion or '').lower(),
                "fecha": fh.strftime("%Y-%m-%d"),
            }
        }

    return jsonify({
        "page": page,
        "per_page": per_page,
        "total": total,
        "total_pages": (total + per_page - 1) // per_page,
        "items": [row(a) for a in items]
    })

@main.route('/registrar_asistencia', methods=['GET'])
def registrar_asistencia():
    personal = obtener_personal()
    return render_template('registrar_asistencia.html', personal=personal)

# Ruta para guardar la asistencia
@main.route('/guardar_asistencia', methods=['POST'])
def guardar_asistencia():
    data = request.get_json()  # Esto maneja JSON correctamente

    # Asegúrate de que los datos se reciban correctamente
    print("Datos recibidos:", data)

    tipo_personal_id = data.get('rol')
    grado = data.get('grado')
    seccion = data.get('seccion')
    nombre_personal = data.get('nombre_personal')
    fecha = data.get('fecha')
    asistencia = data.get('asistencia') == '1'  # Convertir de string a booleano
    id_personal = data.get('id_personal')  # Obtener el ID del personal

    print("ID recibido:", id_personal)  # Verificar el ID recibido

    # Buscar al personal por ID
    personal = Personal.query.filter_by(id=id_personal).first()

    if personal:
        # Guardar la asistencia
        guardar_asistencia_service(personal.id, fecha, asistencia)
        return jsonify({"success": True}), 200
    else:
        return jsonify({"success": False, "message": "El personal no fue encontrado"}), 400

@main.route('/eliminar_asistencia/<int:asistencia_id>', methods=['POST'])
def eliminar_asistencia(asistencia_id):
    # Llamamos al servicio para eliminar la asistencia
    eliminado = eliminar_asistencia_service(asistencia_id)
    
    if eliminado:
        return jsonify({"success": True, "message": "Asistencia eliminada exitosamente."}), 200
    else:
        return jsonify({"success": False, "message": "Hubo un problema al eliminar la asistencia."}), 400