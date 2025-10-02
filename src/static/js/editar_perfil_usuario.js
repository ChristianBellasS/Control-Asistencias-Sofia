document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("formEditarUsuario");
    const fotoInput = document.getElementById("foto");
    const preview = document.getElementById("previewFoto");

    const dniInput = document.getElementById("dni");
    const usuarioInput = document.getElementById("usuario"); // lo añadí para validación en submit
    const nombresInput = document.getElementById("nombres");
    const apellidoPaternoInput = document.getElementById("apellido_paterno");
    const apellidoMaternoInput = document.getElementById("apellido_materno");
    const telefonoInput = document.getElementById("telefono");
    const correoInput = document.getElementById("correo_electronico");

    function mostrarAlerta(titulo, texto) {
        Swal.fire({
            icon: "warning",
            title: titulo,
            text: texto,
            confirmButtonColor: "#f39c12",
            background: "#fff8e1",
            customClass: {
                popup: "rounded-4 shadow border border-warning",
                confirmButton: "btn btn-warning fw-semibold px-4 py-2",
            },
            timer: 3000,
            timerProgressBar: true,
            showClass: { popup: "animate__animated animate__fadeInDown" },
            hideClass: { popup: "animate__animated animate__fadeOutUp" },
        });
    }

    // Función para poner o quitar borde rojo
    function marcarError(input, tieneError) {
        if (tieneError) {
            input.classList.add("input-error");
        } else {
            input.classList.remove("input-error");
        }
    }

    // Validación DNI - solo números, max 8 caracteres
    dniInput.addEventListener("input", function () {
        const original = this.value;
        const newValue = original.replace(/\D/g, ""); // quitar todo no numérico
        if (original !== newValue) {
            mostrarAlerta("⚠️ Solo números permitidos", "El DNI solo puede contener números.");
            marcarError(dniInput, true);
        } else {
            marcarError(dniInput, false);
        }
        this.value = newValue;

        if (this.value.length > 8) {
            this.value = this.value.slice(0, 8);
            mostrarAlerta("⚠️ Máximo 8 caracteres", "El DNI no puede tener más de 8 dígitos.");
            marcarError(dniInput, true);
        } else if (this.value.length <= 8) {
            marcarError(dniInput, false);
        }
    });

    // Función para validar solo letras y espacios en un input
    function validarSoloLetrasEspacios(input, nombreCampo, maxLength = 80) {
        input.addEventListener("input", function () {
            const original = this.value;
            // Permite letras (mayúsculas y minúsculas), acentos, ñ, y espacios
            const newValue = original.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ\s]/g, "");
            if (original !== newValue) {
                mostrarAlerta(`⚠️ ${nombreCampo} inválido`, `El campo ${nombreCampo.toLowerCase()} solo puede contener letras y espacios.`);
                marcarError(input, true);
            } else {
                marcarError(input, false);
            }
            this.value = newValue;

            if (this.value.length > maxLength) {
                this.value = this.value.slice(0, maxLength);
                mostrarAlerta(`⚠️ Máximo ${maxLength} caracteres`, `El campo ${nombreCampo.toLowerCase()} no puede tener más de ${maxLength} caracteres.`);
                marcarError(input, true);
            }
        });
    }

    validarSoloLetrasEspacios(nombresInput, "Nombres", 80);
    validarSoloLetrasEspacios(apellidoPaternoInput, "Apellido paterno", 80);
    validarSoloLetrasEspacios(apellidoMaternoInput, "Apellido materno", 80);

    // Validación teléfono - solo números, max 9 caracteres
    telefonoInput.addEventListener("input", function () {
        const original = this.value;
        const newValue = original.replace(/\D/g, "");
        if (original !== newValue) {
            mostrarAlerta("⚠️ Solo números permitidos", "El teléfono solo puede contener números.");
            marcarError(telefonoInput, true);
        } else {
            marcarError(telefonoInput, false);
        }
        this.value = newValue;

        if (this.value.length > 9) {
            this.value = this.value.slice(0, 9);
            mostrarAlerta("⚠️ Máximo 9 dígitos", "El teléfono no puede tener más de 9 dígitos.");
            marcarError(telefonoInput, true);
        } else if (this.value.length <= 9) {
            marcarError(telefonoInput, false);
        }
    });

    // Validación correo electrónico - formato básico
    correoInput.addEventListener("blur", function () {
        const valor = this.value.trim();
        if (valor === "") {
            marcarError(correoInput, false);
            return; // si está vacío no validar aquí
        }

        const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!regexEmail.test(valor)) {
            mostrarAlerta("⚠️ Correo electrónico inválido", "Por favor, ingresa un correo electrónico con formato válido.");
            this.value = "";   // limpiar el campo para evitar que quede con valor inválido
            marcarError(correoInput, true);
            this.focus();      // devolver foco para que corrija
        } else {
            marcarError(correoInput, false);
        }
    });

    // Vista previa y validación de la imagen subida
    fotoInput.addEventListener("change", function () {
        const file = this.files[0];
        if (!file) return;

        const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
        const validExtensions = ['jpg', 'jpeg', 'png', 'webp'];
        const fileExtension = file.name.split('.').pop().toLowerCase();

        if (!validTypes.includes(file.type) || !validExtensions.includes(fileExtension)) {
            Swal.fire({
                icon: 'error',
                title: 'Archivo no válido',
                text: 'Solo se permiten imágenes en formato JPG, PNG o WEBP.',
                confirmButtonColor: '#dc3545'
            });
            this.value = "";
            preview.src = "{{ url_for('static', filename='images/default.png') }}";
            return;
        }

        // Leer magic numbers para validar realmente el archivo
        const reader = new FileReader();
        reader.onloadend = function (e) {
            const arr = (new Uint8Array(e.target.result)).subarray(0, 4);
            let header = "";
            for (let i = 0; i < arr.length; i++) {
                header += arr[i].toString(16);
            }

            const isPng = header.startsWith("89504e47");
            const isJpeg = header.startsWith("ffd8ffe0") || header.startsWith("ffd8ffe1") || header.startsWith("ffd8ffe2");
            const isWebp = header.startsWith("52494646"); // RIFF header for WEBP

            if (!(isPng || isJpeg || isWebp)) {
                Swal.fire({
                    icon: 'error',
                    title: 'Archivo no válido',
                    text: 'El archivo no tiene una cabecera válida de imagen PNG, JPEG o WEBP.',
                    confirmButtonColor: '#dc3545'
                });
                fotoInput.value = "";
                preview.src = "{{ url_for('static', filename='images/default.png') }}";
                return;
            }

            // Si todo ok, mostrar preview
            const previewReader = new FileReader();
            previewReader.onload = function (event) {
                preview.src = event.target.result;
            };
            previewReader.readAsDataURL(file);
        };

        reader.readAsArrayBuffer(file);
    });

    // Confirmación antes de enviar cambios
    form.addEventListener("submit", function (e) {
        e.preventDefault();

        let faltantes = [];

        if (!dniInput.value.trim()) faltantes.push("DNI");
        if (!usuarioInput.value.trim()) faltantes.push("Usuario");
        if (!nombresInput.value.trim()) faltantes.push("Nombres");
        if (!apellidoPaternoInput.value.trim()) faltantes.push("Apellido paterno");
        if (!apellidoMaternoInput.value.trim()) faltantes.push("Apellido materno");
        if (!telefonoInput.value.trim()) faltantes.push("Teléfono");
        if (!correoInput.value.trim()) faltantes.push("Correo electrónico");

        // Marcar los inputs en rojo que faltan
        marcarError(dniInput, !dniInput.value.trim());
        marcarError(usuarioInput, !usuarioInput.value.trim());
        marcarError(nombresInput, !nombresInput.value.trim());
        marcarError(apellidoPaternoInput, !apellidoPaternoInput.value.trim());
        marcarError(apellidoMaternoInput, !apellidoMaternoInput.value.trim());
        marcarError(telefonoInput, !telefonoInput.value.trim());
        marcarError(correoInput, !correoInput.value.trim());

        if (faltantes.length > 0) {
            const lista = faltantes
                .map(c => `<li style="color:#dc2626; font-weight:600;">${c}</li>`)
                .join("");
            Swal.fire({
                icon: "warning",
                title: "⚠️ Campos faltantes",
                html: `<p>Por favor completa los siguientes campos:</p><ul style="text-align:left; margin-left:20px;">${lista}</ul>`,
                confirmButtonColor: "#f39c12",
                background: "#fff8e1",
                customClass: {
                    popup: "rounded-4 shadow border border-warning",
                    confirmButton: "btn btn-warning fw-semibold px-4 py-2",
                },
                timer: 5000,
                timerProgressBar: true,
                showClass: { popup: "animate__animated animate__fadeInDown" },
                hideClass: { popup: "animate__animated animate__fadeOutUp" },
            });
            return;
        }


        Swal.fire({
            title: "💾 ¿Deseas actualizar este perfil?",
            html: `
            <div style="
                font-size: 15px;
                background: #f1f5f9;
                padding: 16px;
                border-radius: 12px;
                border-left: 6px solid #3b82f6;
                box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
                color: #1e3a8a;
                font-family: 'Segoe UI', sans-serif;
            ">
                <strong style="color: #2563eb;">Confirmación:</strong> Se aplicarán los cambios realizados en el perfil.
            </div>
            `,
            icon: "info",
            showCancelButton: true,
            confirmButtonText: "💾 Sí, guardar cambios",
            cancelButtonText: "❌ Cancelar",
            confirmButtonColor: "#3b82f6", // azul claro profesional
            cancelButtonColor: "#9ca3af"   // gris neutro
        }).then((result) => {
            if (result.isConfirmed) {
                enviarFormulario();
            }
        });
    });

    async function enviarFormulario() {
        const usuarioId = document.getElementById("usuario_id").value;
        const formData = new FormData();

        // Agregar campos del formulario
        formData.append("dni", dniInput.value);
        formData.append("usuario", usuarioInput.value);
        formData.append("nombres", nombresInput.value);
        formData.append("apellido_paterno", apellidoPaternoInput.value);
        formData.append("apellido_materno", apellidoMaternoInput.value);
        formData.append("telefono", telefonoInput.value);
        formData.append("correo_electronico", correoInput.value);

        const contrasena = document.getElementById("contrasena").value;
        if (contrasena.trim() !== "") {
            formData.append("contrasena", contrasena);
        }

        const nuevaFoto = fotoInput.files[0];
        if (nuevaFoto) {
            formData.append("foto", nuevaFoto);
        }

        try {
            const response = await fetch(`/usuario/editar/${usuarioId}`, {
                method: "POST",
                body: formData
            });

            const resultado = await response.json();

            if (response.ok && resultado.success) {
                Swal.fire({
                    title: "✅ Perfil actualizado",
                    text: "Los datos del usuario han sido actualizados correctamente.",
                    icon: "success",
                    timer: 2000,
                    showConfirmButton: false
                }).then(() => {
                    window.location.href = "/dashboard";
                });
            } else {
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: resultado.message || "Hubo un problema al actualizar.",
                    confirmButtonColor: "#dc3545"
                });
            }
        } catch (error) {
            Swal.fire({
                icon: "error",
                title: "Error del servidor",
                text: "No se pudo conectar con el servidor.",
                confirmButtonColor: "#dc3545"
            });
        }
    }
});
