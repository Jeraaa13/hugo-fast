let map;
let directionsService;
let directionsRenderer;
let currentLocationMarker;
let watchId;
let directionArrows = [];
let routeMarkers = [];
let currentOrderedStops = [];

const tollPoints = [
  { lat: -34.7188, lng: -58.2669, name: "Peaje Dock Sud" },
  { lat: -34.8502, lng: -58.0047, name: "Peaje Hudson" },
];

function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: -34.6037, lng: -58.3816 },
    zoom: 12,
  });

  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer({
    map: map,
    suppressMarkers: false,
  });

  setupExcelImport();

  initAutocomplete();
}

function initAutocomplete() {
  const inputs = document.querySelectorAll(".address-input");

  const buenosAiresBounds = new google.maps.LatLngBounds(
    new google.maps.LatLng(-40.5, -63.0),
    new google.maps.LatLng(-33.0, -56.0)
  );
  const options = {
    bounds: buenosAiresBounds,
    strictBounds: true,
    types: ["geocode"],
    componentRestrictions: { country: "ar" },
  };

  inputs.forEach((input) => {
    new google.maps.places.Autocomplete(input, options);
  });

  addWaypoint();
}

function calculateRoute() {
  const start = document.getElementById("start").value.trim();
  const end = document.getElementById("end").value.trim();
  const waypointInputs = document.querySelectorAll(".waypoint-container input");
  const rawWaypoints = Array.from(waypointInputs)
    .map((input) => input.value.trim())
    .filter((dir) => dir !== "");

  const avoidHighways = document.getElementById("avoidHighways").checked;
  const avoidTolls = document.getElementById("avoidTolls").checked;

  if (!start || !end) {
    Swal.fire(
      "Error",
      "Debes ingresar dirección de inicio y destino.",
      "error"
    );
    return;
  }

  if (rawWaypoints.length <= 23) {
    Swal.fire({
      title: "Calculando ruta...",
      html: "Esto puede tomar unos momentos",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    // ✅ RUTA SIMPLE
    const request = {
      origin: start,
      destination: end,
      waypoints: rawWaypoints.map((address) => ({
        location: address,
        stopover: true,
      })),
      travelMode: google.maps.TravelMode.DRIVING,
      optimizeWaypoints: true,
      avoidHighways: avoidHighways,
      avoidTolls: avoidTolls,
    };

    directionsService.route(request, (result, status) => {
      Swal.close();
      if (status === "OK") {
        clearMarkers();
        clearDirectionalArrows();

        directionsRenderer.setMap(null);
        directionsRenderer = new google.maps.DirectionsRenderer({
          map: map,
          suppressMarkers: true,
          polylineOptions: {
            strokeColor: "#3498db",
            strokeWeight: 6,
            strokeOpacity: 1,
          },
        });

        try {
          enhanceRouteDisplay(result);
        } catch (e) {
          console.error("Error al establecer direcciones:", e);
          drawManualPolyline(result);
          try {
            addDirectionalArrows(result);
          } catch (arrowError) {
            console.error(
              "No se pudieron añadir flechas direccionales:",
              arrowError
            );
          }
        }

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
          }
        });

        let totalDistance = 0;
        let totalDuration = 0;
        const routeLegs = result.routes[0].legs;

        routeLegs.forEach((leg) => {
          totalDistance += leg.distance.value;
          totalDuration += leg.duration.value;
        });

        const hasTolls = result.routes[0].warnings.some((warning) =>
          warning.toLowerCase().includes("toll")
        );

        const warnings = result.routes[0].warnings;
        if (warnings.length > 0) {
          const tolls = warnings.filter((w) =>
            w.toLowerCase().includes("toll")
          );
        }

        if (!avoidTolls && hasTolls) {
          Swal.fire({
            icon: "warning",
            title: "Ruta con peajes",
            text: "⚠️ Esta ruta incluye peajes. Revisá el recorrido para estimar el costo.",
            confirmButtonColor: "#007bff",
          });
        }

        displayRouteSequence(result, start, end, rawWaypoints);

        addSequenceMarkersForFullRoute(result);

        const totalDistanceKm = (totalDistance / 1000).toFixed(2);

        const totalDurationMinutes = Math.floor(totalDuration / 60);
        const hours = Math.floor(totalDurationMinutes / 60);
        const minutes = totalDurationMinutes % 60;

        document.getElementById(
          "distance"
        ).textContent = `${totalDistanceKm} km`;
        document.getElementById(
          "duration"
        ).textContent = `${hours}h ${minutes}m`;

        document.getElementById("exportExcelBtn").style.display = "block";
        document.getElementById("secuencia-title").style.display = "block";
        document.getElementById("secuencia").style.display = "block";
        const infoItems = document.getElementsByClassName("info-item");
        Array.from(infoItems).forEach((item) => {
          item.style.display = "block";
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error al calcular",
          text: "No se pudo calcular la ruta: " + status,
          confirmButtonColor: "#007bff",
        });
      }
    });
  } else {
    // 🚧 RUTA CON CHUNKS
    calculateFullRoute(start, rawWaypoints, end, avoidHighways, avoidTolls);
  }
}

