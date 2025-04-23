let map;
let directionsService;
let directionsRenderer;
let currentLocationMarker;
let watchId;
const options = {
  componentRestrictions: { country: "ar" },
};
const tollPoints = [
  { lat: -34.7188, lng: -58.2669, name: "Peaje Dock Sud" },
  { lat: -34.8502, lng: -58.0047, name: "Peaje Hudson" },
];

function addWaypoint() {
  const container = document.getElementById("waypoints-container");

  const div = document.createElement("div");
  div.className = "waypoint-row";

  const input = document.createElement("input");
  input.type = "text";
  input.className = "waypoint";
  input.placeholder = "Dirección intermedia";

  const removeBtn = document.createElement("button");
  removeBtn.textContent = "➖";
  removeBtn.onclick = () => container.removeChild(div);

  div.appendChild(input);
  div.appendChild(removeBtn);
  container.appendChild(div);

  new google.maps.places.Autocomplete(input, options);
}

function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: -34.6037, lng: -58.3816 },
    zoom: 12,
  });

  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer({
    map: map,
    suppressMarkers: true, // Suprimimos los marcadores originales para usar los nuestros
  });

  new google.maps.places.Autocomplete(
    document.getElementById("start"),
    options
  );
  new google.maps.places.Autocomplete(document.getElementById("end"), options);

  addWaypoint();

  if (!document.getElementById("route-steps")) {
    const routeStepsDiv = document.createElement("div");
    routeStepsDiv.id = "route-steps";
    routeStepsDiv.className = "route-steps";
    if (document.getElementById("summary")) {
      document.getElementById("summary").after(routeStepsDiv);
    } else {
      document.getElementById("map").before(routeStepsDiv);
    }
  }

  // Configurar importación de Excel
  setupExcelImport();

  // Agregar el botón de seguimiento GPS
  addGPSTrackingButton();
}

function addGPSTrackingButton() {
  const controlsDiv = document.getElementById("controls");

  const trackingDiv = document.createElement("div");
  trackingDiv.className = "gps-tracking-container";

  const trackingBtn = document.createElement("button");
  trackingBtn.id = "gps-tracking-btn";
  trackingBtn.className = "gps-tracking-button";
  trackingBtn.textContent = "🔴 Iniciar Seguimiento GPS";
  trackingBtn.onclick = toggleGPSTracking;

  trackingDiv.appendChild(trackingBtn);
  controlsDiv.appendChild(trackingDiv);
}

function toggleGPSTracking() {
  const trackingBtn = document.getElementById("gps-tracking-btn");

  if (trackingBtn.getAttribute("data-tracking") === "active") {
    // Detener seguimiento
    stopGPSTracking();
    trackingBtn.textContent = "🔴 Iniciar Seguimiento GPS";
    trackingBtn.setAttribute("data-tracking", "inactive");
    trackingBtn.style.backgroundColor = "#27ae60";
  } else {
    // Iniciar seguimiento
    startGPSTracking();
    trackingBtn.textContent = "⏹️ Detener Seguimiento GPS";
    trackingBtn.setAttribute("data-tracking", "active");
    trackingBtn.style.backgroundColor = "#c0392b";
  }
}

