document.addEventListener('DOMContentLoaded', function() {
    cargarTiposDePersonal();  // Llama a la función cuando el DOM esté cargado
    const nombreInput = document.getElementById('nombrePersonal');
    nombreInput.addEventListener('input', filtrarNombres);  // Mantener el input activado para cargar nombres
});

function cargarTiposDePersonal() {
    const tipoSelect = document.getElementById('tipo_personal');
    const gradoSelect = document.getElementById('gradoSelect');
    const seccionSelect = document.getElementById('seccionSelect');
    const nombreInput = document.getElementById('nombrePersonal');
    const url = '/personal/obtener_personal_todos';  // URL para obtener los tipos de personal

    fetch(url)
        .then(response => response.json())
        .then(data => {
            tipoSelect.innerHTML = '<option value="">Seleccionar Tipo de Personal</option>';
            data.forEach(tipo => {
                const option = document.createElement('option');
                option.value = tipo.rol_id;
                option.textContent = tipo.nombre;
                tipoSelect.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Error al cargar tipos de personal:', error);
            tipoSelect.innerHTML = '<option value="">Error al cargar los tipos de personal</option>';
        });

    tipoSelect.addEventListener('change', function() {
        const selectedType = tipoSelect.value;

        // Ocultar Grado, Sección y Nombre cuando no se haya seleccionado un tipo de personal
        if (selectedType === '') {
            gradoSelect.disabled = true;
            seccionSelect.disabled = true;
            nombreInput.disabled = true;
            gradoSelect.value = '';
            seccionSelect.value = '';
            nombreInput.value = '';
            return;
        }

        if (selectedType === '2') {  // Si es Alumna (ID 2)
            gradoSelect.disabled = false;
            seccionSelect.disabled = false;
            nombreInput.disabled = false;
            cargarNombres();  // Si Alumna, cargamos los nombres filtrados solo después de seleccionar grado y sección
        } else {
            gradoSelect.disabled = true;
            seccionSelect.disabled = true;
            nombreInput.disabled = false;  // Solo habilitar el campo de nombres
            cargarNombres();  // Cargar los nombres del tipo seleccionado de inmediato
        }
    });
}

function cargarNombres() {
    const gradoSelect = document.getElementById('gradoSelect').value;
    const seccionSelect = document.getElementById('seccionSelect').value;
    const tipoSelect = document.getElementById('tipo_personal').value;
    const nombreInput = document.getElementById('nombrePersonal');
    const datalist = document.getElementById('nombreResultados');  // Datalist

    let url = '';

    if (tipoSelect === '2' && gradoSelect && seccionSelect) {
        // Solo filtrar si los tres valores están seleccionados
        url = `/personal/filtrar_personal_route?grado=${gradoSelect}&seccion=${seccionSelect}`;
    } else if (tipoSelect !== '2' && tipoSelect !== '') {
        // Si no es Alumna, filtrar por el tipo de personal
        url = `/personal/filtrar_personal_route?tipo_personal=${tipoSelect}`;
    }

    if (url) {
        fetch(url)
            .then(response => response.json())
            .then(data => {
                datalist.innerHTML = '';  // Limpiar resultados anteriores
                data.forEach(persona => {
                    const option = document.createElement('option');
                    option.value = `${persona.nombre}`;  // Mostrar el nombre en el datalist
                    option.setAttribute('data-id', persona.id);  // Almacenar el ID en el atributo 'data-id'
                    datalist.appendChild(option);
                });
            })
            .catch(error => console.error('Error al buscar nombres:', error));
    }
}

// Modificar el comportamiento cuando se selecciona un nombre
document.getElementById('nombrePersonal').addEventListener('input', function() {
    const nombreInput = document.getElementById('nombrePersonal');
    const selectedOption = document.querySelector(`#nombreResultados option[value="${nombreInput.value}"]`);

    if (selectedOption) {
        // Obtener el ID desde el atributo 'data-id' del option seleccionado
        const selectedId = selectedOption.getAttribute('data-id');
        // Ahora el valor del campo de entrada será el ID (en lugar del nombre)
        nombreInput.setAttribute('data-id', selectedId); // Almacenamos el ID en un atributo de datos
    }
});

document.getElementById('formRegistrarAsistencia').addEventListener('submit', function(e) {
    e.preventDefault(); // Prevenir envío del formulario de forma tradicional

    const tipoSelect = document.getElementById('tipo_personal');
    const gradoSelect = document.getElementById('gradoSelect');
    const seccionSelect = document.getElementById('seccionSelect');
    const nombreInput = document.getElementById('nombrePersonal');
    const fecha = document.getElementById('fechaAsistencia').value;
    const asistencia = document.querySelector('input[name="asistencia"]:checked').value;

    const data = {
        rol: tipoSelect.value,
        grado: gradoSelect.value,
        seccion: seccionSelect.value,
        nombre_personal: nombreInput.value,  // ID del personal
        id_personal: nombreInput.getAttribute('data-id'),  // ID de la persona
        fecha: fecha,
        asistencia: asistencia
    };

    // Mostrar ventana de confirmación antes de guardar
    Swal.fire({
        title: "✅ ¿Estás seguro de guardar esta asistencia?",
        html: `
            <div style="
                font-size: 15px;
                background: #fef9c3;
                padding: 16px;
                border-radius: 12px;
                border-left: 6px solid #f59e0b;
                box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
                color: #9a6a00;
                font-family: 'Segoe UI', sans-serif;
            ">
                <strong style="color: #f59e0b;">Confirmación:</strong> Asegúrate de que la información es correcta antes de guardarla.
            </div>
        `,
        icon: "info",
        showCancelButton: true,
        confirmButtonText: "💾 ¡Sí, guardar!",
        cancelButtonText: "❌ Cancelar",
        confirmButtonColor: "#f59e0b",  // Color de confirmación (amarillo)
        cancelButtonColor: "#9ca3af",  // Gris neutro para cancelar
        background: "#ffffff"
    }).then((result) => {
        if (result.isConfirmed) {
            // Si el usuario confirma, enviamos los datos
            fetch('/asistencias/guardar_asistencia', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    Swal.fire({
                        title: "✅ ¡Asistencia Guardada!",
                        text: "La asistencia ha sido registrada exitosamente.",
                        icon: "success",
                        timer: 2000,
                        showConfirmButton: false
                    });
                    window.location.href = '/asistencias/listar_asistencias';  // Redirigir a la lista
                } else {
                    Swal.fire('Error', 'Hubo un problema al guardar la asistencia.', 'error');
                }
            })
            .catch(error => {
                Swal.fire('Error', 'Hubo un problema con la conexión.', 'error');
            });
        }
    });
});

