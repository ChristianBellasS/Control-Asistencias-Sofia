import os
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash
from src.models.models import db, Usuario, Rol
from werkzeug.security import generate_password_hash
from cryptography.hazmat.primitives.kdf.scrypt import Scrypt
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.backends import default_backend
from sqlalchemy import func
from datetime import datetime


def hash_password_scrypt(password: str) -> str:
    # Crear un salt aleatorio
    salt = os.urandom(16)

    # Configurar el Scrypt KDF
    kdf = Scrypt(
        salt=salt,
        length=64,  # La longitud de la clave derivada
        n=32768,  # Iteraciones
        r=8,  # Memory
        p=1,  # Parallelization
        backend=default_backend()
    )

    # Hash la contraseña con scrypt
    key = kdf.derive(password.encode())  # Derivar el hash de la contraseña

    # Devolver el hash y el salt como una cadena
    return f"scrypt:32768:8:1${salt.hex()}${key.hex()}"

def crear_usuario(datos_usuario):
    # Validaciones

    # Validar longitud del DNI (debe ser exactamente 8 caracteres)
    if len(datos_usuario['dni']) != 8:
        raise ValueError("El DNI debe tener exactamente 8 caracteres.")
    
    # Validar longitud del nombre de usuario (ajustar el límite según tus necesidades)
    if len(datos_usuario['usuario']) > 50:
        raise ValueError("El nombre de usuario no puede tener más de 50 caracteres.")
    
    # Validar formato del correo electrónico
    import re
    if not re.match(r"[^@]+@[^@]+\.[^@]+", datos_usuario['correo_electronico']):
        raise ValueError("El correo electrónico no es válido.")
    
    # Validar longitud del teléfono (debe tener 9 caracteres, por ejemplo)
    if len(datos_usuario['telefono']) != 9:
        raise ValueError("El número de teléfono debe tener exactamente 9 caracteres.")

    # Validar longitud de los nombres y apellidos (si se necesita)
    if len(datos_usuario['nombres']) > 100:
        raise ValueError("El nombre no puede tener más de 100 caracteres.")
    if len(datos_usuario['apellido_paterno']) > 50:
        raise ValueError("El apellido paterno no puede tener más de 50 caracteres.")
    if len(datos_usuario['apellido_materno']) > 50:
        raise ValueError("El apellido materno no puede tener más de 50 caracteres.")
    
    # Hashear la contraseña
    contrasena_hash = generate_password_hash(datos_usuario['contrasena'])

    # Crear usuario
    nuevo_usuario = Usuario(
        usuario=datos_usuario['usuario'],
        contrasena=contrasena_hash,
        nombres=datos_usuario['nombres'],
        apellido_paterno=datos_usuario['apellido_paterno'],
        apellido_materno=datos_usuario['apellido_materno'],
        dni=datos_usuario['dni'],
        telefono=datos_usuario['telefono'],
        correo_electronico=datos_usuario['correo_electronico'],
        estado="PENDIENTE",  # Estado inicial
        rol_id=int(datos_usuario['rol_id']),  # Asignar rol
    )

    # Agregar el nuevo usuario a la base de datos
    db.session.add(nuevo_usuario)
    db.session.commit()

    # Verificar si existe una foto y guardarla
    foto = datos_usuario.get('foto')
    if foto:
        try:
            nombre_foto = guardar_foto(foto, nuevo_usuario.user_id)
            nuevo_usuario.foto = nombre_foto
            db.session.commit()
        except Exception as err:
            print("❌ Error al guardar la foto:", err)
            db.session.rollback()  # Deshacer cambios en caso de error

    return nuevo_usuario



def actualizar_usuario(usuario_id, datos_usuario):
    # Buscar el usuario existente
    usuario = Usuario.query.get(usuario_id)

    if not usuario:
        return None  # Usuario no encontrado

    # Actualizar solo si se recibió un nuevo valor, si no, dejar el anterior
    usuario.usuario = datos_usuario.get('usuario', usuario.usuario)
    usuario.nombres = datos_usuario.get('nombres', usuario.nombres)
    usuario.apellido_paterno = datos_usuario.get('apellido_paterno', usuario.apellido_paterno)
    usuario.apellido_materno = datos_usuario.get('apellido_materno', usuario.apellido_materno)
    usuario.dni = datos_usuario.get('dni', usuario.dni)
    usuario.telefono = datos_usuario.get('telefono', usuario.telefono)
    usuario.correo_electronico = datos_usuario.get('correo_electronico', usuario.correo_electronico)
    usuario.estado = datos_usuario.get('estado', usuario.estado)
    usuario.rol_id = datos_usuario.get('rol_id', usuario.rol_id)
    usuario.palabra_clave = datos_usuario.get('palabra_clave', usuario.palabra_clave)

    # Actualizar foto solo si viene una nueva
    nueva_foto = datos_usuario.get('foto')
    if nueva_foto:
        usuario.foto = nueva_foto

    # Actualizar contraseña si fue proporcionada
    nueva_contrasena = datos_usuario.get('contrasena')
    if nueva_contrasena:
        usuario.contrasena = generate_password_hash(nueva_contrasena)

    db.session.commit()
    return usuario

def guardar_foto(foto, usuario_id):
    if not foto or not foto.filename or not foto.filename.strip():
        raise ValueError("Archivo de foto inválido o vacío.")

    destino = os.path.join(os.path.abspath(os.path.dirname(__file__)), '..', 'static', 'images')
    if not os.path.exists(destino):
        os.makedirs(destino)

    extension = foto.filename.split('.')[-1]
    nombre_archivo = f"usuario{usuario_id}.{extension}"
    ruta_foto = os.path.join(destino, nombre_archivo)
    foto.save(ruta_foto)
    return nombre_archivo

def obtener_roles():
    # Obtener todos los roles activos de la base de datos
    roles = Rol.query.filter_by(estado="ACTIVO").all()
    print(f"Roles recuperados: {roles}")  # Agrega un print para depurar
    return roles

def obtener_usuarios_con_roles():
    usuarios = Usuario.query.all()
    roles = Rol.query.filter(func.trim(Rol.estado) == "ACTIVO").all()

    print(f"Usuarios encontrados: {len(usuarios)}")
    print(f"Roles activos encontrados: {len(roles)}")
    
    return usuarios, roles