function addWaypoint() {
  const container = document.getElementById("waypoints-container");

  const wrapper = document.createElement("div");
  wrapper.className = "waypoint-wrapper";

  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Parada intermedia";
  input.classList.add("waypoint-input", "address-input");

  const deleteButton = document.createElement("button");
  deleteButton.innerHTML = "🗑️";
  deleteButton.className = "delete-waypoint";
  deleteButton.onclick = () => container.removeChild(wrapper);

  wrapper.appendChild(input);
  wrapper.appendChild(deleteButton);

  container.appendChild(wrapper);

  new google.maps.places.Autocomplete(input, {
    types: ["geocode"],
    componentRestrictions: { country: "ar" },
  });
}

//#region Manejo de rutas grandes

function splitRouteIntoChunks(start, waypoints, end, maxPoints = 25) {
  const chunks = [];
  const maxWaypoints = maxPoints - 2;

  let i = 0;
  let currentStart = start;

  while (i < waypoints.length) {
    const chunkWaypoints = waypoints.slice(i, i + maxWaypoints);
    const isLastChunk = i + maxWaypoints >= waypoints.length;
    const chunkEnd = isLastChunk ? end : waypoints[i + maxWaypoints];

    chunks.push({
      start: currentStart,
      waypoints: chunkWaypoints.map((wp) => ({ location: wp, stopover: true })),
      end: chunkEnd,
    });

    // Preparo el start del siguiente chunk
    currentStart = chunkEnd;
    i += maxWaypoints;
  }

  return chunks;
}

async function calculateFullRoute(
  start,
  waypoints,
  end,
  avoidHighways,
  avoidTolls
) {
  const chunks = splitRouteIntoChunks(start, waypoints, end);

  let combinedResults = {
    routes: [
      {
        legs: [],
        overview_path: [],
        warnings: [],
        waypoint_order: [],
      },
    ],
  };

  for (let i = 0; i < chunks.length; i++) {
    const { start, waypoints, end } = chunks[i];

    const result = await requestRoute(
      start,
      waypoints,
      end,
      avoidHighways,
      avoidTolls
    );

    if (result.status === "OK") {
      if (i == 0) {
        combinedResults.routes[0].legs = result.routes[0].legs;
        combinedResults.routes[0].overview_path =
          result.routes[0].overview_path;
        combinedResults.routes[0].warnings = result.routes[0].warnings;
        combinedResults.routes[0].waypoint_order =
          result.routes[0].waypoint_order;
      } else {
        for (let i = 1; i < result.routes[0].legs.length; i++) {
          combinedResults.routes[0].legs.push(result.routes[0].legs[i]);
        }

        result.routes[0].overview_path.forEach((point) => {
          combinedResults.routes[0].overview_path.push(point);
        });

        result.routes[0].warnings.forEach((warning) => {
          if (!combinedResults.routes[0].warnings.includes(warning)) {
            combinedResults.routes[0].warnings.push(warning);
          }
        });

        combinedResults.routes[0].waypoint_order =
          result.routes[0].waypoint_order;
      }
    } else {
      console.error("Error en la parte", i + 1, result);
      Swal.fire({
        icon: "error",
        title: `Error en el tramo ${i + 1}`,
        text: result.status,
      });
      return;
    }
  }

  console.log(combinedResults);
  displayCombinedRoute(combinedResults);

  document.getElementById("secuencia-title").style.display = "block";
  document.getElementById("exportExcelBtn").style.display = "block";
  document.getElementById("secuencia").style.display = "block";

  const infoItems = document.getElementsByClassName("info-item");
  Array.from(infoItems).forEach((item) => {
    item.style.display = "block";
  });
}

