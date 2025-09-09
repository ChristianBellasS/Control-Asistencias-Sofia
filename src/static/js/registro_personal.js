const formulario = document.querySelector('form');
const rolSelect = document.querySelector('select[name="rol"]');
const gradoInput = document.getElementById('grado');
const seccionInput = document.getElementById('seccion');
const seccionRow = document.getElementById('seccionRow');
const fotoInput = document.getElementById('imagenes');

// Variables para la cámara y fotos
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const tomarFotoButton = document.getElementById('tomarFoto');
const instrucciones = document.getElementById('instrucciones');
const fotosList = document.getElementById('fotosList');
const fotoContainer = document.getElementById('fotoContainer');
const fotoSubidaPreview = document.getElementById('imagenesList');
let fotosTomadas = [];
let fotoIndex = 0;

// Cargar roles desde el backend utilizando fetch
fetch("/personal/obtener_personal_todos")
    .then(response => response.json())
    .then(data => {
        rolSelect.innerHTML = '';  // Limpiar las opciones previas
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Seleccione el Tipo de Personal';
        rolSelect.appendChild(defaultOption);

        // Agregar las opciones desde la lista de roles
        data.forEach(rol => {
            const option = document.createElement('option');
            option.value = rol.rol_id;
            option.textContent = rol.nombre;
            rolSelect.appendChild(option);
        });
    })
    .catch(error => {
        console.error('Error al cargar roles:', error);
    });

// Lógica para habilitar y deshabilitar los campos de Grado y Sección
rolSelect.addEventListener('change', function () {
    const tipoPersonal = rolSelect.value;

    // Verificamos si el rol es 'ALUMNA'
    if (tipoPersonal == 2) {
        gradoInput.disabled = false;  // Habilitar campo de grado
        seccionInput.disabled = false;  // Habilitar campo de sección
        seccionRow.style.display = 'block';  // Mostrar la fila de Sección
    } else {
        gradoInput.disabled = true;  // Deshabilitar campo de grado
        seccionInput.disabled = true;  // Deshabilitar campo de sección
        seccionRow.style.display = 'none';  // Ocultar la fila de Sección
        gradoInput.value = '';  // Limpiar valor de grado
        seccionInput.value = '';  // Limpiar valor de sección
    }
});

// Función para gestionar la opción de tomar fotos o subir imágenes
const tomarFotoOption = document.getElementById('tomarFotoOption');
const subirFotoOption = document.getElementById('subirFotoOption');
const cameraSection = document.getElementById('cameraSection');
const uploadSection = document.getElementById('uploadSection');

// Inicializar como "Subir Foto desde Dispositivo" por defecto
uploadSection.style.display = 'block';
cameraSection.style.display = 'none';

tomarFotoOption.addEventListener('change', function () {
    if (this.checked) {
        cameraSection.style.display = 'block';
        uploadSection.style.display = 'none';
        iniciarCamara();  // Iniciar cámara
    }
});

subirFotoOption.addEventListener('change', function () {
    if (this.checked) {
        cameraSection.style.display = 'none';
        uploadSection.style.display = 'block'; // Mostrar sección de subir fotos
        detenerCamara(); // Detener cámara si está en uso
    }
});

// Función para iniciar la cámara
function iniciarCamara() {
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
            video.srcObject = stream;
        })
        .catch(err => {
            console.error("Error al acceder a la cámara: ", err);
            alert("No se pudo acceder a la cámara.");
        });
}

// Función para detener la cámara
function detenerCamara() {
    const stream = video.srcObject;
    if (stream) {
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
        video.srcObject = null;
    }
}