function startGPSTracking() {
  if (navigator.geolocation) {
    // Crear marcador inicial si no existe
    if (!currentLocationMarker) {
      currentLocationMarker = new google.maps.Marker({
        map: map,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: "#4285F4",
          fillOpacity: 0.8,
          strokeColor: "#FFFFFF",
          strokeWeight: 2,
        },
        title: "Tu ubicación actual",
      });
    }

    // Iniciar seguimiento continuo
    watchId = navigator.geolocation.watchPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const latlng = { lat, lng };

        // Actualizar posición del marcador
        currentLocationMarker.setPosition(latlng);

        // Centrar mapa en la posición actual
        map.setCenter(latlng);

        // Mostrar información de precisión
        const accuracy = position.coords.accuracy;
        currentLocationMarker.setTitle(
          `Tu ubicación (precisión: ${Math.round(accuracy)}m)`
        );
      },
      (error) => {
        Swal.fire({
          icon: error,
          title: "Error de GPS",
          text: "Error de GPS: ${getGeolocationErrorMessage(error)}",
          confirmButtonColor: "#007bff",
        });

        stopGPSTracking();
        const trackingBtn = document.getElementById("gps-tracking-btn");
        trackingBtn.textContent = "🔴 Iniciar Seguimiento GPS";
        trackingBtn.setAttribute("data-tracking", "inactive");
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 5000,
      }
    );

    // Mostrar notificación
    showNotification(
      "Seguimiento GPS activado. Te estamos siguiendo en el mapa."
    );
  } else {
    Swal.fire({
      icon: warning,
      title: "Error de GPS",
      text: "Tu navegador no soporta geolocalización",
      confirmButtonColor: "#007bff",
    });
  }
}

function stopGPSTracking() {
  if (watchId !== undefined) {
    navigator.geolocation.clearWatch(watchId);
    watchId = undefined;

    // Mostrar notificación
    showNotification("Seguimiento GPS desactivado.");
  }
}

function showNotification(message) {
  // Crear elemento de notificación
  const notification = document.createElement("div");
  notification.className = "gps-notification";
  notification.textContent = message;

  // Añadir al DOM
  document.body.appendChild(notification);

  // Eliminar después de un tiempo
  setTimeout(() => {
    notification.classList.add("fade-out");
    setTimeout(() => document.body.removeChild(notification), 500);
  }, 3000);
}

function getGeolocationErrorMessage(error) {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return "Permiso de ubicación denegado.";
    case error.POSITION_UNAVAILABLE:
      return "Información de ubicación no disponible.";
    case error.TIMEOUT:
      return "Se agotó el tiempo para obtener la ubicación.";
    case error.UNKNOWN_ERROR:
      return "Error desconocido de ubicación.";
    default:
      return "Error de ubicación.";
  }
}

function getCurrentLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const latlng = { lat, lng };

        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ location: latlng }, (results, status) => {
          if (status === "OK" && results[0]) {
            document.getElementById("start").value =
              results[0].formatted_address;
            map.setCenter(latlng);
          } else {
            Swal.fire({
              icon: error,
              title: "Error de Direcciones",
              text: "No se pudo detectar la direccion exacta",
              confirmButtonColor: "#007bff",
            });
          }
        });
      },
      () => {
        Swal.fire({
          icon: error,
          title: "Error de Ubicación",
          text: "Error al obtener ubicación.",
          confirmButtonColor: "#007bff",
        });
      }
    );
  } else {
    Swal.fire({
      icon: error,
      title: "Error de Navegador",
      text: "Tu navegador no soporta geolocalización.",
      confirmButtonColor: "#007bff",
    });
  }
}

