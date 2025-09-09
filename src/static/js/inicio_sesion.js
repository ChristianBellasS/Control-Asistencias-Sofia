document.addEventListener("DOMContentLoaded", function () {
  // 🎯 Vista previa de la imagen de perfil
  const inputFoto = document.getElementById("foto-input");
  const preview = document.getElementById("foto-preview");

  if (inputFoto && preview) {
    inputFoto.addEventListener("change", function () {
      const file = this.files[0];
      if (file) {
        const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
        const validExtensions = ['jpg', 'jpeg', 'png', 'webp'];

        const fileExtension = file.name.split('.').pop().toLowerCase();

        if (!validTypes.includes(file.type) || !validExtensions.includes(fileExtension)) {
          Swal.fire({
            icon: 'error',
            title: 'Archivo no válido',
            text: 'Solo se permiten imágenes en formato JPG, PNG, WEBP o JPEG.',
            confirmButtonColor: '#dc3545'
          });
          this.value = "";
          preview.src = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
          return;
        }

        // Leer los primeros bytes para validar magic numbers
        const reader = new FileReader();
        reader.onloadend = function (e) {
          const arr = (new Uint8Array(e.target.result)).subarray(0, 4);
          let header = "";
          for (let i = 0; i < arr.length; i++) {
            header += arr[i].toString(16);
          }

          // Magic numbers para PNG: 89504e47
          // JPEG/JFIF: ffd8ffe0 / ffd8ffe1 / ffd8ffe2
          // WEBP: 52494646 (RIFF) but needs more check (optional)

          const isPng = header.startsWith("89504e47");
          const isJpeg = header.startsWith("ffd8ffe0") || header.startsWith("ffd8ffe1") || header.startsWith("ffd8ffe2");
          const isWebp = header.startsWith("52494646"); // RIFF

          if (!(isPng || isJpeg || isWebp)) {
            Swal.fire({
              icon: 'error',
              title: 'Archivo no válido',
              text: 'El archivo no tiene una cabecera válida de imagen PNG, JPEG o WEBP.',
              confirmButtonColor: '#dc3545'
            });
            inputFoto.value = "";
            preview.src = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
            return;
          }

          // Si todo ok, mostrar preview
          const previewReader = new FileReader();
          previewReader.onload = function (event) {
            preview.src = event.target.result;
          };
          previewReader.readAsDataURL(file);
        };

        // Leer como ArrayBuffer para chequear magic numbers
        reader.readAsArrayBuffer(file);
      }
    });
  }

  // 🎯 Cargar roles desde backend
  fetch("/usuario/obtener_roles_todos")
    .then(response => response.json())
    .then(data => {
      const rolSelect = document.querySelector('select[name="rol"]');
      rolSelect.innerHTML = '';
      data.forEach(rol => {
        const option = document.createElement('option');
        option.value = rol.rol_id;
        option.textContent = rol.nombre;
        rolSelect.appendChild(option);
      });
    })
    .catch(error => {
      console.error('Error al obtener roles:', error);
    });

  // 🎯 Animación entre formularios login / registro
  const loginFormContainer = document.getElementById("login-form");
  const registerFormContainer = document.getElementById("register-form");

  const btnLogin = document.getElementById("btn-login");
  const btnRegister = document.getElementById("btn-register");
  const btnLogin2 = document.getElementById("btn-login-2");
  const btnRegister2 = document.getElementById("btn-register-2");

  // Función para limpiar formularios y preview de imagen
  function clearForms() {
    // Limpiar formulario de login
    const loginForm = document.getElementById("loginForm");
    if (loginForm) loginForm.reset();

    // Limpiar formulario de registro
    const registerForm = document.getElementById("registerForm");
    if (registerForm) registerForm.reset();

    // Reiniciar imagen preview a la imagen por defecto
    const preview = document.getElementById("foto-preview");
    if (preview) preview.src = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
  }

  function animateSwitchAdvanced(showEl, hideEl) {
    hideEl.classList.remove("animate-slide-in-right");
    hideEl.classList.add("animate-slide-out-left");

    setTimeout(() => {
      hideEl.style.display = "none";
      hideEl.classList.remove("animate-slide-out-left");

      showEl.style.display = "flex";
      showEl.classList.add("animate-slide-in-right");
    }, 400);
  }

  function showLogin() {
    animateSwitchAdvanced(loginFormContainer, registerFormContainer);
    btnLogin?.classList.add("active-tab");
    btnRegister?.classList.remove("active-tab");
    btnLogin2?.classList.add("active-tab");
    btnRegister2?.classList.remove("active-tab");

    clearForms();  // Limpiar campos al mostrar login
  }

  function showRegister() {
    animateSwitchAdvanced(registerFormContainer, loginFormContainer);
    btnLogin?.classList.remove("active-tab");
    btnRegister?.classList.add("active-tab");
    btnLogin2?.classList.remove("active-tab");
    btnRegister2?.classList.add("active-tab");
  }

  btnLogin?.addEventListener("click", showLogin);
  btnRegister?.addEventListener("click", showRegister);
  btnLogin2?.addEventListener("click", showLogin);
  btnRegister2?.addEventListener("click", showRegister);

  showLogin(); // Mostrar login por defecto

  // 🎯 Procesar formulario de inicio de sesión
  const loginForm = document.getElementById("loginForm");

  if (loginForm) {
    loginForm.addEventListener("submit", function (event) {
      event.preventDefault();

      const formData = new FormData(loginForm);

      fetch(loginForm.action, {
        method: "POST",
        body: formData,
      })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            // 🌟 MODAL ÉXITO
            Swal.fire({
              html: `
                <div style="text-align:center; padding-top:10px;">
                  <div style="width:100px;height:100px;margin:0 auto;background:linear-gradient(to right,#00b894,#26a69a);border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 20px rgba(0, 184, 148, 0.5);">
                    <i class="fas fa-check fa-3x text-white animate__animated animate__pulse animate__infinite"></i>
                  </div>
                  <h2 class="mt-4 mb-2" style="color:#2ecc71;">¡Inicio de sesión exitoso!</h2>
                  <p style="color:#444;font-size:15px;">Redireccionando al panel principal...</p>
                </div>
              `,
              background: '#f9fffc',
              showConfirmButton: true,
              confirmButtonText: 'Ir ahora',
              confirmButtonColor: '#00b894',
              customClass: {
                popup: 'rounded-4 shadow-lg border border-success',
                confirmButton: 'rounded-pill px-5 py-2 fw-semibold',
              },
              showClass: {
                popup: 'animate__animated animate__zoomInDown',
              },
              hideClass: {
                popup: 'animate__animated animate__fadeOutUp',
              },
              timer: 3000,
              timerProgressBar: true
            }).then(() => {
              window.location.href = data.redirect || "/";
            });

          } else {
            // 🚫 MODAL CREDENCIALES INCORRECTAS
            Swal.fire({
              html: `
                <div style="text-align:center;padding-top:10px;">
                  <div style="width:100px;height:100px;margin:0 auto;background:#f8d7da;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 20px rgba(220,53,69,0.3);">
                    <i class="fas fa-times fa-3x text-danger animate__animated animate__shakeX"></i>
                  </div>
                  <h2 class="mt-4 mb-2 text-danger">¡Credenciales incorrectas!</h2>
                  <p style="color:#555;font-size:14px;">${data.message || 'Usuario o contraseña inválidos'}</p>
                </div>
              `,
              background: '#fff0f0',
              confirmButtonText: 'Intentar de nuevo',
              confirmButtonColor: '#e74c3c',
              customClass: {
                popup: 'rounded-4 shadow border border-danger',
                confirmButton: 'rounded-pill px-4 py-2 fw-semibold',
              },
              showClass: {
                popup: 'animate__animated animate__shakeX',
              },
              hideClass: {
                popup: 'animate__animated animate__fadeOut',
              }
            }).then(() => {
              // 🧹 Limpiar campos
              loginForm.reset();
              loginForm.querySelector('input[name="username"]').focus();
            });
          }
        })
        .catch(error => {
          console.error("❌ Error en la solicitud:", error);

          // 💥 MODAL ERROR DE CONEXIÓN
          Swal.fire({
            html: `
              <div style="text-align:center;padding-top:10px;">
                <div style="width:100px;height:100px;margin:0 auto;background:#e0e0e0;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 20px rgba(0,0,0,0.1);">
                  <i class="fas fa-server fa-3x text-dark animate__animated animate__wobble"></i>
                </div>
                <h2 class="mt-4 mb-2 text-dark">¡Error del servidor!</h2>
                <p style="color:#666;font-size:14px;">No se pudo conectar con el servidor. Verifica tu red o inténtalo más tarde.</p>
              </div>
            `,
            background: '#f4f4f4',
            confirmButtonText: 'Cerrar',
            confirmButtonColor: '#333',
            customClass: {
              popup: 'rounded-4 border shadow',
              confirmButton: 'rounded-pill px-4 py-2 fw-semibold',
            },
            showClass: {
              popup: 'animate__animated animate__fadeInDown',
            },
            hideClass: {
              popup: 'animate__animated animate__fadeOutUp',
            }
          }).then(() => {
            // 🧹 Limpiar campos también en error
            loginForm.reset();
            loginForm.querySelector('input[name="username"]').focus();
          });
        });
    });
  }


  // 🎯 Procesar formulario de registro
  const registerForm = document.getElementById("registerForm");

  if (registerForm) {
    registerForm.addEventListener("submit", function (event) {
      event.preventDefault();

      // Obtener los valores de contraseña y confirmar
      const password = registerForm.querySelector('input[name="contrasena"]').value;
      const confirmPassword = registerForm.querySelector('input[name="confirmarcontrasena"]').value;

      // Verificar si coinciden
      if (password !== confirmPassword) {
        Swal.fire({
          html: `
            <div style="text-align:center;padding-top:10px;">
              <div style="width:100px;height:100px;margin:0 auto;background:#f8d7da;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 20px rgba(220,53,69,0.3);">
                <i class="fas fa-lock fa-3x text-danger animate__animated animate__headShake"></i>
              </div>
              <h2 class="mt-4 mb-2 text-danger">¡Las contraseñas no coinciden!</h2>
              <p style="color:#555;font-size:14px;">Por favor, asegúrate de que ambas contraseñas sean iguales.</p>
            </div>
          `,
          background: "#fff0f0",
          confirmButtonText: "Revisar",
          confirmButtonColor: "#dc3545",
          customClass: {
            popup: "rounded-4 border border-danger shadow",
            confirmButton: "rounded-pill px-4 py-2 fw-semibold",
          },
          showClass: {
            popup: "animate__animated animate__shakeX",
          },
          hideClass: {
            popup: "animate__animated animate__fadeOut",
          }
        });
        return; // 🚫 No continúa si hay error
      }

      // ✅ Si coinciden, continúa el envío
      const formData = new FormData(registerForm);

      fetch(registerForm.action, {
        method: "POST",
        body: formData,
      })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            Swal.fire({
              html: `
                <div style="text-align:center;padding-top:10px;">
                  <div style="width:100px;height:100px;margin:0 auto;background:#d4edda;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 20px rgba(40,167,69,0.3);">
                    <i class="fas fa-check fa-3x text-success animate__animated animate__tada"></i>
                  </div>
                  <h2 class="mt-4 mb-2 text-success">¡Usuario registrado exitosamente!</h2>
                  <p style="color:#555;font-size:14px;">${data.message || "Usuario creado exitosamente"}</p>
                </div>
              `,
              background: "#f9fdf9",
              confirmButtonText: "Aceptar",
              confirmButtonColor: "#28a745",
              customClass: {
                popup: "rounded-4 border border-success shadow",
                confirmButton: "rounded-pill px-5 py-2 fw-semibold",
              },
              showClass: {
                popup: "animate__animated animate__zoomIn",
              },
              hideClass: {
                popup: "animate__animated animate__zoomOut",
              },
            }).then(() => {
              registerForm.reset();
              window.location.href = data.redirect || "/";
            });

          } else {
            Swal.fire({
              html: `
                <div style="text-align:center;padding-top:10px;">
                  <div style="width:100px;height:100px;margin:0 auto;background:#f8d7da;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 20px rgba(220,53,69,0.3);">
                    <i class="fas fa-times fa-3x text-danger animate__animated animate__headShake"></i>
                  </div>
                  <h2 class="mt-4 mb-2 text-danger">¡Error al registrar usuario!</h2>
                  <p style="color:#555;font-size:14px;">${data.message || "Por favor, verifica los campos ingresados."}</p>
                </div>
              `,
              background: "#fff0f0",
              confirmButtonText: "OK",
              confirmButtonColor: "#dc3545",
              customClass: {
                popup: "rounded-4 border border-danger shadow",
                confirmButton: "rounded-pill px-4 py-2 fw-semibold",
              },
              showClass: {
                popup: "animate__animated animate__shakeX",
              },
              hideClass: {
                popup: "animate__animated animate__fadeOut",
              }
            });
          }
        })
        .catch(error => {
          console.error("❌ Error en la solicitud:", error);
          Swal.fire({
            html: `
              <div style="text-align:center;padding-top:10px;">
                <div style="width:100px;height:100px;margin:0 auto;background:#e0e0e0;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 20px rgba(0,0,0,0.1);">
                  <i class="fas fa-server fa-3x text-dark animate__animated animate__wobble"></i>
                </div>
                <h2 class="mt-4 mb-2 text-dark">¡Error del servidor!</h2>
                <p style="color:#666;font-size:14px;">No se pudo conectar con el servidor. Intenta más tarde.</p>
              </div>
            `,
            background: "#f4f4f4",
            confirmButtonText: "Cerrar",
            confirmButtonColor: "#333",
            customClass: {
              popup: "rounded-4 border shadow",
              confirmButton: "rounded-pill px-4 py-2 fw-semibold",
            },
            showClass: {
              popup: "animate__animated animate__fadeInDown",
            },
            hideClass: {
              popup: "animate__animated animate__fadeOutUp",
            }
          });
        });
    });
  }

});