// Función para tomar una foto
tomarFotoButton.addEventListener('click', function () {
    if (fotoIndex < 5) {
        // Configurar el canvas y capturar la imagen
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convertir la imagen a base64
        const fotoData = canvas.toDataURL('image/png');
        fotosTomadas.push(fotoData);

        // Mostrar la foto en la interfaz
        const img = document.createElement('img');
        img.src = fotoData;
        img.width = 100;
        fotosList.appendChild(img);

        // Aumentar el índice de foto
        fotoIndex++;

        // Cambiar la instrucción dependiendo de la foto tomada
        switch (fotoIndex) {
            case 1:
                instrucciones.textContent = "Ahora capture una foto de perfil derecho.";
                break;
            case 2:
                instrucciones.textContent = "Ahora capture una foto de perfil izquierdo.";
                break;
            case 3:
                instrucciones.textContent = "Ahora capture una foto de costado derecho.";
                break;
            case 4:
                instrucciones.textContent = "Ahora capture una foto de costado izquierdo.";
                break;
            default:
                fotoContainer.style.display = 'block';
                instrucciones.textContent = "Fotos capturadas exitosamente. Ahora puedes enviar el formulario.";
                break;
        }
    } else {
        alert("Has tomado todas las fotos necesarias.");
    }
});

// Función para mostrar vista previa de las imágenes subidas
fotoInput.addEventListener('change', function () {
    fotoSubidaPreview.innerHTML = '';  // Limpiar vista previa
    for (let i = 0; i < fotoInput.files.length; i++) {
        const file = fotoInput.files[i];
        const reader = new FileReader();

        reader.onload = function (e) {
            const imgElement = document.createElement('img');
            imgElement.src = e.target.result;
            imgElement.width = 100;
            fotoSubidaPreview.appendChild(imgElement);  // Mostrar imagen subida
        };
        reader.readAsDataURL(file);  // Convertir imagen a base64
    }
});

// Validación del formulario antes de enviarlo
formulario.addEventListener('submit', function (e) {
    e.preventDefault();  // Evitar el envío tradicional del formulario

    // Recoger los datos del formulario
    const formData = new FormData(formulario);
    const tipoPersonal = formData.get('rol');  // Asegurarnos de que el valor sea válido

    if (!tipoPersonal || tipoPersonal === 'undefined') {
        alert('Debe seleccionar un tipo de personal válido.');
        return;  // Detener el envío si el valor es inválido
    }

    const datos = {
        nombres: formData.get('nombres'),
        apellido_paterno: formData.get('apellido_paterno'),
        apellido_materno: formData.get('apellido_materno'),
        grado: formData.get('grado'),
        tipo_personal: tipoPersonal,  // Aquí pasamos el valor correcto
        estado: formData.get('estado'),
        seccion: formData.get('seccion')
    };

    // Si se sube una imagen desde el dispositivo, la gestionamos
    if (fotoInput.files.length > 0) {
        const fotoFiles = Array.from(fotoInput.files);
        const base64Fotos = [];

        // Convertir cada imagen a base64
        fotoFiles.forEach(foto => {
            const reader = new FileReader();
            reader.onload = function (event) {
                base64Fotos.push(event.target.result);  // Guardar la imagen en base64
                if (base64Fotos.length === fotoFiles.length) {
                    datos.fotos = base64Fotos;  // Añadir todas las fotos al objeto de datos
                    enviarDatos(datos);  // Enviar los datos al servidor
                }
            };
            reader.readAsDataURL(foto);  // Convertir la imagen a base64
        });
    } else if (fotosTomadas.length > 0) {
        // Si no se sube una imagen, pero se han tomado fotos, enviamos las fotos tomadas
        datos.fotos = fotosTomadas;
        enviarDatos(datos);
    } else {
        alert('No se proporcionaron fotos.');
    }
});

// Función para enviar los datos al servidor
function enviarDatos(datos) {
    fetch('/personal/crear_personal', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'  // Aseguramos que se envíe como JSON
        },
        body: JSON.stringify(datos)  // Convertir el objeto de datos a JSON
    })
        .then(response => response.json())
        .then(data => {
            if (data.message) {
                alert(data.message);
                window.location.href = "/personal/personal";  // Redirigir a la lista de personal
            }
        })
        .catch(error => {
            console.error('Error al registrar personal:', error);
            alert('Ocurrió un error al registrar el personal.');
        });
}
