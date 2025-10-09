from src.models.models import db, Asistencia, Personal, TipoPersonal
from datetime import datetime

def obtener_asistencias():
    # Hacemos join para traer toda la info del personal y tipo de personal
    return Asistencia.query.join(Personal).join(TipoPersonal).all()

def guardar_asistencia_service(personal_id, fecha_asistencia, asistencia):
    # Crear una nueva entrada de asistencia
    nueva_asistencia = Asistencia(persona_id=personal_id, fecha_registro=fecha_asistencia, asistencia=asistencia)
    
    # Agregar y guardar la asistencia
    db.session.add(nueva_asistencia)
    db.session.commit()

def eliminar_asistencia_service(asistencia_id):
    try:
        # Buscar la asistencia en la base de datos
        asistencia = Asistencia.query.get(asistencia_id)
        
        if asistencia:
            # Si la asistencia existe, eliminarla
            db.session.delete(asistencia)
            db.session.commit()
            return True  # Eliminación exitosa
        else:
            return False  # Si no se encuentra la asistencia con ese ID
    except Exception as e:
        print(f"Error al eliminar la asistencia: {str(e)}")
        db.session.rollback()  # Rollback en caso de error
        return False  # Si ocurre algún error