function requestRoute(start, waypoints, end, avoidHighways, avoidTolls) {
  return new Promise((resolve) => {
    directionsService.route(
      {
        origin: start,
        destination: end,
        waypoints: waypoints,
        travelMode: google.maps.TravelMode.DRIVING,
        optimizeWaypoints: true,
        avoidHighways: avoidHighways,
        avoidTolls: avoidTolls,
      },
      (result, status) => {
        resolve({ routes: result?.routes || [], status });
      }
    );
  });
}

//#endregion

//#region Dibujado
function displayCombinedRoute(combinedResults) {
  if (
    !combinedResults.routes ||
    !combinedResults.routes[0] ||
    !combinedResults.routes[0].legs ||
    combinedResults.routes[0].legs.length === 0
  ) {
    Swal.fire({
      icon: "warning",
      title: "Problema con la ruta",
      text: "Se encontraron los puntos pero no se pudo trazar una ruta completa entre ellos",
      confirmButtonColor: "#007bff",
    });
    return;
  }

  console.log(combinedResults);

  clearMarkers();

  clearDirectionalArrows();

  if (!combinedResults.request) {
    combinedResults.request = {
      travelMode: google.maps.TravelMode.DRIVING,
      origin: combinedResults.routes[0].legs[0].start_location,
      destination:
        combinedResults.routes[0].legs[
          combinedResults.routes[0].legs.length - 1
        ].end_location,
    };
  }

  directionsRenderer.setMap(null);
  directionsRenderer = new google.maps.DirectionsRenderer({
    map: map,
    suppressMarkers: true,
    polylineOptions: {
      strokeColor: "#3498db",
      strokeWeight: 6,
      strokeOpacity: 1,
    },
  });

  try {
    console.log("Enhancing route display...");
    enhanceRouteDisplay(combinedResults);
    console.log("Enhance done.");
  } catch (e) {
    console.error("Error al establecer direcciones:", e);
    drawManualPolyline(combinedResults);
    try {
      addDirectionalArrows(combinedResults);
    } catch (arrowError) {
      console.error("No se pudieron añadir flechas direccionales:", arrowError);
    }
  }

  directionsRenderer.setMap(map);

  setTimeout(() => {
    try {
      console.log("Setting directions...");
      directionsRenderer.setDirections(combinedResults);

      directionsRenderer.setOptions({
        polylineOptions: {
          visible: false,
        },
      });
      console.log("Directions set OK.");
    } catch (e) {
      console.error("Error setting directions:", e);
      drawManualPolyline(combinedResults);
    }
  }, 100);

  const hasTolls = combinedResults.routes[0].warnings.some((warning) =>
    warning.toLowerCase().includes("toll")
  );

  let totalDistance = 0;
  let totalDuration = 0;
  combinedResults.routes[0].legs.forEach((leg) => {
    totalDistance += leg.distance.value;
    totalDuration += leg.duration.value;
  });

  const km = (totalDistance / 1000).toFixed(1);
  const mins = Math.round(totalDuration / 60);

  document.getElementById("distance").textContent = `${km} km`;
  document.getElementById("duration").textContent = `${mins} minutos`;

  checkTollPointsOnRoute(combinedResults);

  displayFullRouteSequence(combinedResults);

  addSequenceMarkersForFullRoute(combinedResults);

  if (hasTolls && !document.getElementById("avoidTolls").checked) {
    Swal.fire({
      icon: "warning",
      title: "Ruta con peajes",
      text: "⚠️ Esta ruta incluye peajes. Revisá el recorrido para estimar el costo.",
      confirmButtonColor: "#007bff",
    });
  }
}

function clearMarkers() {
  routeMarkers.forEach((marker) => marker.setMap(null));
  routeMarkers = [];
}

function clearDirectionalArrows() {
  for (let arrow of directionArrows) {
    arrow.setMap(null);
  }
  directionArrows = [];
}

