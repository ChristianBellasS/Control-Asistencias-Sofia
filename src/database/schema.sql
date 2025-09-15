-- Crear tabla tipo_personal
CREATE TABLE tipo_personal (
    id SERIAL PRIMARY KEY,  -- ID único del tipo de personal
    tipo VARCHAR(100) NOT NULL,  -- Tipo de personal (ej. Alumnas, Docentes, etc.)
    descripcion TEXT  -- Descripción opcional del tipo de personal
);

-- Crear tabla personal
CREATE TABLE personal (
    id SERIAL PRIMARY KEY,  -- ID único de la persona (autoincremental)
    nombres VARCHAR(255) NOT NULL,  -- Nombres completos
    apellido_paterno VARCHAR(100) NOT NULL,  -- Apellido paterno
    apellido_materno VARCHAR(100),  -- Apellido materno
    url_foto TEXT,  -- URL de la foto
    foto_vector BYTEA,  -- Foto en formato de vector (array de bytes)
    grado VARCHAR(100),  -- Grado educativo (ej. "Primaria", "Secundaria", etc.)
    seccion VARCHAR(1),  -- Sección del personal (opcional)
    estado VARCHAR(50) NOT NULL,  -- Estado del personal, por ejemplo 'ACTIVO' o 'INACTIVO'
    tipo_personal_id INT NOT NULL,  -- ID del tipo de personal (clave foránea)
    FOREIGN KEY (tipo_personal_id) REFERENCES tipo_personal(id)  -- Relación con tipo_personal
);

-- Crear tabla curso (añadida)
CREATE TABLE cursos (
    id SERIAL PRIMARY KEY,  -- ID único del curso
    nombre VARCHAR(255) NOT NULL,  -- Nombre del curso
    descripcion TEXT  -- Descripción del curso
);

-- Crear tabla asistencias
CREATE TABLE asistencias (
    id SERIAL PRIMARY KEY,  -- ID único de la asistencia
    persona_id INT NOT NULL,  -- ID de la persona (clave foránea)
    curso_id INT NOT NULL,  -- ID del curso (clave foránea)
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- Fecha de registro de la asistencia
    asistencia BOOLEAN NOT NULL DEFAULT FALSE,  -- Asistencia (TRUE o FALSE)
    FOREIGN KEY (persona_id) REFERENCES personal(id),  -- Relación con la tabla personal
    FOREIGN KEY (curso_id) REFERENCES cursos(id)  -- Relación con la tabla cursos
);

-- Crear tabla rol
CREATE TABLE rol (
    id SERIAL PRIMARY KEY,  -- ID único del rol (autoincremental)
    nombre VARCHAR(100) NOT NULL,  -- Nombre del rol (ej. admin, usuario)
    estado VARCHAR(10) NOT NULL,  -- Estado del rol (activo o inactivo)
    descripcion TEXT  -- Descripción del rol
);

-- Crear tabla usuarios
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,  -- ID único del usuario (autoincremental)
    usuario VARCHAR(100) NOT NULL UNIQUE,  -- Nombre de usuario (único)
    contrasena VARCHAR(255) NOT NULL,  -- Contraseña cifrada
    token VARCHAR(64),  -- Token (opcional)
    estado BOOLEAN NOT NULL DEFAULT TRUE,  -- Estado (activo o inactivo)
    rol_id INT NOT NULL,  -- ID del rol (clave foránea)
    nombres VARCHAR(255) NOT NULL,  -- Nombres del usuario
    apellido_paterno VARCHAR(100) NOT NULL,  -- Apellido paterno
    apellido_materno VARCHAR(100),  -- Apellido materno
    foto VARCHAR(255),  -- URL o ruta de la foto del usuario
    palabra_clave VARCHAR(50),  -- Palabra clave (opcional)
    dni VARCHAR(50) NOT NULL UNIQUE,  -- DNI del usuario (único)
    telefono VARCHAR(20),  -- Teléfono (opcional)
    correo_electronico VARCHAR(100) NOT NULL UNIQUE,  -- Correo electrónico (único)
    FOREIGN KEY (rol_id) REFERENCES rol(id)  -- Relación con la tabla rol
);
