let currentConfig = {
  serverAddress: "localhost:8001",
  trackingEnabled: false,
};

// Carga inicial
chrome.storage.sync.get(["serverAddress", "trackingEnabled"], (data) => {
  currentConfig.serverAddress = data.serverAddress || "localhost:8001";
  currentConfig.trackingEnabled = data.trackingEnabled || false;
  injectScript();
});

// Escuchar cambios
chrome.storage.onChanged.addListener((changes) => {
  if (changes.serverAddress)
    currentConfig.serverAddress = changes.serverAddress.newValue;
  if (changes.trackingEnabled)
    currentConfig.trackingEnabled = changes.trackingEnabled.newValue;
});

// 3. Función para inyectar el script visual (Mantenla tal cual)
function injectScript() {
  const s = document.createElement("script");
  s.src = chrome.runtime.getURL("injected.js");
  s.setAttribute("data-icon-url", chrome.runtime.getURL("avion_rojo.png"));
  (document.head || document.documentElement).appendChild(s);
}

// 4. Obtener ubicación usando la dirección combinada
function getLocation() {
  // 1. Verificamos si el usuario activó el rastreo
  if (!currentConfig.trackingEnabled || !currentConfig.serverAddress) return;

  var xhr = new XMLHttpRequest();
  xhr.addEventListener("readystatechange", function () {
    if (this.readyState === 4 && this.status === 200) {
      try {
        var jsonResult = JSON.parse(this.responseText);

        // 2. Si hay coordenadas, enviamos el mensaje al mapa (injected.js)
        if (jsonResult.coordinates) {
          window.postMessage(
            {
              type: "FROM_CONTENT",
              coords: jsonResult.coordinates,
              heading: jsonResult.heading,
            },
            "*",
          );
        }
      } catch (e) {
        console.error("Error procesando datos del simulador:", e);
      }
    }
  });

  // 3. Petición a la dirección completa (IP:Puerto)
  if (currentConfig.serverAddress === "localhost:8001") {
    xhr.open("GET", "http://" + currentConfig.serverAddress + "/get?position");
  } else {
    xhr.open("GET", "https://" + currentConfig.serverAddress + "/get?position");
  }
  xhr.send(null);
}

// Ejecutar cada 200ms
setInterval(getLocation, 200);
