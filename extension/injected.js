var scriptTag = document.querySelector("script[data-icon-url]");
var airplaneImageUrl = scriptTag ? scriptTag.getAttribute("data-icon-url") : "";
var planeSize = 60;

function setMapIcon(latlon, heading) {
  if (typeof SkyVector === "undefined" || !latlon) return;

  var lat = (latlon[0] * 180) / Math.PI;
  var lon = (latlon[1] * 180) / Math.PI;

  // --- CONVERSIÓN DE HEADING (Radianes a Grados) ---
  var headingGrados = (heading * 180) / Math.PI;
  // console.log("Rumbo en grados:", headingGrados);

  var img = document.getElementById("movingAirplane");
  if (!img) {
    img = document.createElement("img");
    img.id = "movingAirplane";
    img.src = airplaneImageUrl;
    img.style.height = planeSize + "px";
    img.style.width = planeSize + "px";
    img.style.zIndex = "1000";
    img.style.position = "absolute";
    var el = document.getElementById("sv_svgLayer");
    if (el) el.parentNode.insertBefore(img, el.nextSibling);
  }

  var point = SkyVector.ll2xy(lat, lon);
  if (point && img) {
    const x = point.x - SkyVector.data.slideroffsetx - planeSize / 2;
    const y = point.y - SkyVector.data.slideroffsety - planeSize / 2;

    // Resetear top y left para que mande el transform
    img.style.top = "0px";
    img.style.left = "0px";
    img.style.visibility = "visible";

    // --- LA CLAVE: Combinar Posición y Rotación en un solo Transform ---
    if (typeof headingGrados === "number") {
      // Usamos translate3d para activar la aceleración de video (GPU) + rotate
      img.style.transform = `translate3d(${x}px, ${y}px, 0px) rotate(${headingGrados}deg)`;
    } else {
      img.style.transform = `translate3d(${x}px, ${y}px, 0px)`;
    }
  }
}

// RECEPTOR DE MENSAJES
window.addEventListener("message", function (event) {
  if (event.source !== window) return;
  if (event.data.type === "FROM_CONTENT") {
    // Asegúrate de que moving-map-content.js envíe 'coords' y 'heading'
    setMapIcon(event.data.coords, event.data.heading);
  }
});