function calculateRoute() {
  const start = document.getElementById("start").value;
  const end = document.getElementById("end").value;
  const waypointInputs = document.getElementsByClassName("waypoint");

  const avoidHighways = document.getElementById("avoidHighways").checked;
  const avoidTolls = document.getElementById("avoidTolls").checked;

  if (!start || !end) {
    Swal.fire({
      icon: warning,
      title: "Faltan direcciones",
      text: "Porfavor complete las direcciones de inicio y destino",
      confirmButtonColor: "#007bff",
    });
    return;
  }

  const waypoints = Array.from(waypointInputs)
    .map((input) => input.value.trim())
    .filter((val) => val !== "")
    .map((address) => ({ location: address, stopover: true }));

  const request = {
    origin: start,
    destination: end,
    waypoints: waypoints,
    travelMode: google.maps.TravelMode.DRIVING,
    optimizeWaypoints: true,
    avoidHighways: avoidHighways,
    avoidTolls: avoidTolls,
  };

  directionsService.route(request, (result, status) => {
    if (status === "OK") {
      // Limpiamos marcadores anteriores
      clearMarkers();

      // Render de la ruta
      directionsRenderer.setDirections(result);

      tollPoints.forEach((toll) => {
        const tollPosition = new google.maps.LatLng(toll.lat, toll.lng);

        const isOnRoute = result.routes[0].overview_path.some((pathPoint) => {
          const point = new google.maps.LatLng(
            pathPoint.lat(),
            pathPoint.lng()
          );
          return (
            google.maps.geometry.spherical.computeDistanceBetween(
              tollPosition,
              point
            ) < 500
          );
        });

        if (isOnRoute) {
          new google.maps.Marker({
            position: tollPosition,
            map: map,
            title: toll.name,
            icon: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
          });

          document.getElementById(
            "summary"
          ).innerHTML += `<br>🚧 Vas a pasar por el peaje <strong>${toll.name}</strong>`;
        }
      });

      let totalDistance = 0;
      let totalDuration = 0;
      const routeLegs = result.routes[0].legs;

      routeLegs.forEach((leg) => {
        totalDistance += leg.distance.value;
        totalDuration += leg.duration.value;
      });

      const km = (totalDistance / 1000).toFixed(1);
      const mins = Math.round(totalDuration / 60);

      document.getElementById(
        "summary"
      ).innerHTML = `🛣️ Distancia total: <strong>${km} km</strong><br>⏱️ Tiempo estimado: <strong>${mins} minutos</strong>`;

      const hasTolls = result.routes[0].warnings.some((warning) =>
        warning.toLowerCase().includes("toll")
      );

      const warnings = result.routes[0].warnings;
      if (warnings.length > 0) {
        const tolls = warnings.filter((w) => w.toLowerCase().includes("toll"));
        if (tolls.length > 0) {
          document.getElementById(
            "summary"
          ).innerHTML += `<br>🚧 Esta ruta pasa por <strong>peajes</strong>.`;
        }
      }

      if (!avoidTolls && hasTolls) {
        Swal.fire({
          icon: warning,
          title: "Ruta con peajes",
          text: "⚠️ Esta ruta incluye peajes. Revisá el recorrido para estimar el costo.",
          confirmButtonColor: "#007bff",
        });
      }

      // Mostrar secuencia de ruta para el chofer
      displayRouteSequence(result, start, end, waypoints);

      // Añadimos los marcadores con números en lugar de letras
      addSequenceMarkers(result, start, end, waypoints);
    } else {
      Swal.fire({
        icon: error,
        title: "Error al calcular",
        text: "No se pudo calcular la ruta: " + status,
        confirmButtonColor: "#007bff",
      });
    }
  });
}

// Almacena los marcadores de ruta para poder eliminarlos luego
let routeMarkers = [];

function clearMarkers() {
  // Eliminar todos los marcadores anteriores excepto el de ubicación actual
  routeMarkers.forEach((marker) => marker.setMap(null));
  routeMarkers = [];
}

