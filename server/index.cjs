const express = require("express");
const cors = require("cors");
const SysTray = require("systray2").default;
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 8001;
app.use(cors());

// --- 1. VARIABLES GLOBALES ---
let planeData = { latitude: null, longitude: null, connected: false };
let api = null;
let intervalId = null;

// --- 2. FUNCIÓN PARA EL ICONO ---
function getIcon(filePath) {
  try {
    // Leemos el archivo físico avion.ico
    return fs.readFileSync(filePath).toString("base64");
  } catch (err) {
    console.log(
      "⚠️ No se pudo cargar avion.ico, usando punto azul por defecto.",
    );
    return "iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAMklEQVR42mP8/5+hnoGBAcmAAYhZ6CHASB74j+SBD9H/Gf+RPAhG8iAYyYNgJA+CkWQAALALH/F699SNAAAAAElFTkSuQmCC";
  }
}

const iconPath = path.join(__dirname, "posicion.ico");
const iconBase64 = getIcon(iconPath);

// --- 3. CONFIGURACIÓN DE LA BANDEJA (Una sola vez) ---
const systray = new SysTray({
  menu: {
    icon: iconBase64,
    title: "MSFS SkyVector",
    tooltip: "MSFS SkyVector Server",
    items: [
      {
        title: "Stop Server",
        tooltip: "Stop and Exit",
        checked: false,
        enabled: true,
      },
    ],
  },
  debug: false,
  copyDir: true,
});

systray.onClick((action) => {
  if (action.item.title === "Stop Server") {
    console.log("Closing from system tray...");
    systray.kill();
    process.exit(0);
  }
});

// --- 4. CONEXIÓN AL SIMULADOR ---
async function startSimConnection() {
  try {
    const msfsModule = await import("msfs-simconnect-api-wrapper");
    const { MSFS_API } = msfsModule;

    async function connectSim() {
      if (intervalId) clearInterval(intervalId);

      // LIMPIEZA: Si ya existía una instancia de la API, intenta cerrarla antes de crear una nueva
      if (api && typeof api.disconnect === "function") {
        try {
          api.disconnect();
        } catch (e) {}
      }

      try {
        api = new MSFS_API();
        await api.connect({ autoReconnect: true });
        planeData.connected = true;
        console.log("✅ Connected to Microsoft Flight Simulator");

        intervalId = setInterval(async () => {
          try {
            if (planeData.connected && api) {
              const lat = await api.get("PLANE LATITUDE");
              const lon = await api.get("PLANE LONGITUDE");
              const hdg = await api.get("PLANE HEADING DEGREES TRUE");

              if (lat && lon && hdg) {
                planeData.latitude = lat.PLANE_LATITUDE ?? lat.value ?? lat;
                planeData.longitude = lon.PLANE_LONGITUDE ?? lon.value ?? lon;
                // El heading viene en grados, lo guardamos:
                planeData.heading =
                  hdg.PLANE_HEADING_DEGREES_TRUE ?? hdg.value ?? hdg;
              }
            }
          } catch (err) {}
        }, 100);
      } catch (err) {
        console.log("⏳ Searching for simulator...");
        planeData.connected = false;
        setTimeout(connectSim, 5000);
      }
    }
    connectSim();
  } catch (error) {
    console.error("❌ Error loading MSFS library:", error);
  }
}

// --- 5. RUTAS ---
app.get("/get", (req, res) => {
  res.set({
    "Cache-Control": "no-store, no-cache, must-revalidate, private",
    Pragma: "no-cache", // Para compatibilidad con navegadores muy antiguos
    Expires: "0", // Marca la respuesta como expirada de inmediato
  });
  res.json({
    coordinates: [planeData.latitude, planeData.longitude],
    heading: planeData.heading, // <-- Lo enviamos a la extensión
    connected: planeData.connected,
  });
});

app.get("/exit", (req, res) => {
  console.log("Cerrando desde navegador...");
  res.send("Cerrando servidor...");
  systray.kill();
  setTimeout(() => process.exit(0), 1000);
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor SkyVector en http://localhost:${PORT}`);
  startSimConnection();
});
