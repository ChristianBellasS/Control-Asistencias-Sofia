from decouple import config 
import psycopg2
from psycopg2 import OperationalError, DatabaseError
from psycopg2.extras import RealDictCursor

def obtener_conexion():
    """
    Esta función conecta a una base de datos PostgreSQL utilizando las credenciales
    almacenadas en el archivo de configuración. Además, ajusta la zona horaria
    de la conexión a 'America/Lima'. La conexión está configurada con autocommit habilitado.

    :raises OperationalError: Si ocurre un error relacionado con la conexión a la base de datos.
    :raises Exception: Si ocurre cualquier otro error inesperado durante la conexión.

    :return: Un objeto de conexión activo para interactuar con la base de datos.
    """
   
    try:
        conexion = psycopg2.connect(
            database=config('POSTGRES_DB'),
            user=config('POSTGRES_USER'),
            password=config('POSTGRES_PASSWORD'),
            host=config('POSTGRES_HOST'),
            port=int(config('POSTGRES_PORT')),
            cursor_factory=RealDictCursor
        )

        #Habilitar autocommit
        # conexion.autocommit = True

        ## * Descomentar si es base de datos alojada en servidor externo
        with conexion.cursor() as cursor:
            cursor.execute("SET timezone = 'America/Lima';")

        return conexion
    except OperationalError as e:
        print(f"OperationalError: {e}")
        raise
    except Exception as e:
        print(f"Error al conectar a la base de datos: {e}")
        raise


# Método especializado para realizar consultas SELECT
def ejecutar_select(query, parametros=None, fetch_multiple = True):
    """
    Ejecuta una consulta SELECT y devuelve uno o todos los resultados.

    :param query: La consulta SQL a ejecutar.
    :param parametros: Parámetros opcionales para la consulta.
    :param fetch_multiple: Si es True, usa fetchall(), si es False, usa fetchone().
    :return: Los resultados de la consulta.
    """
    conexion = None
    data = None
    try:
        conexion = obtener_conexion()

        with conexion.cursor() as cursor:
            cursor.execute(query, parametros)
            data = cursor.fetchall() if fetch_multiple else cursor.fetchone()
    except DatabaseError as e:
        print(f"DatabaseError: {e}")
    except Exception as e:
        print(f"Error al ejecutar select: {e}")
    finally:
        if conexion:
            conexion.close()

    return data


def ejecutar_modificacion(query, parametros=None):
    """
    Ejecuta una consulta SQL de tipo INSERT, UPDATE o DELETE y confirma la transacción.

    :param query: La consulta SQL a ejecutar.
    :param parametros: Parámetros opcionales para la consulta.
    :return: El número de filas afectadas por la consulta.
    """
    conexion = None
    filas_afectadas = 0
    try:
        conexion = obtener_conexion()
        
        with conexion.cursor() as cursor:
            cursor.execute(query, parametros)
            filas_afectadas = cursor.rowcount  # Obtiene el número de filas afectadas
            
        # Confirma la transacción
        conexion.commit()
    except DatabaseError as e:
        print(f"DatabaseError: {e}")
        if conexion:
            conexion.rollback()  # Revertir si ocurre un error en la base de datos
    except Exception as e:
        print(f"Error al ejecutar modificación: {e}")
        if conexion:
            conexion.rollback()
    finally:
        if conexion:
            conexion.close()

    return filas_afectadas