function addSequenceMarkers(response, start, end, waypoints) {
  const waypointOrder = response.routes[0].waypoint_order;
  const legs = response.routes[0].legs;

  // Marcador de inicio (1)
  const startMarker = new google.maps.Marker({
    position: legs[0].start_location,
    map: map,
    label: {
      text: "1",
      color: "white",
      fontWeight: "bold",
    },
    icon: {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: "#27ae60",
      fillOpacity: 1,
      strokeColor: "white",
      strokeWeight: 2,
      scale: 12,
    },
    title: "Inicio: " + legs[0].start_address,
  });

  routeMarkers.push(startMarker);

  // Marcadores para paradas intermedias
  let stopNumber = 2;
  waypointOrder.forEach((index, i) => {
    // La posición del waypoint es el final del tramo correspondiente
    const position = legs[i].end_location;

    const waypointMarker = new google.maps.Marker({
      position: position,
      map: map,
      label: {
        text: stopNumber.toString(),
        color: "white",
        fontWeight: "bold",
      },
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: "#3498db",
        fillOpacity: 1,
        strokeColor: "white",
        strokeWeight: 2,
        scale: 12,
      },
      title: "Parada " + stopNumber + ": " + legs[i].end_address,
    });

    routeMarkers.push(waypointMarker);
    stopNumber++;
  });

  // Marcador de destino (último número)
  const destinationMarker = new google.maps.Marker({
    position: legs[legs.length - 1].end_location,
    map: map,
    label: {
      text: stopNumber.toString(),
      color: "white",
      fontWeight: "bold",
    },
    icon: {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: "#c0392b",
      fillOpacity: 1,
      strokeColor: "white",
      strokeWeight: 2,
      scale: 12,
    },
    title: "Destino: " + legs[legs.length - 1].end_address,
  });

  routeMarkers.push(destinationMarker);

  // Comprobar si inicio y destino son iguales o muy cercanos
  if (
    legs[0].start_location.equals(legs[legs.length - 1].end_location) ||
    google.maps.geometry.spherical.computeDistanceBetween(
      legs[0].start_location,
      legs[legs.length - 1].end_location
    ) < 50
  ) {
    // Ajustamos la posición del marcador de destino para que no se superpongan
    const offsetPosition = new google.maps.LatLng(
      legs[legs.length - 1].end_location.lat() + 0.0005,
      legs[legs.length - 1].end_location.lng() + 0.0005
    );
    destinationMarker.setPosition(offsetPosition);
  }
}

// Nueva función para mostrar la secuencia ordenada de paradas con números
function displayRouteSequence(response, start, end, waypoints) {
  const routeStepsDiv = document.getElementById("route-steps");
  if (!routeStepsDiv) {
    const newDiv = document.createElement("div");
    newDiv.id = "route-steps";
    newDiv.className = "route-steps";
    document.getElementById("summary").after(newDiv);
    routeStepsDiv = newDiv;
  }

  // Limpiar contenido anterior
  routeStepsDiv.innerHTML = "<h2>SECUENCIA DE PARADAS</h2>";

  // Obtener el orden optimizado de waypoints
  const waypointOrder = response.routes[0].waypoint_order;

  // Crear lista de direcciones ordenadas
  const orderedStops = [];

  // Agregar punto de inicio
  orderedStops.push({
    number: 1, // Usamos números en lugar de letras
    address: start,
    isStart: true,
  });

  // Agregar waypoints en el orden optimizado
  waypointOrder.forEach((index, i) => {
    const waypointAddress = waypoints[index].location;
    orderedStops.push({
      number: i + 2, // Comenzamos desde 2 (1 es el inicio)
      address: waypointAddress,
    });
  });

  // Agregar punto final
  orderedStops.push({
    number: waypointOrder.length + 2, // Último número
    address: end,
    isEnd: true,
  });

  // Crear elementos HTML para cada parada
  const stopsContainer = document.createElement("div");
  stopsContainer.className = "stops-container";

  orderedStops.forEach((stop, index) => {
    const stopElement = document.createElement("div");
    stopElement.className = "stop-item";

    // Agregar clases especiales para inicio y fin
    if (stop.isStart) {
      stopElement.classList.add("start-stop");
    } else if (stop.isEnd) {
      stopElement.classList.add("end-stop");
    }

    // Crear círculo con número (en lugar de letra)
    const numberCircle = document.createElement("div");
    numberCircle.className = "letter-circle"; // Mantenemos la clase por compatibilidad
    numberCircle.textContent = stop.number;

    // Crear elemento para la dirección
    const addressText = document.createElement("div");
    addressText.className = "address-text";

    // Añadir etiqueta (INICIO/PARADA/DESTINO FINAL)
    let label = "PARADA";
    if (stop.isStart) {
      label = "INICIO";
    } else if (stop.isEnd) {
      label = "DESTINO FINAL";
    }

    addressText.innerHTML = `<div class="stop-label">${label}</div>
                            <div class="stop-address">${stop.address}</div>`;

    // Si no es el último elemento, añadir flecha
    if (index < orderedStops.length - 1) {
      const arrow = document.createElement("div");
      arrow.className = "stop-arrow";
      arrow.innerHTML = "↓";
      stopElement.appendChild(numberCircle);
      stopElement.appendChild(addressText);
      stopsContainer.appendChild(stopElement);
      stopsContainer.appendChild(arrow);
    } else {
      stopElement.appendChild(numberCircle);
      stopElement.appendChild(addressText);
      stopsContainer.appendChild(stopElement);
    }
  });

  routeStepsDiv.appendChild(stopsContainer);
}

