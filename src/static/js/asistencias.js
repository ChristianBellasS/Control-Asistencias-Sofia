let currentPage = 1;
const perPage = 10;
let totalPages = 1;

document.addEventListener('DOMContentLoaded', function () {
    cargarTiposDePersonal();
    cargarAsistencias(); // Cargar asistencias al iniciar
});

// Cargar tipos de personal
function cargarTiposDePersonal() {
    fetch('/personal/obtener_personal_todos')
        .then(response => response.json())
        .then(data => {
            const tipoPersonalSelect = document.getElementById('tipoPersonalSelect');
            tipoPersonalSelect.innerHTML = '';

            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = 'Seleccionar Tipo de Personal';
            tipoPersonalSelect.appendChild(defaultOption);

            data.forEach(tipo => {
                const option = document.createElement('option');
                option.value = tipo.nombre;
                option.textContent = tipo.nombre;
                tipoPersonalSelect.appendChild(option);
            });
        })
        .catch(error => console.error('Error al cargar los tipos de personal:', error));
}

// Cargar asistencias desde el servidor
function cargarAsistencias(page = 1) {
    const tipo = document.getElementById('tipoPersonalSelect').value;
    const grado = document.getElementById('gradoSelect').value;
    const seccion = document.getElementById('seccionSelect').value;
    const fecha = document.getElementById('fechaFiltro').value;
    const q = document.getElementById('buscarAsistencia').value;

    // Construir URL con parámetros
    let url = `/asistencias/listar?page=${page}&per_page=${perPage}`;
    
    if (tipo) url += `&tipo=${encodeURIComponent(tipo)}`;
    if (grado) url += `&grado=${encodeURIComponent(grado)}`;
    if (seccion) url += `&seccion=${encodeURIComponent(seccion)}`;
    if (fecha) url += `&fecha=${encodeURIComponent(fecha)}`;
    if (q) url += `&q=${encodeURIComponent(q)}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            currentPage = data.page;
            totalPages = data.total_pages;
            
            mostrarAsistencias(data.items);
            actualizarPaginador();
        })
        .catch(error => console.error('Error al cargar asistencias:', error));
}

// Mostrar asistencias en la tabla
function mostrarAsistencias(asistencias) {
    const tbody = document.getElementById('tbodyAsistencias');
    tbody.innerHTML = '';

    if (asistencias.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">No se encontraron registros de asistencia.</td>
            </tr>
        `;
        return;
    }

    asistencias.forEach(asistencia => {
        const row = document.createElement('tr');
        row.setAttribute('data-tipo', asistencia.data.tipo);
        row.setAttribute('data-grado', asistencia.data.grado);
        row.setAttribute('data-seccion', asistencia.data.seccion);
        row.setAttribute('data-fecha', asistencia.data.fecha);

        row.innerHTML = `
            <td>${asistencia.nombre_completo}</td>
            <td>${asistencia.grado}</td>
            <td>${asistencia.seccion}</td>
            <td>${asistencia.fecha_hora}</td>
            <td>${asistencia.asistencia}</td>
            <td>${asistencia.tipo}</td>
            <td class="text-center">
                <button class="btn btn-danger btn-sm" onclick="eliminarAsistencia(${asistencia.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;

        tbody.appendChild(row);
    });
}

// Actualizar paginador
function actualizarPaginador() {
    document.getElementById('paginaActual').textContent = `Página ${currentPage} de ${totalPages}`;
    document.getElementById('prevBtn').disabled = currentPage <= 1;
    document.getElementById('nextBtn').disabled = currentPage >= totalPages;
}

// Cambiar página
function cambiarPagina(delta) {
    const newPage = currentPage + delta;
    if (newPage >= 1 && newPage <= totalPages) {
        cargarAsistencias(newPage);
    }
}

// Habilitar grado y sección solo si es ALUMNA
function filtrarPorTipo() {
    const tipoPersonal = document.getElementById('tipoPersonalSelect').value;
    const gradoSelect = document.getElementById('gradoSelect');
    const seccionSelect = document.getElementById('seccionSelect');

    if (tipoPersonal.toUpperCase() === 'ALUMNA') {
        gradoSelect.disabled = false;
        seccionSelect.disabled = false;
    } else {
        gradoSelect.disabled = true;
        seccionSelect.disabled = true;
        gradoSelect.value = '';
        seccionSelect.value = '';
    }
}

// Filtro de búsqueda en tiempo real por nombre
function buscarAsistencia() {
    const filter = document.getElementById('buscarAsistencia').value.toLowerCase();
    const rows = document.querySelectorAll('#tablaAsistencias tbody tr');

    rows.forEach(row => {
        const nombreCompleto = row.cells[0].textContent.toLowerCase();
        row.style.display = nombreCompleto.includes(filter) ? '' : 'none';
    });
}

// Para el filtro local (si aún lo quieres mantener)
function aplicarFiltros() {
    // Ahora usamos cargarAsistencias que hace el filtro en el servidor
    cargarAsistencias(1);
}

// Descargar Excel (actualizado para usar datos dinámicos)
function descargarExcel() {
    const tabla = document.getElementById('tablaAsistencias');
    const filas = Array.from(tabla.querySelectorAll('tbody tr'))
        .filter(row => row.style.display !== 'none');

    if (filas.length === 0) {
        alert("No hay registros para exportar.");
        return;
    }

    const encabezados = Array.from(tabla.querySelectorAll('thead th'))
        .slice(0, -1)
        .map(th => th.textContent.trim());

    const datos = filas.map(row => {
        return Array.from(row.cells)
            .slice(0, -1)
            .map(cell => cell.textContent.trim());
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([encabezados, ...datos]);
    XLSX.utils.book_append_sheet(wb, ws, "Asistencias");
    XLSX.writeFile(wb, "Asistencias.xlsx");
}

// Función de eliminación (sin cambios)
function eliminarAsistencia(asistenciaId) {
    Swal.fire({
        title: "🗑️ ¿Estás seguro de eliminar esta asistencia?",
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
                <strong style="color: #dc2626;">Advertencia:</strong> Esta acción <strong>eliminará permanentemente</strong> la asistencia. No se podrá deshacer.
            </div>
        `,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "🗑️ ¡Sí, eliminar!",
        cancelButtonText: "❌ Cancelar",
        confirmButtonColor: "#ef4444",
        cancelButtonColor: "#9ca3af",
        background: "#ffffff"
    }).then((result) => {
        if (result.isConfirmed) {
            fetch(`/asistencias/eliminar_asistencia/${asistenciaId}`, {
                method: 'POST',
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    Swal.fire({
                        title: "✅ ¡Asistencia Eliminada!",
                        text: "La asistencia ha sido eliminada correctamente.",
                        icon: "success",
                        timer: 2000,
                        showConfirmButton: false
                    });
                    // Recargar las asistencias después de eliminar
                    cargarAsistencias(currentPage);
                } else {
                    Swal.fire('Error', 'Hubo un problema al eliminar la asistencia.', 'error');
                }
            })
            .catch(error => {
                Swal.fire('Error', 'Hubo un problema con la conexión.', 'error');
            });
        }
    });
}