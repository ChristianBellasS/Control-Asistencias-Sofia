from src.models.models import db
from src.models.models import Personal, TipoPersonal

# Servicio para crear un nuevo registro de personal
def crear_personal_service(nombres, apellido_paterno, apellido_materno, grado, tipo_personal_id, seccion, estado, photo_paths):
    try:
        # Lógica para crear y guardar al personal en la base de datos
        persona = Personal(nombres=nombres, apellido_paterno=apellido_paterno, apellido_materno=apellido_materno,
                           grado=grado, tipo_personal_id=tipo_personal_id, seccion=seccion, estado=estado)

        # Agregar las fotos si es necesario, etc.
        for path in photo_paths:
            # Aquí iría la lógica para agregar las fotos si es necesario
            pass

        db.session.add(persona)
        db.session.commit()  # Se confirma la transacción

        # Devolver el objeto persona con su ID generado
        return persona
    except Exception as e:
        print(f"Error al crear el personal: {str(e)}")
        return None



# Servicio para editar los datos de una persona
def editar_personal_service(persona, nombres, apellido_paterno, apellido_materno, grado, tipo_personal_id, seccion, estado, foto_url=None, foto_vector=None):
    persona.nombres = nombres
    persona.apellido_paterno = apellido_paterno
    persona.apellido_materno = apellido_materno
    persona.grado = grado
    persona.tipo_personal_id = tipo_personal_id
    persona.seccion = seccion
    persona.estado = estado
    persona.url_foto = foto_url
    persona.foto_vector = foto_vector
    db.session.commit()


# Servicio para cambiar el estado de un registro de personal a "INACTIVO"
def eliminar_personal_service(persona):
    persona.estado = 'INACTIVO'
    db.session.commit()

def obtener_personal():
    # Obtener todos los roles activos de la base de datos
    personal = TipoPersonal.query.all()

    # Convertir los objetos de TipoPersonal a un formato adecuado para JSON
    roles = [{'rol_id': p.id, 'nombre': p.tipo} for p in personal]

    # Imprimir para depuración
    print(f"Personales recuperados: {roles}")

    return roles  # Devolvemos una lista de diccionarios

def activar_personal_service(persona):
    try:
        persona.estado = 'ACTIVO' 
        db.session.commit() 
        return persona 
    except Exception as e:
        print(f"Error al activar el personal: {str(e)}")
        return None
    
def filtrar_personal(tipo_personal, grado, seccion):
    """Filtra el personal según tipo de personal, grado y sección"""
    query = Personal.query

    # Filtrar por tipo de personal si se proporciona
    if tipo_personal:
        query = query.filter(Personal.tipo_personal_id == tipo_personal)

    # Filtrar por grado si se proporciona y es Alumna
    if grado:
        query = query.filter(Personal.grado == grado)

    # Filtrar por sección si se proporciona y es Alumna
    if seccion:
        query = query.filter(Personal.seccion == seccion)

    # Obtener los resultados filtrados
    resultados = query.all()

    # Devolver los resultados como una lista de diccionarios
    return [{
        'id': persona.id,
        'nombre': f'{persona.nombres} {persona.apellido_paterno} {persona.apellido_materno}'
    } for persona in resultados]