// Función para importar desde Excel
function setupExcelImport() {
  const importContainer = document.createElement("div");
  importContainer.className = "import-container";
  importContainer.innerHTML = `
    <div class="import-section">
      <label for="excel-import">Importar direcciones desde Excel:</label>
      <input type="file" id="excel-import" accept=".xlsx, .xls, .csv" />
      <p class="import-help">El archivo debe tener columnas: "Inicio", "Parada" por cada parada y "Destino"</p>
    </div>
  `;

  // Insertar antes del contenedor de waypoints
  const waypointsLabel = document.querySelector('label[for="waypoints"]');
  waypointsLabel.parentNode.insertBefore(importContainer, waypointsLabel);

  // Agregar evento al input file
  document
    .getElementById("excel-import")
    .addEventListener("change", handleExcelImport);
}

// Función para procesar el archivo Excel/CSV
async function handleExcelImport(event) {
  const file = event.target.files[0];
  if (!file) return;

  try {
    // Determinar tipo de archivo
    if (file.name.endsWith(".csv")) {
      await processCSV(file);
    } else if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
      await processExcel(file);
    } else {
      Swal.fire({
        icon: error,
        title: "Archivo no soportado",
        text: "Formato de archivo no soportado. Por favor usa Excel (xlsx, .xls) o CSV (.csv)",
        confirmButtonColor: "#007bff",
      });
    }
  } catch (error) {
    console.error("Error al procesar el archivo:", error);
    Swal.fire({
      icon: error,
      title: "Error al procesar",
      text: "Error al procesar el archivo. Verificá el formato.",
      confirmButtonColor: "#007bff",
    });
  }
}

// Procesar archivo CSV
async function processCSV(file) {
  const reader = new FileReader();

  reader.onload = function (e) {
    const text = e.target.result;
    const rows = text.split("\n");
    const headers = rows[0].split(",").map((h) => h.trim().toLowerCase());

    // Buscar índices de columnas
    const startIndex = headers.indexOf("inicio");
    const destinationIndex = headers.indexOf("destino");

    if (startIndex === -1 || destinationIndex === -1) {
      Swal.fire({
        icon: error,
        title: "Faltan columnas",
        text: "El CSV debe contener columnas 'Inicio' y 'Destino'",
        confirmButtonColor: "#007bff",
      });
      return;
    }

    // Extraer direcciones de inicio y destino
    document.getElementById("start").value = rows[1]
      .split(",")
      [startIndex].trim();
    document.getElementById("end").value = rows[1]
      .split(",")
      [destinationIndex].trim();

    // Limpiar puntos intermedios existentes
    document.getElementById("waypoints-container").innerHTML = "";

    // Añadir paradas intermedias (cualquier columna que contenga "parada" o sea una columna numérica)
    for (let i = 1; i < rows.length; i++) {
      if (!rows[i].trim()) continue; // Saltar filas vacías

      const columns = rows[i].split(",");

      // Buscar en todas las columnas por si tienen paradas
      for (let j = 0; j < headers.length; j++) {
        if (
          j !== startIndex &&
          j !== destinationIndex &&
          (headers[j].includes("parada") || !isNaN(parseInt(headers[j])))
        ) {
          const address = columns[j].trim();
          if (address) {
            addWaypointWithValue(address);
          }
        }
      }
    }

    Swal.fire({
      icon: "success",
      title: "Direcciones importadas exitosamente",
      html: `
        <strong>Inicio:</strong> ${document.getElementById("start").value}<br>
        <strong>${
          document.querySelectorAll(".waypoint").length
        }</strong> paradas intermedia/s<br>
        <strong>Destino:</strong> ${document.getElementById("end").value}
      `,
      confirmButtonColor: "#007bff",
    });
  };

  reader.readAsText(file);
}