function enhanceRouteDisplay(results) {
  // Limpiamos las polylines anteriores
  if (window.routePolyline) {
    window.routePolyline.setMap(null);
  }

  if (window.routeOutline) {
    window.routeOutline.setMap(null);
  }

  if (window.finalSegmentPolyline) {
    window.finalSegmentPolyline.setMap(null);
  }

  if (window.finalSegmentOutline) {
    window.finalSegmentOutline.setMap(null);
  }

  if (window.turnMarkers) {
    window.turnMarkers.forEach((marker) => marker.setMap(null));
  }
  window.turnMarkers = [];

  const path = results.routes[0].overview_path;

  // Solo identificamos el último tramo correctamente
  let mainPathPoints = [];
  let finalSegmentPoints = [];

  // Identificar correctamente el último tramo
  if (results.routes[0].legs && results.routes[0].legs.length > 1) {
    // Identificamos la posición del último punto intermedio (penúltima parada)
    const legs = results.routes[0].legs;
    const penultimateStopLeg = legs[legs.length - 2];
    const penultimateStopPosition = penultimateStopLeg.end_location;
    const finalStopPosition = legs[legs.length - 1].end_location;

    // Encontramos el punto en el path que está más cerca de la penúltima parada
    let closestPointIndex = 0;
    let closestDistance = Infinity;

    for (let i = 0; i < path.length; i++) {
      const distance = google.maps.geometry.spherical.computeDistanceBetween(
        path[i],
        penultimateStopPosition
      );

      if (distance < closestDistance) {
        closestDistance = distance;
        closestPointIndex = i;
      }
    }

    // Dividimos el path en dos partes: ruta principal y último tramo
    mainPathPoints = path.slice(0, closestPointIndex + 1);
    finalSegmentPoints = path.slice(closestPointIndex);

    console.log(
      `Dividiendo la ruta en punto ${closestPointIndex} de ${path.length} puntos totales`
    );
    console.log(`Distancia a penúltima parada: ${closestDistance} metros`);
  } else {
    // Si solo hay un tramo, usamos todo el path para la ruta principal
    mainPathPoints = path;
    finalSegmentPoints = [];

    console.log(
      "Solo hay un tramo en la ruta, no se dibujará segmento final distinto"
    );
  }

  // Dibujamos la ruta principal en azul
  window.routeOutline = new google.maps.Polyline({
    path: mainPathPoints,
    strokeColor: "#000000",
    strokeWeight: 10,
    strokeOpacity: 0.8,
    map: map,
    zIndex: 1,
  });

  window.routePolyline = new google.maps.Polyline({
    path: mainPathPoints,
    strokeColor: "#0047AB", // Azul para la ruta principal
    strokeWeight: 6,
    strokeOpacity: 1,
    map: map,
    zIndex: 2,
  });

  // Solo dibujamos el último tramo en rojo si existe
  if (finalSegmentPoints.length > 0) {
    window.finalSegmentOutline = new google.maps.Polyline({
      path: finalSegmentPoints,
      strokeColor: "#000000",
      strokeWeight: 10,
      strokeOpacity: 0.8,
      map: map,
      zIndex: 3,
    });

    window.finalSegmentPolyline = new google.maps.Polyline({
      path: finalSegmentPoints,
      strokeColor: "#0047AB", // Rojo para el último tramo
      strokeWeight: 6,
      strokeOpacity: 1,
      map: map,
      zIndex: 4,
    });
  }

  // Agregamos flechas direccionales
  addDirectionalArrows(results);

  // Actualizamos las flechas cuando cambia el zoom
  map.addListener("zoom_changed", function () {
    setTimeout(function () {
      clearDirectionalArrows();
      addDirectionalArrows(results);
    }, 100);
  });

  // Creamos la leyenda
  const routeLegendDiv = document.createElement("div");
  routeLegendDiv.className = "route-legend";
  routeLegendDiv.innerHTML = `
    <div class="legend-item">
      <div class="legend-color" style="background-color: #0047AB;"></div>
      <div class="legend-text">Ruta principal</div>
    </div>

  `;

  // Removemos la leyenda anterior si existe
  const existingLegend = document.querySelector(".route-legend");
  if (existingLegend) {
    existingLegend.remove();
  }

  document.getElementById("map").appendChild(routeLegendDiv);
}

function drawManualPolyline(results) {
  if (results.routes && results.routes[0] && results.routes[0].overview_path) {
    const path = results.routes[0].overview_path;

    const polylineOutline = new google.maps.Polyline({
      path: path,
      strokeColor: "#000000",
      strokeWeight: 10,
      strokeOpacity: 0.8,
      map: map,
      zIndex: 1,
    });

    const polyline = new google.maps.Polyline({
      path: path,
      strokeColor: "#3498db",
      strokeWeight: 6,
      strokeOpacity: 1,
      map: map,
      zIndex: 2,
    });

    try {
      addDirectionalArrows(results);
    } catch (arrowError) {
      console.error(
        "No se pudieron añadir flechas direccionales en modo fallback:",
        arrowError
      );
    }
  } else {
    console.error("Cannot draw polyline: Invalid path data");
    Swal.fire({
      icon: "error",
      title: "Error al dibujar la ruta",
      text: "Se encontraron los puntos pero no se pudo dibujar el trazado entre ellos",
      confirmButtonColor: "#007bff",
    });
  }
}

