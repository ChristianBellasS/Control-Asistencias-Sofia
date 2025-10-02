from decouple import config 
from flask import redirect, render_template, request, Flask
from src.models.models import db
from src.models.models import Usuario
from src.services.login_services import verificar_autenticacion
from datetime import datetime
from babel.dates import format_date
import pytz
from flask_cors import CORS
import os  # Asegúrate de importar os



#Services
from src.services import login_services 

#Routes
from src.routes import login_routes
from src.routes import usuario_routes
from src.routes import personal_routes
from src.routes import reconocimiento_routes
from src.routes import asistencias_routes

app = Flask(__name__, template_folder='src/templates', static_folder='src/static')
app.config["SECRET_KEY"] = config('SECRET_KEY')
app.config['SQLALCHEMY_DATABASE_URI'] = f'postgresql://{config("POSTGRES_USER")}:{config("POSTGRES_PASSWORD")}@{config("POSTGRES_HOST")}:{config("POSTGRES_PORT")}/{config("POSTGRES_DB")}'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB (ajusta según sea necesario)


# Inicialización de la base de datos
db.init_app(app)
CORS(app)

app.register_blueprint(login_routes.main)
app.register_blueprint(usuario_routes.main)
app.register_blueprint(personal_routes.main)
app.register_blueprint(reconocimiento_routes.main)
app.register_blueprint(asistencias_routes.main)

@app.route("/")
def index():
    # Si la conexión es exitosa, verifica el token de login
    if login_services.validar_token():
        usuario = login_services.obtener_usuario_actual()
        if usuario:
            print("Usuario:", usuario)
            lima_timezone = pytz.timezone("America/Lima")
            fecha_actual = datetime.now(lima_timezone)
            fecha_formateada = format_date(fecha_actual, format='d \'de\' MMMM \'del\' y', locale='es_PE')
            return render_template("index.html", usuario=usuario, fecha_actual=fecha_formateada)

    # Si no hay usuario autenticado, redirige al inicio de sesión
    return redirect("/inicio_sesion")


@app.route("/inicio_sesion")
def inicio_sesion():
    
    if verificar_autenticacion():  
        return redirect("/")  
    
    # Si no está autenticado, renderizar la página de login
    return render_template("inicio_sesion.html")

@app.route("/no_autenticado")
def no_autenticado():
    if not verificar_autenticacion():
        return render_template("error.html", message="No tienes permiso para acceder a esta página. Por favor, inicia sesión."), 200

@app.route("/dashboard")
def dashboard():
    if not verificar_autenticacion(): return redirect('/no_autenticado')
    lima_timezone = pytz.timezone("America/Lima")
    fecha_actual = datetime.now(lima_timezone)
    fecha_formateada = format_date(fecha_actual, format='d \'de\' MMMM \'del\' y', locale='es_PE')
    return render_template("index.html", fecha_actual=fecha_formateada)

@app.context_processor
def inyectar_usuario():
    token = request.cookies.get('token')
    username = request.cookies.get('username')
    usuario = None

    if token and username:
        usuario = Usuario.query.filter_by(usuario=username, token=token).first()

    return dict(usuario=usuario)

# Página de error personalizada
@app.route("/error")
def error():
    return render_template("error.html", message="Error general")

if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", 8080))  # Fly asigna PORT=8080
    app.run(host="0.0.0.0", port=port, debug=True)
