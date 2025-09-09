from flask import Blueprint, request, jsonify, make_response, redirect, url_for, render_template, session
from werkzeug.security import check_password_hash
from src.models.models import db, Usuario
from src.services.login_services import verificar_autenticacion, obtener_usuario_actual
import hashlib
import uuid

main = Blueprint("login", __name__, url_prefix="/login")

@main.route("/procesar_login", methods=["POST"])
def procesar_login():
    usuario = request.form.get("username")  
    password = request.form.get("password")

    if not usuario or not password:
        return jsonify({"success": False, "message": "Usuario y contraseña son obligatorios"})

    account = Usuario.query.filter_by(usuario=usuario).first()

    if not account:
        return jsonify({"success": False, "message": "Usuario o contraseña incorrectos"})

    # Verificar si el usuario está activo
    if account.estado.strip() != "ACTIVO":
        return jsonify({"success": False, "message": "Tu cuenta no está activa. Contacta al administrador."})

    hash_bd = account.contrasena.strip()

    # Verifica si el hash es pbkdf2:sha256 o scrypt
    if hash_bd.startswith("pbkdf2:sha256"):
        if check_password_hash(hash_bd, password.strip()):
            return inicio_sesion(account)
    elif hash_bd.startswith("scrypt:"):
        if check_password_hash(hash_bd, password.strip()):
            return inicio_sesion(account)
    else:
        return jsonify({"success": False, "message": "Error en el sistema, contacta al administrador"})

    return jsonify({"success": False, "message": "Usuario o contraseña incorrectos"})

def inicio_sesion(account):
    token = hashlib.sha256(str(uuid.uuid4()).encode()).hexdigest()
    account.token = token
    db.session.commit()

    session["usuario"] = {
        "id": account.user_id,
        "rol": account.rol.nombre, 
        "dni": account.dni,
        "nombre": f"{account.nombres} {account.apellido_paterno} {account.apellido_materno}"
    }
    
    response = jsonify({"success": True, "message": "Inicio de sesión exitoso", "redirect": "/"})
    response.set_cookie("token", token, httponly=True, samesite="Strict")
    response.set_cookie("username", account.usuario, httponly=True, samesite="Strict")
    response.set_cookie("rol", str(account.rol_id), httponly=True, samesite="Strict")
    return response

@main.route("/logout")
def logout():
    resp = make_response(redirect("/inicio_sesion"))  # Redirigir al login
    resp.delete_cookie("token")
    resp.delete_cookie("username")
    resp.delete_cookie("rol")

    # Asegurarse de que el navegador no guarde la caché de la página de inicio de sesión
    resp.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, proxy-revalidate'
    resp.headers['Pragma'] = 'no-cache'
    resp.headers['Expires'] = '0'

    return resp

# Ruta protegida de ejemplo
@main.route("/pagina_protegida")
def pagina_protegida():
    usuario = obtener_usuario_actual()

    if not usuario:  # Si el usuario es None, redirigir a la página de error
        return render_template('error.html')  # Redirigir a la página de error personalizada

    # Verificar si el usuario está autenticado
    if not verificar_autenticacion():
        return redirect(url_for('login.inicio_sesion'))  # Redirigir al login si no está autenticado

    # Si el usuario está autenticado, mostrar la página protegida
    return render_template("pagina_protegida.html")