document.addEventListener("DOMContentLoaded", function () {

  // Variables globales que se usan en varios lugares
  const paso1 = document.getElementById("paso1");
  const paso2 = document.getElementById("paso2");
  const modalRecuperarClave = document.getElementById('modalRecuperarClave');
  let userIdValidado = null;  // Guardaremos el user_id validado

  // Evento para resetear modal cada vez que se abre
  modalRecuperarClave.addEventListener('show.bs.modal', () => {
    paso1.style.display = 'block';
    paso2.style.display = 'none';

    paso1.classList.remove("animate__animated", "animate__fadeOutLeft");
    paso2.classList.remove("animate__animated", "animate__fadeInRight");

    document.getElementById("recuperarUsuario").value = "";
    document.getElementById("recuperarPalabraClave").value = "";
    document.getElementById("nuevaContrasena").value = "";
    document.getElementById("confirmarNuevaContrasena").value = "";

    userIdValidado = null; // Reseteamos variable para evitar errores
  });

  // Botones
  const btnValidarClave = document.getElementById("btnValidarClave");
  const btnCambiarContrasena = document.getElementById("btnCambiarContrasena");

  // Validar usuario y palabra clave
  btnValidarClave.addEventListener("click", function () {
    const usuario = document.getElementById("recuperarUsuario").value.trim();
    const palabraClave = document.getElementById("recuperarPalabraClave").value.trim();

    if (!usuario || !palabraClave) {
      Swal.fire({
        title: '<span style="font-size: 1.8rem;">⚠️ Atención</span>',
        html: '<p style="font-size: 1.1rem; color: #f39c12;">Por favor, completa ambos campos.</p>',
        icon: 'warning',
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
        background: '#fff8e1',
        didOpen: () => {
          const content = Swal.getHtmlContainer();
          content.style.textAlign = 'center';
          content.style.fontWeight = '600';
        },
        showClass: {
          popup: 'animate__animated animate__fadeInDown'
        },
        hideClass: {
          popup: 'animate__animated animate__fadeOutUp'
        }
      });

      return;
    }

    fetch("/usuario/validar_palabra_clave", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuario, palabra_clave: palabraClave })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          userIdValidado = data.user_id;
          paso1.classList.add("animate__animated", "animate__fadeOutLeft");
          setTimeout(() => {
            paso1.style.display = "none";
            paso1.classList.remove("animate__animated", "animate__fadeOutLeft");
            paso2.style.display = "block";
            paso2.classList.add("animate__animated", "animate__fadeInRight");
          }, 400);
        } else {
          Swal.fire({
            title: '<span style="font-size: 1.8rem;">❌ No se pudo validar</span>',
            html: `<p style="font-size: 1.1rem; color: #e74c3c;">${data.message || "Usuario o palabra clave incorrectos."}</p>`,
            icon: 'error',
            timer: 2000,
            timerProgressBar: true,
            showConfirmButton: false,
            background: '#fff5f5',
            didOpen: () => {
              const content = Swal.getHtmlContainer();
              content.style.textAlign = 'center';
              content.style.fontWeight = '600';
            },
            showClass: {
              popup: 'animate__animated animate__shakeX'
            },
            hideClass: {
              popup: 'animate__animated animate__fadeOutUp'
            }
          });

        }
      })
      .catch(() => {
        Swal.fire("Error", "Error en la conexión con el servidor.", "error");
      });
  });

  // Cambiar contraseña
  btnCambiarContrasena.addEventListener("click", function () {
    const nuevaContrasena = document.getElementById("nuevaContrasena").value.trim();
    const confirmarContrasena = document.getElementById("confirmarNuevaContrasena").value.trim();

    if (!nuevaContrasena || !confirmarContrasena) {
      Swal.fire({
        title: '<span style="font-size: 1.8rem;">⚠️ Atención</span>',
        html: '<p style="font-size: 1.1rem; color: #f39c12;">Completa ambos campos de contraseña.</p>',
        icon: 'warning',
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
        background: '#fff8e1', /* Fondo amarillo claro */
        didOpen: () => {
          const content = Swal.getHtmlContainer();
          content.style.textAlign = 'center';
          content.style.fontWeight = '600';
        },
        showClass: {
          popup: 'animate__animated animate__zoomInDown'
        },
        hideClass: {
          popup: 'animate__animated animate__fadeOutUp'
        }
      });

      return;
    }
    if (nuevaContrasena !== confirmarContrasena) {
      Swal.fire({
        title: '<span style="font-size: 1.8rem;">⚠️ Atención</span>',
        html: '<p style="font-size: 1.1rem; color: #e67e22;">Las contraseñas no coinciden.</p>',
        icon: 'warning',
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
        background: '#fff8e1', /* Fondo amarillo suave */
        didOpen: () => {
          const content = Swal.getHtmlContainer();
          content.style.textAlign = 'center';
          content.style.fontWeight = '600';
        },
        showClass: {
          popup: 'animate__animated animate__bounceIn'
        },
        hideClass: {
          popup: 'animate__animated animate__fadeOutUp'
        }
      });

      return;
    }

    if (!userIdValidado) {
      Swal.fire({
        title: '<span style="font-size: 1.8rem;">⚠️ Atención</span>',
        html: '<p style="font-size: 1.1rem; color: #e74c3c;">No se ha validado el usuario correctamente.</p>',
        icon: 'error',
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
        background: '#fff5f5', /* Fondo suave para el error */
        didOpen: () => {
          const content = Swal.getHtmlContainer();
          content.style.textAlign = 'center';
          content.style.fontWeight = '600';
        },
        showClass: {
          popup: 'animate__animated animate__shakeX'
        },
        hideClass: {
          popup: 'animate__animated animate__fadeOutUp'
        }
      });

      return;
    }

    fetch("/usuario/cambiar_contrasena", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userIdValidado, nueva_contrasena: nuevaContrasena })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          Swal.fire({
            title: '<span style="font-size: 1.8rem;">✅ ¡Contraseña actualizada!</span>',
            html: '<p style="font-size: 1.1rem; color: #2ecc71;">Puedes iniciar sesión con tu nueva contraseña.</p>',
            icon: 'success',
            timer: 2500,
            timerProgressBar: true,
            showConfirmButton: false,
            background: '#f0fff4', /* Fondo verde muy suave */
            didOpen: () => {
              const content = Swal.getHtmlContainer();
              content.style.textAlign = 'center';
              content.style.fontWeight = '600';
            },
            showClass: {
              popup: 'animate__animated animate__zoomInDown'
            },
            hideClass: {
              popup: 'animate__animated animate__fadeOutUp'
            }
          }).then(() => {
            const modal = bootstrap.Modal.getInstance(modalRecuperarClave);
            modal.hide();

            paso1.style.display = "block";
            paso2.style.display = "none";
            document.getElementById("recuperarUsuario").value = "";
            document.getElementById("recuperarPalabraClave").value = "";
            document.getElementById("nuevaContrasena").value = "";
            document.getElementById("confirmarNuevaContrasena").value = "";
            userIdValidado = null;
          });
        } else {
          Swal.fire({
            title: '<span style="font-size: 1.8rem;">⚠️ Atención</span>',
            html: `<p style="font-size: 1.1rem; color: #e74c3c;">${data.message || "No se pudo actualizar la contraseña."}</p>`,
            icon: 'error',
            timer: 2000,
            timerProgressBar: true,
            showConfirmButton: false,
            background: '#fff5f5', /* Fondo suave para el error */
            didOpen: () => {
              const content = Swal.getHtmlContainer();
              content.style.textAlign = 'center';
              content.style.fontWeight = '600';
            },
            showClass: {
              popup: 'animate__animated animate__shakeX'
            },
            hideClass: {
              popup: 'animate__animated animate__fadeOutUp'
            }
          });

        }
      })
      .catch(() => {
        Swal.fire("Error", "Error en la conexión con el servidor.", "error");
      });
  });

});

