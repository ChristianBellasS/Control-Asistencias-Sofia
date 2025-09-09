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

// Arrays de imágenes (dataURL base64)
let capturedShots = [];   // desde cámara
let uploadedImages = [];  // desde archivos

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
    stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
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
}

function scheduleRecognition() {
  clearInterval(recogTimer);
  if (!recogRunning) return;
  recogTimer = setInterval(async () => {
    if (!video.videoWidth) return;
    const canvas = canvasFromVideo();
    const dataURL = canvas.toDataURL("image/jpeg", 0.8);

    try {
      const res = await fetch("/reconocimiento/recognize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataURL })
      });
      const data = await res.json();
      if (!data.ok) {
        recogStatus.textContent = "Error de servidor";
        return;
      }
      if (data.recognized) {
        recogStatus.textContent = "✅ Reconocido";
        personCard.classList.remove("hidden");
        personId.textContent = data.id || "—";
        personName.textContent = data.name || "—";
        personDist.textContent = data.distance ?? "—";
        if (data.photo) personPhoto.src = data.photo;
      } else {
        recogStatus.textContent = "❌ No reconocido";
        personCard.classList.add("hidden");
      }
    } catch (e) {
      console.error(e);
      recogStatus.textContent = "Error de red";
    }
  }, 800);
}

btnStart.addEventListener("click", startCamera);
btnStop.addEventListener("click", () => {
  stopCamera();
  recogStatus.textContent = "Cámara detenida";
  personCard.classList.add("hidden");
});

btnToggleRecog.addEventListener("click", () => {
  recogRunning = !recogRunning;
  btnToggleRecog.textContent = recogRunning ? "⏸️ Pausar" : "▶️ Reanudar";
  scheduleRecognition();
});

/* ---------- Utilidades Registro ---------- */
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

/* ---------- Capturar desde cámara ---------- */
btnCapture.addEventListener("click", async () => {
  if (!stream) {
    alert("Primero inicia la cámara.");
    return;
  }

  // limpiamos todo y tomamos 5
  capturedShots = [];
  // NO limpiamos uploadedImages para permitir mezcla
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

/* ---------- Subir archivos ---------- */
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

  // NO borramos capturedShots; permitimos mezclar
  // sí agregamos previews de los nuevos archivos encima
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
