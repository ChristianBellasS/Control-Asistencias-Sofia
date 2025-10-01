// Variables para manejar la paginación
var paginaActual = 1;
var registrosPorPagina = 10;
var registrosTotales = 0;
var registrosFiltrados = [];

// Función para calcular los registros a mostrar
function mostrarPagina(pagina) {
    var tabla = document.getElementById("tablaPersonal");
    var tr = tabla.getElementsByTagName("tr");
    var start = (pagina - 1) * registrosPorPagina;
    var end = pagina * registrosPorPagina;

    // Ocultar todas las filas
    for (var i = 1; i < tr.length; i++) {
        tr[i].style.display = "none";
    }

    // Mostrar solo los registros correspondientes a la página
    for (var i = start; i < end && i < registrosFiltrados.length; i++) {
        tr[registrosFiltrados[i].index].style.display = "";
    }

    // Actualizar el texto de la página actual
    document.getElementById("paginaActual").textContent = "Página " + pagina + " de " + Math.ceil(registrosFiltrados.length / registrosPorPagina);

    // Habilitar o deshabilitar los botones de navegación
    document.getElementById("prevBtn").disabled = pagina === 1;
    document.getElementById("nextBtn").disabled = pagina === Math.ceil(registrosFiltrados.length / registrosPorPagina);
}

// Función para cambiar de página
function cambiarPagina(cambio) {
    paginaActual += cambio;
    mostrarPagina(paginaActual);
}

// Función para filtrar los registros y actualizar la paginación
function actualizarPaginacion() {
    var tabla = document.getElementById("tablaPersonal");
    var tr = tabla.getElementsByTagName("tr");
    registrosFiltrados = [];

    // Filtrar los registros de la tabla según los filtros (búsqueda y estado)
    for (var i = 1; i < tr.length; i++) {
        if (tr[i].style.display !== "none") {
            registrosFiltrados.push({ index: i });
        }
    }

    // Actualizar el total de registros
    registrosTotales = registrosFiltrados.length;

    // Mostrar la primera página
    mostrarPagina(1);
}

// Función de búsqueda
function buscarPersona() {
    var input, filter, table, tr, td, i, txtValue;
    input = document.getElementById("buscarPersonal");
    filter = input.value.toUpperCase();
    table = document.getElementById("tablaPersonal");
    tr = table.getElementsByTagName("tr");

    // Recorre todas las filas de la tabla
    for (i = 1; i < tr.length; i++) {
        td = tr[i].getElementsByTagName("td");
        var found = false;

        // Recorre todas las columnas de cada fila (excepto la última)
        for (var j = 0; j < td.length - 1; j++) {
            txtValue = td[j].textContent || td[j].innerText;
            if (txtValue.toUpperCase().indexOf(filter) > -1) {
                found = true;
            }
        }
        // Muestra u oculta la fila según si hay coincidencia
        if (found) {
            tr[i].style.display = "";
        } else {
            tr[i].style.display = "none";
        }
    }

    // Actualiza la paginación después de realizar la búsqueda
    actualizarPaginacion();
}

// Función de filtrado por tipo de personal
function filtrarPorTipo() {
    var select, filter, table, tr, td, i, txtValue;
    select = document.getElementById("tipoPersonalSelect");
    filter = select.value.toUpperCase();
    table = document.getElementById("tablaPersonal");
    tr = table.getElementsByTagName("tr");

    // Recorre todas las filas de la tabla
    for (i = 1; i < tr.length; i++) {
        td = tr[i].getElementsByTagName("td");
        if (td.length > 4) {  // Verifica que la fila tenga las columnas necesarias
            txtValue = td[4].textContent || td[4].innerText; // Columna de tipo personal
            if (txtValue.toUpperCase().indexOf(filter) > -1 || filter === "") {
                tr[i].style.display = "";
            } else {
                tr[i].style.display = "none";
            }
        }
    }

    // Actualiza la paginación después de filtrar por tipo
    actualizarPaginacion();
}

// Función de filtrado por estado
function filtrarPorEstado() {
    var select, filter, table, tr, td, i, txtValue;
    select = document.getElementById("estadoSelect");
    filter = select.value.toUpperCase();
    table = document.getElementById("tablaPersonal");
    tr = table.getElementsByTagName("tr");

    // Recorre todas las filas de la tabla
    for (i = 1; i < tr.length; i++) {
        td = tr[i].getElementsByTagName("td");
        if (td.length > 3) {  // Verifica que la fila tenga la columna de estado
            txtValue = td[3].textContent || td[3].innerText; // Columna de estado
            if (txtValue.toUpperCase().indexOf(filter) > -1 || filter === "") {
                tr[i].style.display = "";  // Muestra la fila si coincide
            } else {
                tr[i].style.display = "none";  // Oculta la fila si no coincide
            }
        }
    }

    // Actualiza la paginación después de filtrar por estado
    actualizarPaginacion();
}

