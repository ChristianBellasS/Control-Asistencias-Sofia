from flask import request, session
from src.models.models import db, Usuario
from werkzeug.security import check_password_hash

def validar_token():
    token_cookie = request.cookies.get('token')
    username = request.cookies.get('username')

    usuario = Usuario.query.filter_by(usuario=username).first()

    if not usuario or not usuario.token:
        return False  

    return token_cookie == usuario.token  # Comparación correcta

def actualizar_token(username, token):
    usuario = Usuario.query.filter_by(usuario=username).first()
    if usuario:
        usuario.token = token
        db.session.commit()

def obtener_usuario_actual():
    token = request.cookies.get('token')
    username = request.cookies.get('username')
    
    if token and username:
        usuario = Usuario.query.filter_by(usuario=username, token=token).first()
        return usuario
    return None

def verificar_autenticacion():
    """
    Función que verifica si el usuario está autenticado y activo.
    """
    token = request.cookies.get("token")
    username = request.cookies.get("username")

    if not token or not username:
        return False

    usuario = Usuario.query.filter_by(usuario=username).first()

    if not usuario or usuario.token != token:
        return False

    if usuario.estado.strip() != "ACTIVO":
        return False

    return True

def obtener_usuario_actual():
    """
    Función que devuelve el usuario actual si está autenticado, de lo contrario, retorna None.
    """
    token = request.cookies.get('token')
    username = request.cookies.get('username')
    
    if token and username:
        usuario = Usuario.query.filter_by(usuario=username, token=token).first()
        return usuario
    return None