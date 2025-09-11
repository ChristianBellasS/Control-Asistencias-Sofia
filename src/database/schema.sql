CREATE TABLE tipo_personal (
    id SERIAL PRIMARY KEY,  -- ID único del tipo de personal
    tipo VARCHAR(100) NOT NULL,  -- Tipo de personal (ej. Alumnas, Docentes, etc.)
    descripcion TEXT  -- Descripción opcional del tipo de personal
);

CREATE TABLE personal (
    id SERIAL PRIMARY KEY,  -- ID único de la persona (autoincremental)
    nombres VARCHAR(255) NOT NULL,   -- Nombres completos
    apellido_paterno VARCHAR(100) NOT NULL,  -- Apellido paterno
    apellido_materno VARCHAR(100),  -- Apellido materno
    url_foto TEXT,  -- URL de la foto
    foto_vector BYTEA,  -- Foto en formato de vector (array de bytes)
    grado VARCHAR(100),  -- Grado educativo (ej. "1", "2", etc.)
    tipo_personal_id INT NOT NULL,  -- ID del tipo de personal (clave foránea)
    seccion VARCHAR(100),  -- Sección del personal (opcional)
    estado VARCHAR(50) NOT NULL,  -- Estado del personal, por ejemplo 'ACTIVO' o 'INACTIVO'
    FOREIGN KEY (tipo_personal_id) REFERENCES tipo_personal(id)  -- Clave foránea que apunta a tipo_personal
);

CREATE TABLE asistencias (
    id SERIAL PRIMARY KEY,  -- ID único de la asistencia
    persona_id INT NOT NULL,  -- ID de la persona (clave foránea)
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- Fecha de registro de la asistencia
    asistencia BOOLEAN NOT NULL DEFAULT FALSE,  -- Asistencia (TRUE o FALSE)
    FOREIGN KEY (persona_id) REFERENCES personal(id)  -- Relación con la tabla personal
);

CREATE TABLE rol (
    id SERIAL PRIMARY KEY,  -- ID único del rol (autoincremental)
    nombre VARCHAR(100) NOT NULL  -- Nombre del rol (ej. admin, usuario)
);

CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,  -- ID único del usuario (autoincremental)
    usuario VARCHAR(100) NOT NULL UNIQUE,  -- Nombre de usuario (único)
    contrasena VARCHAR(255) NOT NULL,  -- Contraseña cifrada
    nombres VARCHAR(255) NOT NULL,  -- Nombres del usuario
    apellido_paterno VARCHAR(100) NOT NULL,  -- Apellido paterno
    apellido_materno VARCHAR(100),  -- Apellido materno
    estado BOOLEAN NOT NULL DEFAULT TRUE,  -- Estado (activo o inactivo)
    rol_id INT NOT NULL,  -- ID del rol (clave foránea)
    FOREIGN KEY (rol_id) REFERENCES rol(id)  -- Relación con la tabla `rol`
);