// Procesar archivo Excel
async function processExcel(file) {
  // Cargar la librería SheetJS desde CDN si no está disponible
  if (typeof XLSX === "undefined") {
    await loadScript(
      "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"
    );
  }

  const reader = new FileReader();

  reader.onload = function (e) {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: "array" });

    // Tomar la primera hoja
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Convertir a JSON
    const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    if (jsonData.length < 2) {
      Swal.fire({
        icon: error,
        title: "Archivo Excel vacío",
        text: `El archivo Excel está vacío o tiene un formato inválido`,
        confirmButtonColor: "#007bff",
      });
      return;
    }

    const headers = jsonData[0].map((h) => String(h).toLowerCase());

    // Buscar columnas
    const startIndex = headers.findIndex((h) => h.includes("inicio"));
    const destinationIndex = headers.findIndex((h) => h.includes("destino"));

    if (startIndex === -1 || destinationIndex === -1) {
      Swal.fire({
        icon: error,
        title: "Faltan columnas",
        text: "El Excel debe contener columnas 'Inicio' y 'Destino'",
        confirmButtonColor: "#007bff",
      });
      return;
    }

    // Extraer direcciones de inicio y destino
    document.getElementById("start").value = jsonData[1][startIndex] || "";
    document.getElementById("end").value = jsonData[1][destinationIndex] || "";

    // Limpiar puntos intermedios existentes
    document.getElementById("waypoints-container").innerHTML = "";

    // Añadir paradas intermedias
    // Todas las columnas que contengan "parada" o sean numéricas
    const waypointColumns = headers
      .map((h, index) => {
        if (
          index !== startIndex &&
          index !== destinationIndex &&
          (String(h).includes("parada") || !isNaN(parseInt(h)))
        ) {
          return index;
        }
        return -1;
      })
      .filter((idx) => idx !== -1);

    // Para cada fila de datos
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (!row || row.length === 0) continue;

      waypointColumns.forEach((colIdx) => {
        if (row[colIdx]) {
          addWaypointWithValue(row[colIdx]);
        }
      });
    }

    Swal.fire({
      icon: "success",
      title: "Direcciones importadas exitosamente",
      html: `
        <strong>Inicio:</strong> ${document.getElementById("start").value}<br>
        <strong>${
          document.querySelectorAll(".waypoint").length
        }</strong> paradas intermedia/s<br>
        <strong>Destino:</strong> ${document.getElementById("end").value}
      `,
      confirmButtonColor: "#007bff",
    });
  };

  reader.readAsArrayBuffer(file);
}

// Función para agregar un waypoint con un valor
function addWaypointWithValue(value) {
  const container = document.getElementById("waypoints-container");

  const div = document.createElement("div");
  div.className = "waypoint-row";

  const input = document.createElement("input");
  input.type = "text";
  input.className = "waypoint";
  input.placeholder = "Dirección intermedia";
  input.value = value;

  const removeBtn = document.createElement("button");
  removeBtn.textContent = "➖";
  removeBtn.onclick = () => container.removeChild(div);

  div.appendChild(input);
  div.appendChild(removeBtn);
  container.appendChild(div);

  new google.maps.places.Autocomplete(input, options);
}

// Cargar script dinámicamente
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}
