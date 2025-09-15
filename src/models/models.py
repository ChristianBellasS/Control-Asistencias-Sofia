from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

# Clase para la tabla 'tipo_personal'
class TipoPersonal(db.Model):
    __tablename__ = 'tipo_personal'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)  # ID único del tipo de personal
    tipo = db.Column(db.String(100), nullable=False)  # Tipo de personal (ej. Alumnas, Docentes, etc.)
    descripcion = db.Column(db.Text)  # Descripción opcional del tipo de personal
    
    # Relación uno a muchos con la tabla 'personal'
    personal = db.relationship('Personal', backref='tipo_personal', lazy=True)


# Clase para la tabla 'personal'
class Personal(db.Model):
    __tablename__ = 'personal'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)  # ID único de la persona (autoincremental)
    nombres = db.Column(db.String(255), nullable=False)  # Nombres completos
    apellido_paterno = db.Column(db.String(100), nullable=False)  # Apellido paterno
    apellido_materno = db.Column(db.String(100))  # Apellido materno
    url_foto = db.Column(db.String(255))  # URL de la foto
    foto_vector = db.Column(db.LargeBinary)  # Foto en formato de vector (array de bytes)
    grado = db.Column(db.String(100))  # Grado educativo (ej. "Primaria", "Secundaria", etc.)
    seccion = db.Column(db.String(1))  # Sección
    
    estado = db.Column(db.String(10), nullable=False, default='ACTIVO')  # Estado de la persona (ACTIVO o INACTIVO)

    # Relación con la tabla `tipo_personal`
    tipo_personal_id = db.Column(db.Integer, db.ForeignKey('tipo_personal.id'), nullable=False)
    
    # Relación uno a muchos con la tabla 'asistencias'
    asistencias = db.relationship('Asistencia', backref='personal', lazy=True)


# Clase para la tabla 'cursos'
class Curso(db.Model):
    __tablename__ = 'cursos'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)  # ID único del curso
    nombre = db.Column(db.String(255), nullable=False)  # Nombre del curso
    descripcion = db.Column(db.Text)  # Descripción del curso
    
    # Relación uno a muchos con la tabla 'asistencias'
    asistencias = db.relationship('Asistencia', backref='curso', lazy=True)

# Clase para la tabla 'asistencias'
class Asistencia(db.Model):
    __tablename__ = 'asistencias'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)  # ID único de la asistencia
    persona_id = db.Column(db.Integer, db.ForeignKey('personal.id'), nullable=False)  # ID de la persona (clave foránea)
    curso_id = db.Column(db.Integer, db.ForeignKey('cursos.id'), nullable=False)  # ID del curso (clave foránea)
    fecha_registro = db.Column(db.DateTime, default=db.func.current_timestamp())  # Fecha de registro de la asistencia
    asistencia = db.Column(db.Boolean, nullable=False, default=False)  # Asistencia (TRUE o FALSE)
    
    # Relación inversa con la tabla 'personal'
    personal = db.relationship('Personal', backref='asistencias', lazy=True)
    # Relación inversa con la tabla 'curso'
    curso = db.relationship('Curso', backref='asistencias', lazy=True)

class Rol(db.Model):
    __tablename__ = 'rol'
    rol_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nombre = db.Column(db.String(15), unique=True, nullable=False)
    estado = db.Column(db.String(10), nullable=False)
    descripcion = db.Column(db.String(255), nullable=True)  # Nueva columna


class Usuario(db.Model):
    __tablename__ = 'usuario'
    user_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    usuario = db.Column(db.String(50), nullable=False, unique=True)  # Agregar unique=True
    contrasena = db.Column(db.String(255), nullable=False)
    token = db.Column(db.String(64), nullable=True)
    estado = db.Column(db.String(15), nullable=False)
    rol_id = db.Column(db.Integer, db.ForeignKey('rol.rol_id'), nullable=False)

    # Nuevos campos agregados
    nombres = db.Column(db.String(80), nullable=False)
    apellido_paterno = db.Column(db.String(80), nullable=False)
    apellido_materno = db.Column(db.String(80), nullable=False)
    foto = db.Column(db.String(255))  # Puedes guardar la ruta o URL de la imagen
    palabra_clave = db.Column(db.String(50), nullable=True)

    # Nuevos campos: DNI, telefono, correo_electronico
    dni = db.Column(db.String(50), nullable=False, unique=True)  # Agregar unique=True
    telefono = db.Column(db.String(20), nullable=True)  # Esto puede ser opcional
    correo_electronico = db.Column(db.String(100), nullable=False, unique=True)  # Agregar unique=True
    
    rol = db.relationship('Rol')