const dniInput = document.getElementById("dni-input");
if (dniInput) {
  dniInput.addEventListener("input", function() {
    const newValue = this.value.replace(/\D/g, "");  // Solo permite números
    if (this.value !== newValue) {
      Swal.fire({
        icon: "warning",
        title: "⚠️ Solo números permitidos",
        html: "El DNI solo puede contener números.",
        confirmButtonColor: "#f39c12",
        background: "#fff8e1",
        customClass: {
          popup: "rounded-4 shadow border border-warning",
          confirmButton: "btn btn-warning fw-semibold px-4 py-2"
        },
        timer: 3000,
        timerProgressBar: true,
        showClass: { popup: "animate__animated animate__fadeInDown" },
        hideClass: { popup: "animate__animated animate__fadeOutUp" },
      });
    }
    this.value = newValue;

    if (this.value.length > 8) {
      this.value = this.value.slice(0, 8); // Limitar a 8 caracteres
      Swal.fire({
        icon: "warning",
        title: "⚠️ Máximo 8 caracteres",
        html: "El DNI no puede tener más de 8 dígitos.",
        confirmButtonColor: "#f39c12",
        background: "#fff8e1",
        customClass: {
          popup: "rounded-4 shadow border border-warning",
          confirmButton: "btn btn-warning fw-semibold px-4 py-2"
        },
        timer: 3000,
        timerProgressBar: true,
        showClass: { popup: "animate__animated animate__fadeInDown" },
        hideClass: { popup: "animate__animated animate__fadeOutUp" },
      });
    }
  });
}


