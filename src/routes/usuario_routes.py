from flask import Blueprint, request, jsonify, render_template, redirect, session
from src.services.usuario_services import obtener_roles, actualizar_usuario, guardar_foto, crear_usuario, obtener_usuarios_con_roles
from src.services.login_services import obtener_usuario_actual
from werkzeug.exceptions import BadRequest
from sqlalchemy.exc import IntegrityError
from src.models.models import db, Usuario, Rol
from src.services.login_services import verificar_autenticacion
from werkzeug.security import generate_password_hash, check_password_hash


main = Blueprint('usuario', __name__, url_prefix='/usuario')

@main.route("/obtener_roles_todos", methods=['GET'])
def obtener_roles_todos():
    roles = obtener_roles()  # Obtener los roles desde la base de datos
    roles_data = [{"rol_id": rol.rol_id, "nombre": rol.nombre} for rol in roles]  # Estructura de los roles
    return jsonify(roles_data)  # Devolver los roles en formato JSON

@main.route('/registro', methods=['POST'])
def registro_usuario():
    print("📥 Formulario recibido:", request.form)
    print("📥 Archivos recibidos:", request.files)
    
    try:
        # Recibir los datos del formulario
        datos_usuario = {
            'usuario': request.form['usuario'],
            'contrasena': request.form['contrasena'],
            'nombres': request.form['nombres'],
            'apellido_paterno': request.form['apellido_paterno'],
            'apellido_materno': request.form['apellido_materno'],
            'dni': request.form['dni'],
            'telefono': request.form['telefono'],
            'correo_electronico': request.form['correo_electronico'],
            'rol_id': request.form['rol'],
        }

        # Si el formulario tiene una foto
        if 'foto' in request.files:
            foto = request.files['foto']
            datos_usuario['foto'] = foto

        # Crear el nuevo usuario
        nuevo_usuario = crear_usuario(datos_usuario)

        # Respuesta exitosa
        return jsonify({
            "success": True,
            "message": "Usuario creado exitosamente",
            "redirect": "/inicio_sesion"  # O la ruta a la que se quiera redirigir
        }), 200

    except IntegrityError as e:
        # Captura los errores de duplicación de claves (violación de UNIQUE)
        if 'unique_usuario' in str(e):
            return jsonify({"success": False, "message": "El nombre de usuario ya está en uso. Por favor, elige otro."}), 400
        elif 'unique_dni' in str(e):
            return jsonify({"success": False, "message": "El DNI ya está registrado. Por favor, verifica el número."}), 400
        elif 'unique_correo_electronico' in str(e):
            return jsonify({"success": False, "message": "El correo electrónico ya está registrado. Por favor, usa otro."}), 400
        else:
            return jsonify({"success": False, "message": "Error al registrar el usuario. Intenta nuevamente."}), 500

    except ValueError as e:
        # Captura errores de validación personalizados
        return jsonify({"success": False, "message": str(e)}), 400

    except BadRequest as e:
        # Captura los errores de solicitud incorrecta
        return jsonify({"success": False, "message": str(e)}), 400

    except Exception as e:
        # Captura otros errores generales
        print(e)
        return jsonify({"success": False, "message": "Ocurrió un error desconocido. Intenta nuevamente."}), 500

@main.route('/editar/<int:usuario_id>', methods=['POST'])
def editar_usuario(usuario_id):
    if not verificar_autenticacion(): return redirect('/no_autenticado')
    try:
        datos = request.form
        foto = request.files.get('foto')  # Foto desde FormData

        datos_usuario = {
            'usuario': datos.get('usuario'),
            'nombres': datos.get('nombres'),
            'apellido_paterno': datos.get('apellido_paterno'),
            'apellido_materno': datos.get('apellido_materno'),
            'dni': datos.get('dni'),
            'telefono': datos.get('telefono'),
            'correo_electronico': datos.get('correo_electronico'),
            'contrasena': datos.get('contrasena'),
        }

        # Si viene nueva foto
        if foto:
            nombre_foto = guardar_foto(foto, usuario_id)
            datos_usuario['foto'] = nombre_foto

        usuario_actualizado = actualizar_usuario(usuario_id, datos_usuario)

        if usuario_actualizado is None:
            return jsonify({"success": False, "message": "Usuario no encontrado"}), 404

        return jsonify({
            "success": True,
            "message": "Usuario actualizado exitosamente",
            "usuario": {
                "usuario": usuario_actualizado.usuario,
                "nombres": usuario_actualizado.nombres,
                "apellido_paterno": usuario_actualizado.apellido_paterno,
                "apellido_materno": usuario_actualizado.apellido_materno,
                "dni": usuario_actualizado.dni,
                "telefono": usuario_actualizado.telefono,
                "correo_electronico": usuario_actualizado.correo_electronico,
                "estado": usuario_actualizado.estado
            }
        })

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 400

@main.route("/lista_usuarios")
def lista_usuarios():
    if not verificar_autenticacion(): return redirect('/no_autenticado')
    usuarios, roles = obtener_usuarios_con_roles()
    return render_template("configuraciones/usuarios_permisos.html", usuarios=usuarios, roles=roles)