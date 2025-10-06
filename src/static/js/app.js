const video = document.getElementById("video");
const btnStart = document.getElementById("btnStart");
const btnStop = document.getElementById("btnStop");
const btnToggleRecog = document.getElementById("btnToggleRecog");

const recogStatus = document.getElementById("recogStatus");
const personCard = document.getElementById("personCard");
const personPhoto = document.getElementById("personPhoto");
const personId = document.getElementById("personId");
const personName = document.getElementById("personName");
const personDist = document.getElementById("personDist");

const regId = document.getElementById("regId");
const regName = document.getElementById("regName");
const btnCapture = document.getElementById("btnCapture");
const btnRegister = document.getElementById("btnRegister");
const shotsDiv = document.getElementById("shots");
const fileInput = document.getElementById("fileInput");

let stream = null;
let recogTimer = null;
let recogRunning = true;
let isProcessing = false; // Control para evitar solapamiento
let lastRecognizedId = null;
let requestController = null; // AbortController actual

// Arrays de imágenes
let capturedShots = [];
let uploadedImages = [];

function sleep(ms) { return new Promise(res => setTimeout(res, ms)); }

function canvasFromVideo() {
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas;
}

async function startCamera() {
  if (stream) return;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ 
      video: { width: 640, height: 480 }, 
      audio: false 
    });
    video.srcObject = stream;
    await video.play();
    recogRunning = true;
    scheduleRecognition();
  } catch (err) {
    console.error("No se pudo abrir la cámara:", err);
    alert("No se pudo abrir la cámara. Revisa permisos del navegador.");
  }
}

function stopCamera() {
  if (stream) {
    stream.getTracks().forEach(t => t.stop());
    stream = null;
  }
  video.srcObject = null;
  clearInterval(recogTimer);
  recogTimer = null;
  
  // Cancelar request pendiente
  if (requestController) {
    requestController.abort();
    requestController = null;
  }
  isProcessing = false;
}

// Función principal de reconocimiento - MEJORADA
async function processRecognition() {
  // Si ya está procesando o no está corriendo, salir
  if (isProcessing || !recogRunning || !video.videoWidth) {
    return;
  }
  
  isProcessing = true;
  
  // Cancelar cualquier request anterior
  if (requestController) {
    requestController.abort();
  }
  
  const canvas = canvasFromVideo();
  const dataURL = canvas.toDataURL("image/jpeg", 0.8);

  try {
    // Crear nuevo AbortController
    requestController = new AbortController();
    
    const res = await fetch("/reconocimiento/recognize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: dataURL }),
      signal: requestController.signal
    });
    
    const data = await res.json();
    
    // Si el request fue saltado (rate limiting), ignorar
    if (data.skipped) {
      isProcessing = false;
      return;
    }
    
    if (!data.ok) {
      recogStatus.textContent = "Error de servidor";
      isProcessing = false;
      return;
    }
    
    if (data.recognized) {
      const currentPersonId = data.id;
      
      // Solo actualizar si es una persona diferente
      if (currentPersonId !== lastRecognizedId) {
        recogStatus.textContent = "✅ Reconocido";
        personCard.classList.remove("hidden");
        personId.textContent = data.id || "—";
        personName.textContent = data.name || "—";
        personDist.textContent = data.distance?.toFixed(4) ?? "—";

        if (data.photo) {
          personPhoto.src = data.photo;
        }
        
        lastRecognizedId = currentPersonId;
        console.log(`Persona reconocida: ${data.name} (ID: ${data.id})`);
      }
    } else {
      // Solo actualizar si antes estaba reconocido alguien
      if (lastRecognizedId !== null) {
        recogStatus.textContent = "❌ No reconocido";
        personCard.classList.add("hidden");
        lastRecognizedId = null;
        console.log("Persona no reconocida");
      }
    }

  } catch (e) {
    // Ignorar errores de cancelación
    if (e.name !== 'AbortError') {
      console.error("Error en reconocimiento:", e);
      recogStatus.textContent = "Error de red";
    }
  } finally {
    isProcessing = false;
    requestController = null;
  }
}

// Nueva función de scheduling - MEJORADA
function scheduleRecognition() {
  clearInterval(recogTimer);
  if (!recogRunning) return;
  
  // Usar setTimeout recursivo en lugar de setInterval para mejor control
  function runRecognition() {
    if (!recogRunning || !stream) return;
    
    processRecognition().finally(() => {
      // Programar siguiente ejecución después de que termine la actual
      if (recogRunning && stream) {
        recogTimer = setTimeout(runRecognition, 300); // 300ms entre procesos COMPLETOS
      }
    });
  }
  
  // Iniciar el ciclo
  runRecognition();
}

btnStart.addEventListener("click", startCamera);
btnStop.addEventListener("click", () => {
  stopCamera();
  recogStatus.textContent = "Cámara detenida";
  personCard.classList.add("hidden");
  lastRecognizedId = null;
});

btnToggleRecog.addEventListener("click", () => {
  recogRunning = !recogRunning;
  btnToggleRecog.textContent = recogRunning ? "⏸️ Pausar" : "▶️ Reanudar";
  
  if (recogRunning) {
    scheduleRecognition();
  } else {
    clearInterval(recogTimer);
    clearTimeout(recogTimer);
    // Cancelar request actual al pausar
    if (requestController) {
      requestController.abort();
      requestController = null;
    }
    isProcessing = false;
  }
});

/* ---------- Utilidades Registro (sin cambios) ---------- */
function clearPreviews() {
  shotsDiv.innerHTML = "";
}

function pushPreview(dataURL) {
  const img = new Image();
  img.src = dataURL;
  img.width = 100;
  img.className = "thumb";
  shotsDiv.appendChild(img);
}

function updateRegisterButtonState() {
  const total = capturedShots.length + uploadedImages.length;
  btnRegister.disabled = total === 0 || !(regId.value || "").trim();
}

btnCapture.addEventListener("click", async () => {
  if (!stream) {
    alert("Primero inicia la cámara.");
    return;
  }

  capturedShots = [];
  clearPreviews();

  for (let i = 0; i < 5; i++) {
    const canvas = canvasFromVideo();
    const dataURL = canvas.toDataURL("image/jpeg", 0.9);
    capturedShots.push(dataURL);
    pushPreview(dataURL);
    await sleep(300);
  }
  updateRegisterButtonState();
});

function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

fileInput.addEventListener("change", async () => {
  const files = Array.from(fileInput.files || []);
  if (!files.length) return;

  for (const f of files) {
    try {
      const dataURL = await fileToDataURL(f);
      uploadedImages.push(dataURL);
      pushPreview(dataURL);
    } catch (e) {
      console.error("Error leyendo archivo:", e);
    }
  }
  updateRegisterButtonState();
});