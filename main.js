let map;
let directionsService;
let directionsRenderer;
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
  directionsRenderer = new google.maps.DirectionsRenderer({ map: map });

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
    document.getElementById("summary").after(routeStepsDiv);
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
            alert("No se pudo detectar la dirección exacta.");
          }
        });
      },
      () => {
        alert("Error al obtener ubicación.");
      }
    );
  } else {
    alert("Tu navegador no soporta geolocalización.");
  }
}

function calculateRoute() {
  const start = document.getElementById("start").value;
  const end = document.getElementById("end").value;
  const waypointInputs = document.getElementsByClassName("waypoint");

  const avoidHighways = document.getElementById("avoidHighways").checked;
  const avoidTolls = document.getElementById("avoidTolls").checked;

  if (!start || !end) {
    alert("Por favor, completá la dirección de inicio y destino.");
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

      directionsRenderer.setDirections(result);

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
        alert(
          "⚠️ Esta ruta incluye peajes. Revisá el recorrido para estimar el costo."
        );
      }

      // Mostrar secuencia de ruta para el chofer
      displayRouteSequence(result, start, end, waypoints);
    } else {
      alert("No se pudo calcular la ruta: " + status);
    }
  });
}

// Nueva función para mostrar la secuencia ordenada de paradas
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
    letter: "A",
    address: start,
    isStart: true,
  });

  // Agregar waypoints en el orden optimizado
  waypointOrder.forEach((index, i) => {
    const waypointAddress = waypoints[index].location;
    orderedStops.push({
      letter: String.fromCharCode(66 + i), // B, C, D, etc.
      address: waypointAddress,
    });
  });

  // Agregar punto final
  orderedStops.push({
    letter: String.fromCharCode(66 + waypointOrder.length),
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

    // Crear círculo con letra
    const letterCircle = document.createElement("div");
    letterCircle.className = "letter-circle";
    letterCircle.textContent = stop.letter;

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
      stopElement.appendChild(letterCircle);
      stopElement.appendChild(addressText);
      stopsContainer.appendChild(stopElement);
      stopsContainer.appendChild(arrow);
    } else {
      stopElement.appendChild(letterCircle);
      stopElement.appendChild(addressText);
      stopsContainer.appendChild(stopElement);
    }
  });

  routeStepsDiv.appendChild(stopsContainer);
}

// Agregar función para importar desde Excel
function setupExcelImport() {
  const importContainer = document.createElement("div");
  importContainer.className = "import-container";
  importContainer.innerHTML = `
    <div class="import-section">
      <label for="excel-import">Importar direcciones desde Excel:</label>
      <input type="file" id="excel-import" accept=".xlsx, .xls, .csv" />
      <p class="import-help">El archivo debe tener columnas: "Inicio", "Parada" por cada parada  y "Destino"</p>
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
      alert(
        "Formato de archivo no soportado. Por favor usa Excel (.xlsx, .xls) o CSV (.csv)"
      );
    }
  } catch (error) {
    console.error("Error al procesar el archivo:", error);
    alert("Error al procesar el archivo. Verificá el formato.");
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
      alert('El CSV debe contener columnas "Inicio" y "Destino"');
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

    alert(
      `Direcciones importadas exitosamente:\n- Inicio: ${
        document.getElementById("start").value
      }\n- ${
        document.querySelectorAll(".waypoint").length
      } paradas intermedias\n- Destino: ${document.getElementById("end").value}`
    );
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
      alert("El archivo Excel está vacío o tiene un formato inválido");
      return;
    }

    const headers = jsonData[0].map((h) => String(h).toLowerCase());

    // Buscar columnas
    const startIndex = headers.findIndex((h) => h.includes("inicio"));
    const destinationIndex = headers.findIndex((h) => h.includes("destino"));

    if (startIndex === -1 || destinationIndex === -1) {
      alert('El Excel debe contener columnas "Inicio" y "Destino"');
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

    alert(
      `Direcciones importadas exitosamente:\n- Inicio: ${
        document.getElementById("start").value
      }\n- ${
        document.querySelectorAll(".waypoint").length
      } paradas intermedias\n- Destino: ${document.getElementById("end").value}`
    );
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

// Modificar la función initMap para incluir la configuración de importación
function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: -34.6037, lng: -58.3816 },
    zoom: 12,
  });

  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer({ map: map });

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
}
