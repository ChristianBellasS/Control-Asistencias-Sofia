document.addEventListener('DOMContentLoaded', function () {
    cargarTiposDePersonal();
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
                option.value = tipo.nombre;  // <-- guardamos el nombre directamente
                option.textContent = tipo.nombre;
                tipoPersonalSelect.appendChild(option);
            });
        })
        .catch(error => console.error('Error al cargar los tipos de personal:', error));
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

// Filtro combinado por tipo, grado, sección y fecha
function aplicarFiltros() {
    const tipoPersonal = document.getElementById('tipoPersonalSelect').value.toLowerCase();
    const grado = document.getElementById('gradoSelect').value.toLowerCase();
    const seccion = document.getElementById('seccionSelect').value.toLowerCase();
    const fecha = document.getElementById('fechaFiltro').value; // formato yyyy-mm-dd
    const rows = document.querySelectorAll('#tablaAsistencias tbody tr');

    rows.forEach(row => {
        const nombreTipo = row.cells[3].textContent.toLowerCase();
        const fechaRegistro = row.cells[1].textContent.split(' ')[0]; // yyyy-mm-dd

        let mostrar = true;

        // Filtrar por tipo de personal
        if (tipoPersonal && nombreTipo !== tipoPersonal) mostrar = false;

        // Si es ALUMNA, filtrar también por grado y sección
        if (tipoPersonal === 'alumna') {
            const filaGrado = row.getAttribute('data-grado')?.toLowerCase() || '';
            const filaSeccion = row.getAttribute('data-seccion')?.toLowerCase() || '';
            if (grado && filaGrado !== grado) mostrar = false;
            if (seccion && filaSeccion !== seccion) mostrar = false;
        }

        // Filtrar por fecha
        if (fecha && fechaRegistro !== fecha) mostrar = false;

        row.style.display = mostrar ? '' : 'none';
    });
}

function descargarExcel() {
    const tabla = document.getElementById('tablaAsistencias');

    // Filas visibles
    const filas = Array.from(tabla.querySelectorAll('tbody tr'))
        .filter(row => row.style.display !== 'none');

    if (filas.length === 0) {
        alert("No hay registros para exportar.");
        return;
    }

    // Encabezados (excluyendo última columna "Acciones")
    const encabezados = Array.from(tabla.querySelectorAll('thead th'))
        .slice(0, -1) // quitamos la última columna
        .map(th => th.textContent.trim());

    // Datos visibles (excluyendo última columna)
    const datos = filas.map(row => {
        return Array.from(row.cells)
            .slice(0, -1) // quitamos la última columna
            .map(cell => cell.textContent.trim());
    });

    // Crear hoja de Excel
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([encabezados, ...datos]);
    XLSX.utils.book_append_sheet(wb, ws, "Asistencias");

    // Descargar archivo
    XLSX.writeFile(wb, "Asistencias.xlsx");
}