function addDirectionalArrows(route) {
  clearDirectionalArrows();

  if (!route.routes || !route.routes[0] || !route.routes[0].overview_path) {
    console.error("No hay ruta disponible para agregar flechas direccionales");
    return;
  }

  const path = route.routes[0].overview_path;

  const zoom = map.getZoom();
  const arrowSpacing = getArrowSpacing(zoom);
  const tighterSpacing = arrowSpacing;

  let distance = 0;
  let lastArrowPosition = null;

  for (let i = 0; i < path.length - 1; i++) {
    const startPoint = path[i];
    const endPoint = path[i + 1];

    const segmentDistance =
      google.maps.geometry.spherical.computeDistanceBetween(
        startPoint,
        endPoint
      );

    const isSignificantTurn =
      i > 0 && isSharpTurn(path[i - 1], startPoint, endPoint);

    const currentSpacing = isSignificantTurn ? tighterSpacing : arrowSpacing;

    let segmentProgress = 0;

    if (
      i === 0 ||
      (lastArrowPosition &&
        google.maps.geometry.spherical.computeDistanceBetween(
          lastArrowPosition,
          startPoint
        ) > currentSpacing)
    ) {
      createArrowMarker(startPoint, path[i + 1], isSignificantTurn);
      lastArrowPosition = startPoint;
    }

    while (segmentProgress + currentSpacing < segmentDistance) {
      segmentProgress += currentSpacing;

      const fraction = segmentProgress / segmentDistance;
      const position = new google.maps.LatLng(
        startPoint.lat() + fraction * (endPoint.lat() - startPoint.lat()),
        startPoint.lng() + fraction * (endPoint.lng() - startPoint.lng())
      );

      createArrowMarker(position, endPoint, isSignificantTurn);
      lastArrowPosition = position;
    }
  }
}

function clearDirectionalArrows() {
  for (let arrow of directionArrows) {
    arrow.setMap(null);
  }
  directionArrows = [];
}

function getArrowSpacing(zoom) {
  if (zoom >= 17) return 75;
  if (zoom >= 15) return 150;
  if (zoom >= 13) return 300;
  if (zoom >= 11) return 600;
  return 1000;
}

function isSharpTurn() {
  return false;
}

function checkTollPointsOnRoute(results) {
  tollPoints.forEach((toll) => {
    const tollPosition = new google.maps.LatLng(toll.lat, toll.lng);

    const isOnRoute = results.routes[0].overview_path.some((pathPoint) => {
      const point = new google.maps.LatLng(pathPoint.lat(), pathPoint.lng());
      return (
        google.maps.geometry.spherical.computeDistanceBetween(
          tollPosition,
          point
        ) < 500
      );
    });

    if (isOnRoute) {
      const tollMarker = new google.maps.Marker({
        position: tollPosition,
        map: map,
        title: toll.name,
        icon: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
      });

      routeMarkers.push(tollMarker);

      document.getElementById(
        "summary"
      ).innerHTML += `<br>🚧 Vas a pasar por el peaje <strong>${toll.name}</strong>`;
    }
  });
}