const apellidoPaternoInput = document.getElementById("apellido-paterno-input");
if (apellidoPaternoInput) {
  apellidoPaternoInput.addEventListener("input", function () {
    const newValue = this.value.replace(/[0-9]/g, "");
    if (this.value !== newValue) {
      Swal.fire({
        icon: "warning",
        title: "⚠️ Solo letras permitidas",
        html: "El apellido paterno no puede contener números.",
        confirmButtonColor: "#f39c12",
        background: "#fff8e1",
        customClass: {
          popup: "rounded-4 shadow border border-warning",
          confirmButton: "btn btn-warning fw-semibold px-4 py-2"
        },
        timer: 3000,
        timerProgressBar: true,
        showClass: { popup: "animate__animated animate__fadeInDown" },
        hideClass: { popup: "animate__animated animate__fadeOutUp" },
      });
    }
    this.value = newValue;

    if (this.value.length > 80) {
      this.value = this.value.slice(0, 80);
      Swal.fire({
        icon: "warning",
        title: "⚠️ Máximo 80 caracteres",
        html: "El apellido paterno no puede tener más de 80 caracteres.",
        confirmButtonColor: "#f39c12",
        background: "#fff8e1",
        customClass: {
          popup: "rounded-4 shadow border border-warning",
          confirmButton: "btn btn-warning fw-semibold px-4 py-2"
        },
        timer: 3000,
        timerProgressBar: true,
        showClass: { popup: "animate__animated animate__fadeInDown" },
        hideClass: { popup: "animate__animated animate__fadeOutUp" },
      });
    }
  });
}

