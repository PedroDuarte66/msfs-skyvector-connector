let portNumber = "8001";
let isTrackingEnabled = false;

chrome.storage.sync.get(
  { portNumber: "8001", trackingEnabled: false },
  (data) => {
    portNumber = data.portNumber;
    isTrackingEnabled = data.trackingEnabled;
    injectScript();
  },
);

chrome.storage.onChanged.addListener((changes) => {
  if (changes.portNumber) portNumber = changes.portNumber.newValue;
  if (changes.trackingEnabled)
    isTrackingEnabled = changes.trackingEnabled.newValue;
});

function injectScript() {
  const s = document.createElement("script");
  s.src = chrome.runtime.getURL("injected.js");
  s.setAttribute("data-icon-url", chrome.runtime.getURL("avion_rojo.png"));
  (document.head || document.documentElement).appendChild(s);
}

// --- TU FUNCIÓN ORIGINAL ADAPTADA ---
function getLocation() {
  if (!isTrackingEnabled) return;

  var xhr = new XMLHttpRequest();
  xhr.addEventListener("readystatechange", function () {
    if (this.readyState === 4 && this.status === 200) {
      try {
        var jsonResult = JSON.parse(this.responseText);

        // Verificamos que existan coordenadas válidas
        if (jsonResult.coordinates) {
          window.postMessage(
            {
              type: "FROM_CONTENT",
              coords: jsonResult.coordinates,
              heading: jsonResult.heading, // <-- Pasamos el rumbo real
            },
            "*",
          );
        } else {
          console.log("Esperando datos válidos del simulador...");
        }
      } catch (e) {
        console.error("Error en la comunicación:", e);
      }
    }
  });
  xhr.open("GET", "http://localhost:" + portNumber + "/get?position");
  xhr.send(null);
}

setInterval(getLocation, 200);