function displayFullRouteSequence(results) {
  const start = document.getElementById("start").value;
  const end = document.getElementById("end").value;
  const waypointInputs = document.getElementsByClassName("waypoint");

  let allStopsInfo = [];

  allStopsInfo.push({
    number: 1,
    address: start,
    position: results.routes[0].legs[0].start_location,
    isStart: true,
  });

  let stopNumber = 2;
  for (let i = 0; i < results.routes[0].legs.length - 1; i++) {
    allStopsInfo.push({
      number: stopNumber++,
      address: results.routes[0].legs[i].end_address,
      position: results.routes[0].legs[i].end_location,
    });
  }

  allStopsInfo.push({
    number: stopNumber,
    address: end,
    position:
      results.routes[0].legs[results.routes[0].legs.length - 1].end_location,
    isEnd: true,
  });

  let routeStepsDiv = document.getElementById("secuencia");

  routeStepsDiv.innerHTML = `<h2>SECUENCIA DE PARADAS (${allStopsInfo.length})</h2>`;

  const stopsContainer = document.createElement("div");
  stopsContainer.className = "stops-container";

  allStopsInfo.forEach((stop, index) => {
    const stopElement = document.createElement("div");
    stopElement.className = "stop-item";

    if (stop.isStart) {
      stopElement.classList.add("start-stop");
    } else if (stop.isEnd) {
      stopElement.classList.add("end-stop");
    }

    const numberCircle = document.createElement("div");
    numberCircle.className = "letter-circle";
    numberCircle.textContent = stop.number;

    const addressText = document.createElement("div");
    addressText.className = "address-text";

    let label = "PARADA";
    if (stop.isStart) {
      label = "INICIO";
    } else if (stop.isEnd) {
      label = "DESTINO FINAL";
    }

    addressText.innerHTML = `<div class="stop-label">${label}</div>
                            <div class="stop-address">${stop.address}</div>`;

    if (index < allStopsInfo.length - 1) {
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

  currentOrderedStops = allStopsInfo;
  routeStepsDiv.appendChild(stopsContainer);
}

function addSequenceMarkersForFullRoute(results) {
  clearMarkers();

  const clusters = detectClusteredStops(results);

  const legs = results.routes[0].legs;
  let stopNumber = 1;

  const clustersOverlay = document.createElement("div");
  clustersOverlay.id = "clusters-overlay";
  clustersOverlay.style.position = "absolute";
  clustersOverlay.style.zIndex = "1000";
  document.getElementById("map").appendChild(clustersOverlay);

  const startMarker = new google.maps.Marker({
    position: legs[0].start_location,
    map: map,
    label: {
      text: stopNumber.toString(),
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

  const startCluster = clusters.find((cluster) =>
    cluster.some((stop) => stop.number === 1)
  );

  if (startCluster) {
    const clusterStops = startCluster
      .map((stop) => `Parada ${stop.number}: ${stop.address}`)
      .join("<br>");

    const infoWindow = new google.maps.InfoWindow({
      content: `<div class="cluster-info">
                  <h3>📍 ${startCluster.length} paradas cercanas</h3>
                  <div>${clusterStops}</div>
                </div>`,
    });

    startMarker.addListener("mouseover", () => {
      infoWindow.open(map, startMarker);
    });

    startMarker.addListener("mouseout", () => {
      infoWindow.close();
    });
  }

  routeMarkers.push(startMarker);
  stopNumber++;

  for (let i = 0; i < legs.length - 1; i++) {
    const waypointMarker = new google.maps.Marker({
      position: legs[i].end_location,
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

    const waypointCluster = clusters.find((cluster) =>
      cluster.some((stop) => stop.number === stopNumber)
    );

    if (waypointCluster) {
      const clusterStops = waypointCluster
        .map((stop) => `Parada ${stop.number}: ${stop.address}`)
        .join("<br>");

      const infoWindow = new google.maps.InfoWindow({
        content: `<div class="cluster-info">
                    <h3>📍 ${waypointCluster.length} paradas cercanas</h3>
                    <div>${clusterStops}</div>
                  </div>`,
      });

      waypointMarker.addListener("mouseover", () => {
        infoWindow.open(map, waypointMarker);
      });

      waypointMarker.addListener("mouseout", () => {
        infoWindow.close();
      });
    }

    routeMarkers.push(waypointMarker);
    stopNumber++;
  }

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

  const destCluster = clusters.find((cluster) =>
    cluster.some((stop) => stop.number === stopNumber)
  );

  if (destCluster) {
    const clusterStops = destCluster
      .map((stop) => `Parada ${stop.number}: ${stop.address}`)
      .join("<br>");

    const infoWindow = new google.maps.InfoWindow({
      content: `<div class="cluster-info">
                  <h3>📍 ${destCluster.length} paradas cercanas</h3>
                  <div>${clusterStops}</div>
                </div>`,
    });

    if (destCluster.length > 2) {
      const clusterIcon = new google.maps.Marker({
        position: legs[legs.length - 1].end_location,
        map: map,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: "#FFA500",
          fillOpacity: 0.4,
          strokeColor: "#FF8C00",
          strokeWeight: 1,
          scale: 20 + destCluster.length * 2,
        },
        zIndex: 1,
      });
      routeMarkers.push(clusterIcon);
    }

    destinationMarker.addListener("mouseover", () => {
      infoWindow.open(map, destinationMarker);
    });

    destinationMarker.addListener("mouseout", () => {
      infoWindow.close();
    });
  }

  routeMarkers.push(destinationMarker);

  if (clusters.length > 0) {
    document.getElementById("zones").textContent = `${clusters.length}`;
  }

  if (clusters.length > 0) {
    const legendDiv = document.createElement("div");

    document.getElementById("map").appendChild(legendDiv);
  }

  if (
    legs[0].start_location.equals(legs[legs.length - 1].end_location) ||
    google.maps.geometry.spherical.computeDistanceBetween(
      legs[0].start_location,
      legs[legs.length - 1].end_location
    ) < 50
  ) {
    const offsetPosition = new google.maps.LatLng(
      legs[legs.length - 1].end_location.lat() + 0.0005,
      legs[legs.length - 1].end_location.lng() + 0.0005
    );
    destinationMarker.setPosition(offsetPosition);
  }
}

function detectClusteredStops(results) {
  const clusters = [];
  const clusterThreshold = 20;
  const legs = results.routes[0].legs;

  const stopPositions = [];

  stopPositions.push({
    index: 0,
    position: legs[0].start_location,
    address: legs[0].start_address,
    number: 1,
  });

  for (let i = 0; i < legs.length - 1; i++) {
    stopPositions.push({
      index: i + 1,
      position: legs[i].end_location,
      address: legs[i].end_address,
      number: i + 2,
    });
  }

  stopPositions.push({
    index: legs.length,
    position: legs[legs.length - 1].end_location,
    address: legs[legs.length - 1].end_address,
    number: legs.length + 1,
  });

  for (let i = 0; i < stopPositions.length; i++) {
    const currentPosition = stopPositions[i].position;
    const cluster = [stopPositions[i]];

    for (let j = 0; j < stopPositions.length; j++) {
      if (i !== j) {
        const distance = google.maps.geometry.spherical.computeDistanceBetween(
          currentPosition,
          stopPositions[j].position
        );

        if (distance < clusterThreshold) {
          cluster.push(stopPositions[j]);
        }
      }
    }

    if (cluster.length > 1) {
      const isNew = !clusters.some((existingCluster) =>
        existingCluster.some((stop) => stop.index === stopPositions[i].index)
      );

      if (isNew) {
        clusters.push(cluster);
      }
    }
  }

  return clusters;
}

function createArrowMarker(position, nextPoint, isSignificantTurn) {
  const heading = google.maps.geometry.spherical.computeHeading(
    position,
    nextPoint
  );

  const arrowScale = 3;

  const arrow = new google.maps.Marker({
    position: position,
    map: map,
    icon: {
      path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
      scale: arrowScale,
      fillColor: "#FFFFFF",
      fillOpacity: 0.9,
      strokeColor: "#000000",
      strokeWeight: 1,
      rotation: heading,
    },
    zIndex: 100,
  });

  directionArrows.push(arrow);
}

function displayRouteSequence(response, start, end, waypoints) {
  let routeStepsDiv = document.getElementById("secuencia");

  routeStepsDiv.innerHTML = `<h2>SECUENCIA DE PARADAS (${
    waypoints.length + 2
  })</h2>`;

  const waypointOrder = response.routes[0].waypoint_order;

  const orderedStops = [];

  orderedStops.push({
    number: 1,
    address: start,
    isStart: true,
  });

  console.log(waypoints);

  waypointOrder.forEach((index, i) => {
    const waypointAddress = waypoints[index];
    orderedStops.push({
      number: i + 2,
      address: waypointAddress,
    });
  });

  orderedStops.push({
    number: waypointOrder.length + 2,
    address: end,
    isEnd: true,
  });

  const stopsContainer = document.createElement("div");
  stopsContainer.className = "stops-container";

  orderedStops.forEach((stop, index) => {
    const stopElement = document.createElement("div");
    stopElement.className = "stop-item";

    if (stop.isStart) {
      stopElement.classList.add("start-stop");
    } else if (stop.isEnd) {
      stopElement.classList.add("end-stop");
    }

    const numberCircle = document.createElement("div");
    numberCircle.className = "letter-circle";
    numberCircle.textContent = stop.number;

    const addressText = document.createElement("div");
    addressText.className = "address-text";

    let label = "PARADA";
    if (stop.isStart) {
      label = "INICIO";
    } else if (stop.isEnd) {
      label = "DESTINO FINAL";
    }

    addressText.innerHTML = `<div class="stop-label">${label}</div>
                            <div class="stop-address">${stop.address}</div>`;

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

  currentOrderedStops = orderedStops;
  console.log(currentOrderedStops);
  routeStepsDiv.appendChild(stopsContainer);
}

//#endregion

//#region Importación y exportación de excels
function setupExcelImport() {
  document
    .getElementById("excel-import")
    .addEventListener("change", handleExcelImport);
}

async function handleExcelImport(event) {
  const file = event.target.files[0];
  if (!file) return;

  try {
    if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
      await processExcel(file);
    } else {
      Swal.fire({
        icon: "error",
        title: "Archivo no soportado",
        text: "Formato de archivo no soportado. Por favor usa Excel (xlsx, .xls)",
        confirmButtonColor: "#007bff",
      });
    }
  } catch (error) {
    console.error("Error al procesar el archivo:", error);
    Swal.fire({
      icon: "error",
      title: "Error al procesar",
      text: "Error al procesar el archivo. Verificá el formato.",
      confirmButtonColor: "#007bff",
    });
  }
}

function readExcelFile(file) {
  const reader = new FileReader();

  reader.onload = function (e) {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: "array" });

    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    if (jsonData.length < 2) {
      Swal.fire({
        icon: "error",
        title: "Archivo Excel vacío",
        text: `El archivo Excel está vacío o tiene un formato inválido`,
        confirmButtonColor: "#007bff",
      });
      return;
    }

    const headers = jsonData[0].map((h) => String(h).toLowerCase());

    const startIndex = headers.findIndex((h) => h.includes("inicio"));
    const destinationIndex = headers.findIndex((h) => h.includes("destino"));

    if (startIndex === -1 || destinationIndex === -1) {
      Swal.fire({
        icon: "error",
        title: "Faltan columnas",
        text: "El Excel debe contener columnas 'Inicio' y 'Destino'",
        confirmButtonColor: "#007bff",
      });
      return;
    }
    document.getElementById("start").value = jsonData[1][startIndex] || "";
    document.getElementById("end").value = jsonData[1][destinationIndex] || "";

    document.getElementById("waypoints-container").innerHTML = "";

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

    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (!row || row.length === 0) continue;

      waypointColumns.forEach((colIdx) => {
        if (row[colIdx]) {
          addWaypointWithValue(row[colIdx]);
        }
      });
    }

    const waypointCount = document.querySelectorAll(".waypoint-input").length;

    Swal.fire({
      icon: "success",
      title: "Direcciones importadas exitosamente",
      html: `
        <strong>Inicio:</strong> ${document.getElementById("start").value}<br>
        <strong>${waypointCount}</strong> paradas intermedia/s<br>
        <strong>Destino:</strong> ${document.getElementById("end").value}<br>
        ${
          waypointCount > 23
            ? "<strong>⚠️ Se utilizarán múltiples tramos para calcular esta ruta</strong>"
            : ""
        }
      `,
      confirmButtonColor: "#007bff",
    });
  };

  reader.readAsArrayBuffer(file);
}

function processExcel(file) {
  if (typeof XLSX === "undefined") {
    loadScript(
      "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"
    )
      .then(() => {
        readExcelFile(file);
      })
      .catch((error) => {
        console.error("Error al cargar la librería XLSX:", error);
        Swal.fire({
          icon: "error",
          title: "Error al procesar",
          text: "No se pudo cargar la librería para procesar Excel. Intentá de nuevo.",
          confirmButtonColor: "#007bff",
        });
      });
  } else {
    readExcelFile(file);
  }
}

function addWaypointWithValue(value) {
  const container = document.getElementById("waypoints-container");

  const div = document.createElement("div");
  div.className = "waypoint-wrapper";

  const input = document.createElement("input");
  input.type = "text";
  input.classList.add("waypoint-input", "address-input");
  input.placeholder = "Parada intermedia";
  input.value = value;

  const removeBtn = document.createElement("button");
  removeBtn.innerHTML = "🗑️";
  removeBtn.className = "delete-waypoint";
  removeBtn.type = "button";
  removeBtn.addEventListener("click", () => {
    div.remove();
  });

  div.appendChild(input);
  div.appendChild(removeBtn);
  container.appendChild(div);

  new google.maps.places.Autocomplete(input, {
    types: ["geocode"],
    componentRestrictions: { country: "ar" },
  });
}

document
  .getElementById("exportExcelBtn")
  .addEventListener("click", exportToExcel);

function exportToExcel() {
  if (!currentOrderedStops.length) {
    alert("Primero generá una ruta para exportar la secuencia.");
    return;
  }

  const worksheetData = [
    ["Secuencia de Paradas"],
    ["Número", "Dirección", "Tipo"],
  ];

  currentOrderedStops.forEach((stop) => {
    let tipo = "Parada";
    if (stop.isStart) tipo = "Inicio";
    else if (stop.isEnd) tipo = "Destino Final";

    worksheetData.push([stop.number, stop.address, tipo]);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Secuencia");

  XLSX.writeFile(workbook, "secuencia_ruta.xlsx");
}
//#endregion