const telefonoInput = document.getElementById("telefono-input");
if (telefonoInput) {
  telefonoInput.addEventListener("input", function () {
    const newValue = this.value.replace(/\D/g, "");
    if (this.value !== newValue) {
      Swal.fire({
        icon: "warning",
        title: "⚠️ Solo números permitidos",
        html: "El teléfono solo puede contener números.",
        confirmButtonColor: "#f39c12",
        background: "#fff8e1",
        customClass: {
          popup: "rounded-4 shadow border border-warning",
          confirmButton: "btn btn-warning fw-semibold px-4 py-2"
        },
        timer: 3000,
        timerProgressBar: true,
        showClass: { popup: "animate__animated animate__fadeInDown" },
        hideClass: { popup: "animate__animated animate__fadeOutUp" },
      });
    }
    this.value = newValue;

    if (this.value.length > 9) {
      this.value = this.value.slice(0, 9);
      Swal.fire({
        icon: "warning",
        title: "⚠️ Máximo 9 dígitos",
        html: "El teléfono no puede tener más de 9 dígitos.",
        confirmButtonColor: "#f39c12",
        background: "#fff8e1",
        customClass: {
          popup: "rounded-4 shadow border border-warning",
          confirmButton: "btn btn-warning fw-semibold px-4 py-2"
        },
        timer: 3000,
        timerProgressBar: true,
        showClass: { popup: "animate__animated animate__fadeInDown" },
        hideClass: { popup: "animate__animated animate__fadeOutUp" },
      });
    }
  });
}