// Inicialización de la paginación cuando la página carga
window.onload = function () {
    actualizarPaginacion();
}

// Función para manejar los clics en los botones de eliminación
// Función para manejar los clics en los botones de eliminación
document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.btn-danger').forEach(function (button) {
        button.addEventListener('click', function (event) {
            event.preventDefault();

            // Obtener el ID del personal desde el atributo 'data-id'
            const personaId = button.getAttribute('data-id');

            // Mostrar cuadro de confirmación con el nuevo diseño
            Swal.fire({
                title: '🗑️ ¿Estás seguro de eliminar este registro?',
                html: `
                    <div style="
                        font-size: 15px;
                        background: #fef2f2;
                        padding: 16px;
                        border-radius: 12px;
                        border-left: 6px solid #ef4444;
                        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
                        color: #7f1d1d;
                        font-family: 'Segoe UI', sans-serif;
                    ">
                        <strong style="color: #dc2626;">Advertencia:</strong> Esta acción <strong>eliminará permanentemente</strong> el registro. No se podrá deshacer.
                    </div>
                `,
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: '🗑️ ¡Sí, eliminar!',
                cancelButtonText: '❌ Cancelar',
                confirmButtonColor: '#ef4444',  // Color rojo para la eliminación
                cancelButtonColor: '#9ca3af',  // Gris neutro para el botón de cancelación
                background: '#ffffff'
            }).then((result) => {
                if (result.isConfirmed) {
                    // Realizar la eliminación si se confirma
                    fetch(`/personal/eliminar/${personaId}`, {
                        method: 'GET'
                    })
                        .then(response => response.json())  // Espera la respuesta en formato JSON
                        .then(data => {
                            if (data.message === "¡Registro eliminado exitosamente!") {
                                // Mostrar mensaje de éxito
                                Swal.fire({
                                    title: "✅ Personal Inactivado!",
                                    text: "El personal ha sido inactivado correctamente.",
                                    icon: "success",
                                    timer: 2000,
                                    showConfirmButton: false,
                                }).then(() => {
                                    // Recargar la página o actualizar la tabla sin necesidad de redirigir
                                    location.reload();
                                });
                            } else {
                                // Si no es exitoso, mostrar mensaje de error
                                Swal.fire(
                                    'Error',
                                    'No se pudo eliminar el personal.',
                                    'error'
                                );
                            }
                        })
                        .catch(error => {
                            // Mostrar mensaje de error si la solicitud falla
                            Swal.fire(
                                'Error',
                                'Hubo un problema al intentar eliminar el personal.',
                                'error'
                            );
                        });
                }
            });
        });
    });
});


document.addEventListener('DOMContentLoaded', function () {
    // Escucha para el botón de activación
    document.querySelectorAll('.btn-activar').forEach(function (button) {
        button.addEventListener('click', function (event) {
            event.preventDefault();

            const personaId = button.getAttribute('data-id');

            // Muestra la alerta de confirmación con el nuevo diseño
            Swal.fire({
                title: '🟢 ¿Estás seguro de activar este registro?',
                html: `
                    <div style="
                        font-size: 15px;
                        background: #fef2f2;
                        padding: 16px;
                        border-radius: 12px;
                        border-left: 6px solid #10b981;  // Color verde para la activación
                        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
                        color: #165e35;
                        font-family: 'Segoe UI', sans-serif;
                    ">
                        <strong style="color: #15803d;">Advertencia:</strong> Esta acción <strong>activará</strong> al personal y cambiará su estado a <strong>ACTIVO</strong>.
                    </div>
                `,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: '🟢 Sí, activar',
                cancelButtonText: '❌ Cancelar',
                confirmButtonColor: '#10b981',  // Color verde para la activación
                cancelButtonColor: '#ef4444',  // Color rojo para cancelar
                background: '#ffffff'
            }).then((result) => {
                if (result.isConfirmed) {
                    // Si el usuario confirma, hacemos la solicitud para activar el personal
                    fetch(`/personal/activar/${personaId}`)
                        .then(response => response.json())
                        .then(data => {
                            if (data.message === "¡Personal activado exitosamente!") {
                                // Si la activación es exitosa, mostramos un mensaje y recargamos la página
                                Swal.fire({
                                    title: "✅ Personal Activado!",
                                    text: "El personal ha sido activado correctamente.",
                                    icon: "success",
                                    timer: 2000,
                                    showConfirmButton: false,
                                }).then(() => {
                                    // Recargar la página o actualizar la tabla sin necesidad de redirigir
                                    location.reload();
                                });
                            } else {
                                Swal.fire(
                                    'Error',
                                    'Hubo un problema al activar el personal.',
                                    'error'
                                );
                            }
                        })
                        .catch(error => {
                            // Manejo de errores si la solicitud falla
                            Swal.fire(
                                'Error',
                                'Hubo un problema al intentar activar el personal.',
                                'error'
                            );
                        });
                }
            });
        });
    });
});

