// Localiza el nuevo elemento
const localToggle = document.getElementById("localToggle");
const serverInput = document.getElementById("serverAddress");
const saveBtn = document.getElementById("saveBtn");

// Función auxiliar para habilitar el botón de guardado
function markAsUnsaved() {
  saveBtn.disabled = false;
  saveBtn.style.opacity = "1";
  saveBtn.textContent = "Save Settings";
}

serverInput.addEventListener("input", () => {
  markAsUnsaved(); // Se habilita en cuanto el usuario toca una tecla
  if (serverInput.value.toLowerCase().includes("localhost")) {
    localToggle.checked = true;
  } else {
    localToggle.checked = false;
  }
});

// 3. BOTÓN SAVE: Guardar y Deshabilitar
saveBtn.addEventListener("click", () => {
  const address = serverInput.value;
  chrome.storage.sync.set({ serverAddress: address }, () => {
    // Efecto visual de guardado
    saveBtn.disabled = true;
    saveBtn.style.opacity = "0.5";
    saveBtn.textContent = "Settings Saved ✓";
    console.log("Saved: " + address);
  });
});

// Al cambiar el switch
localToggle.addEventListener("change", () => {
  markAsUnsaved(); // Se habilitará porque el valor cambió
  if (localToggle.checked) {
    serverInput.value = "localhost:8001";
  } else {
    if (serverInput.value === "localhost:8001") serverInput.value = "";
  }
});

// Al guardar
document.getElementById("saveBtn").addEventListener("click", () => {
  const address = document.getElementById("serverAddress").value;
  chrome.storage.sync.set({ serverAddress: address }, () => {
    alert("Saved: " + address);
  });
});

document.getElementById("toggleBtn").addEventListener("click", () => {
  chrome.storage.sync.get({ trackingEnabled: false }, (data) => {
    const newState = !data.trackingEnabled;

    // 1. Guardamos el nuevo estado
    chrome.storage.sync.set({ trackingEnabled: newState }, () => {
      // 2. ACTUALIZACIÓN INSTANTÁNEA:
      // Cambiamos el texto del botón
      document.getElementById("toggleBtn").textContent = newState
        ? "Disable Tracking"
        : "Enable Tracking";

      // 3. Llamamos a la función para que cambie el color del cuadro de estado
      updateStatus(newState);
    });
  });
});

// This runs when you open the popup
chrome.storage.sync.get(["trackingEnabled", "serverAddress"], (data) => {
  const isEnabled = data.trackingEnabled || false;
  const address = data.serverAddress || "localhost:8001";

  serverInput.value = address;

  // Si la dirección es localhost, ponemos el switch en ON
  if (address.includes("localhost")) {
    localToggle.checked = true;
  }

  document.getElementById("toggleBtn").textContent = isEnabled
    ? "Disable Tracking"
    : "Enable Tracking";
  updateStatus(isEnabled);
  // Al abrir el popup, el botón de guardar está deshabilitado
  saveBtn.disabled = true;
  saveBtn.style.opacity = "0.5";
});

// Esta es la función que cambia los colores y el texto del cuadro inferior
function updateStatus(enabled) {
  const status = document.getElementById("status");
  if (enabled) {
    status.className = "connected"; // Pone el fondo verde
    status.textContent = "✅ Tracking Active";
  } else {
    status.className = "disconnected"; // Pone el fondo rojo
    status.textContent = "❌ Tracking Inactive";
  }
}