const nombresInput = document.getElementById("nombres-input");
if (nombresInput) {
  nombresInput.addEventListener("input", function () {
    const newValue = this.value.replace(/[0-9]/g, "");
    if (this.value !== newValue) {
      Swal.fire({
        icon: "warning",
        title: "⚠️ Solo letras permitidas",
        html: "El campo nombres no puede contener números.",
        confirmButtonColor: "#f39c12",
        background: "#fff8e1",
        customClass: {
          popup: "rounded-4 shadow border border-warning",
          confirmButton: "btn btn-warning fw-semibold px-4 py-2"
        },
        timer: 3000,
        timerProgressBar: true,
        showClass: { popup: "animate__animated animate__fadeInDown" },
        hideClass: { popup: "animate__animated animate__fadeOutUp" },
      });
    }
    this.value = newValue;

    if (this.value.length > 80) {
      this.value = this.value.slice(0, 8);
      Swal.fire({
        icon: "warning",
        title: "⚠️ Máximo 8 caracteres",
        html: "El campo nombres no puede tener más de 80 caracteres.",
        confirmButtonColor: "#f39c12",
        background: "#fff8e1",
        customClass: {
          popup: "rounded-4 shadow border border-warning",
          confirmButton: "btn btn-warning fw-semibold px-4 py-2"
        },
        timer: 3000,
        timerProgressBar: true,
        showClass: { popup: "animate__animated animate__fadeInDown" },
        hideClass: { popup: "animate__animated animate__fadeOutUp" },
      });
    }
  });
}

const apellidoMaternoInput = document.getElementById("apellido-materno-input");
if (apellidoMaternoInput) {
  apellidoMaternoInput.addEventListener("input", function () {
    const newValue = this.value.replace(/[0-9]/g, "");
    if (this.value !== newValue) {
      Swal.fire({
        icon: "warning",
        title: "⚠️ Solo letras permitidas",
        html: "El apellido materno no puede contener números.",
        confirmButtonColor: "#f39c12",
        background: "#fff8e1",
        customClass: {
          popup: "rounded-4 shadow border border-warning",
          confirmButton: "btn btn-warning fw-semibold px-4 py-2"
        },
        timer: 3000,
        timerProgressBar: true,
        showClass: { popup: "animate__animated animate__fadeInDown" },
        hideClass: { popup: "animate__animated animate__fadeOutUp" },
      });
    }
    this.value = newValue;

    if (this.value.length > 80) {
      this.value = this.value.slice(0, 80);
      Swal.fire({
        icon: "warning",
        title: "⚠️ Máximo 80 caracteres",
        html: "El apellido materno no puede tener más de 80 caracteres.",
        confirmButtonColor: "#f39c12",
        background: "#fff8e1",
        customClass: {
          popup: "rounded-4 shadow border border-warning",
          confirmButton: "btn btn-warning fw-semibold px-4 py-2"
        },
        timer: 3000,
        timerProgressBar: true,
        showClass: { popup: "animate__animated animate__fadeInDown" },
        hideClass: { popup: "animate__animated animate__fadeOutUp" },
      });
    }
  });
}
