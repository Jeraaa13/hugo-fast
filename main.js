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
    suppressMarkers: true, // Suppress original markers to use our own
    polylineOptions: {
      visible: false, // Hide the default polyline - we'll use our custom outlined one
    },
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

  // Set up Excel import
  setupExcelImport();

  // Add GPS tracking button
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
          icon: "error",
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
      icon: "warning",
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
              icon: "error",
              title: "Error de Direcciones",
              text: "No se pudo detectar la direccion exacta",
              confirmButtonColor: "#007bff",
            });
          }
        });
      },
      () => {
        Swal.fire({
          icon: "error",
          title: "Error de Ubicación",
          text: "Error al obtener ubicación.",
          confirmButtonColor: "#007bff",
        });
      }
    );
  } else {
    Swal.fire({
      icon: "error",
      title: "Error de Navegador",
      text: "Tu navegador no soporta geolocalización.",
      confirmButtonColor: "#007bff",
    });
  }
}

function calculateRoute() {
  if (!directionsService) {
    directionsService = new google.maps.DirectionsService();
  }
  const start = document.getElementById("start").value;
  const end = document.getElementById("end").value;
  const waypointInputs = document.getElementsByClassName("waypoint");

  const avoidHighways = document.getElementById("avoidHighways").checked;
  const avoidTolls = document.getElementById("avoidTolls").checked;

  if (!start || !end) {
    Swal.fire({
      icon: "warning",
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
          icon: "warning",
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
        icon: "error",
        title: "Error al calcular",
        text: "No se pudo calcular la ruta: " + status,
        confirmButtonColor: "#007bff",
      });
    }
  });
}

function calculateRouteInChunks() {
  if (!directionsService) {
    directionsService = new google.maps.DirectionsService();
  }
  const start = document.getElementById("start").value;
  const end = document.getElementById("end").value;
  const waypointInputs = document.getElementsByClassName("waypoint");

  const avoidHighways = document.getElementById("avoidHighways").checked;
  const avoidTolls = document.getElementById("avoidTolls").checked;

  if (!start || !end) {
    Swal.fire({
      icon: "warning",
      title: "Faltan direcciones",
      text: "Por favor complete las direcciones de inicio y destino",
      confirmButtonColor: "#007bff",
    });
    return;
  }

  // Recolectar todas las direcciones (incluyendo inicio y fin)
  let allAddresses = [start];

  Array.from(waypointInputs).forEach((input) => {
    const address = input.value.trim();
    if (address !== "") {
      allAddresses.push(address);
    }
  });

  allAddresses.push(end);

  // Si hay 25 o menos direcciones en total, usar la función original
  if (allAddresses.length <= 25) {
    calculateRoute();
    return;
  }

  // Mostrar mensaje de carga para rutas grandes
  Swal.fire({
    title: "Calculando ruta extensa",
    html: `Procesando ${allAddresses.length} direcciones en ${Math.ceil(
      (allAddresses.length - 1) / 23
    )} tramos...`,
    allowOutsideClick: false,
    allowEscapeKey: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });

  // Dividir en chunks de máximo 25 direcciones por solicitud
  const chunks = divideIntoChunks(allAddresses);

  // Almacenar los resultados combinados
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

  // Procesar cada chunk secuencialmente
  processChunks(chunks, 0, combinedResults, avoidHighways, avoidTolls);
}

function divideIntoChunks(addresses) {
  const chunks = [];
  const chunkSize = 12;

  for (let i = 0; i < addresses.length; i += chunkSize - 1) {
    const startIndex = i === 0 ? 0 : i - 1;
    const endIndex = Math.min(i + chunkSize - 1, addresses.length - 1);

    const chunk = addresses.slice(startIndex, endIndex + 1);

    if (chunk.length >= 2) {
      chunks.push(chunk);
    }
  }

  return chunks;
}

function processChunks(
  chunks,
  index,
  combinedResults,
  avoidHighways,
  avoidTolls
) {
  if (index >= chunks.length) {
    displayCombinedRoute(combinedResults);
    Swal.close();
    return;
  }

  const chunk = chunks[index];

  // Validar el chunk antes de procesarlo
  if (!chunk || chunk.length < 2) {
    console.warn(`Chunk ${index} inválido, se salta`);
    processChunks(
      chunks,
      index + 1,
      combinedResults,
      avoidHighways,
      avoidTolls
    );
    return;
  }

  const chunkStart = chunk[0];
  const chunkEnd = chunk[chunk.length - 1];

  if (!chunkStart || !chunkEnd) {
    console.warn(`Chunk ${index} sin inicio o fin válido, se salta`);
    processChunks(
      chunks,
      index + 1,
      combinedResults,
      avoidHighways,
      avoidTolls
    );
    return;
  }

  // Mostrar progreso actualizado
  Swal.update({
    html: `Procesando tramo ${index + 1} de ${chunks.length}...
           <br>De: ${truncateAddress(chunkStart)}
           <br>A: ${truncateAddress(chunkEnd)}
           <br>Paradas en este tramo: ${chunk.length - 2}`,
  });

  // Preparar waypoints para este chunk
  const chunkWaypoints = [];
  for (let i = 1; i < chunk.length - 1; i++) {
    chunkWaypoints.push({
      location: chunk[i],
      stopover: true,
    });
  }

  const request = {
    origin: chunkStart,
    destination: chunkEnd,
    waypoints: chunkWaypoints,
    travelMode: google.maps.TravelMode.DRIVING,
    optimizeWaypoints: true,
    avoidHighways: avoidHighways,
    avoidTolls: avoidTolls,
  };

  // Añadir tiempo de espera entre solicitudes para evitar límites de rate
  setTimeout(() => {
    directionsService.route(request, (result, status) => {
      if (status === "OK" && result) {
        // Combinar los resultados de este chunk con los anteriores
        if (index > 0) {
          // Para chunks después del primero, omitimos el primer tramo para evitar duplicación
          for (let i = 1; i < result.routes[0].legs.length; i++) {
            combinedResults.routes[0].legs.push(result.routes[0].legs[i]);
          }

          // Agregar los puntos del path
          result.routes[0].overview_path.forEach((point) => {
            combinedResults.routes[0].overview_path.push(point);
          });

          // Combinar las advertencias
          result.routes[0].warnings.forEach((warning) => {
            if (!combinedResults.routes[0].warnings.includes(warning)) {
              combinedResults.routes[0].warnings.push(warning);
            }
          });

          // Ajustar el orden de los waypoints
          const offset = combinedResults.routes[0].waypoint_order.length;
          result.routes[0].waypoint_order.forEach((index) => {
            combinedResults.routes[0].waypoint_order.push(index + offset);
          });
        } else {
          // Para el primer chunk, simplemente copiamos todos los resultados
          combinedResults.routes[0].legs = result.routes[0].legs;
          combinedResults.routes[0].overview_path =
            result.routes[0].overview_path;
          combinedResults.routes[0].warnings = result.routes[0].warnings;
          combinedResults.routes[0].waypoint_order =
            result.routes[0].waypoint_order;
        }

        // Procesar el siguiente chunk
        processChunks(
          chunks,
          index + 1,
          combinedResults,
          avoidHighways,
          avoidTolls
        );
      } else {
        Swal.close();

        // Proporcionar un mensaje de error más detallado
        let errorMessage = `No se pudo calcular <<<el tramo ${
          index + 1
        }: ${status}`;
        let errorSuggestion = "";

        switch (status) {
          case "ZERO_RESULTS":
            errorMessage =
              "No se pudo encontrar una ruta entre estas ubicaciones";
            errorSuggestion = `
              <br><br>Posibles causas:
              <br>• Ubicaciones no navegables por carretera
              <br>• Direcciones inválidas o muy distantes
              <br>• Restricciones que hacen imposible la ruta (peajes/autopistas)
              <br><br>Recomendación: Intenta dividir en rutas más pequeñas o verifica las direcciones.
            `;
            break;
          case "OVER_QUERY_LIMIT":
            errorSuggestion =
              "<br><br>Has excedido el límite de consultas a Google Maps. Intenta más tarde.";
            break;
          case "REQUEST_DENIED":
            errorSuggestion =
              "<br><br>La solicitud fue denegada. Verifica la clave API.";
            break;
          case "INVALID_REQUEST":
            errorSuggestion =
              "<br><br>La solicitud contiene parámetros inválidos. Verifica las direcciones.";
            break;
          case "UNKNOWN_ERROR":
            errorSuggestion =
              "<br><br>Error temporal en el servidor. Intenta nuevamente.";
            break;
        }

        // Mostrar direcciones con problemas
        let addressDetails = `
          <br><strong>Origen del tramo:</strong> ${chunkStart}
          <br><strong>Destino del tramo:</strong> ${chunkEnd}
          <br><strong>Número de paradas intermedias:</strong> ${
            chunk.length - 2
          }
        `;

        Swal.fire({
          icon: "error",
          title: "Error al calcular la ruta",
          html: errorMessage + errorSuggestion + addressDetails,
          confirmButtonColor: "#007bff",
          confirmButtonText: "Entendido",
          showCancelButton: true,
          cancelButtonText: "Ver detalles",
          cancelButtonColor: "#6c757d",
        }).then((result) => {
          if (!result.isConfirmed) {
            // Mostrar detalles completos para diagnóstico
            let detailedAddresses =
              "<strong>Direcciones en este tramo:</strong><br>";
            chunk.forEach((addr, i) => {
              detailedAddresses += `${i + 1}. ${addr}<br>`;
            });

            Swal.fire({
              title: "Detalles del tramo con error",
              html: detailedAddresses,
              confirmButtonColor: "#007bff",
            });
          }
        });
      }
    });
  }, index * 1000); // Esperar 1 segundo entre solicitudes
}

function truncateAddress(address) {
  return address.length > 30 ? address.substring(0, 27) + "..." : address;
}

function displayCombinedRoute(combinedResults) {
  // Check for complete route data
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

  // Clear existing markers
  clearMarkers();

  // Set required properties for the DirectionsRenderer
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

  // Reset and recreate the renderer
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
    // Instead of using the standard renderer, we'll use our enhanced display
    // that includes the outline
    enhanceRouteDisplay(combinedResults);
  } catch (e) {
    console.error("Error al establecer direcciones:", e);
    drawManualPolyline(combinedResults);
  }

  // We'll keep the directionsRenderer for compatibility, but won't rely on its polyline
  directionsRenderer.setMap(map);

  // Set the directions but suppress its polyline
  setTimeout(() => {
    try {
      // This will render the route data but we'll use our custom polylines
      directionsRenderer.setDirections(combinedResults);

      // Hide the default polyline from directionsRenderer
      directionsRenderer.setOptions({
        polylineOptions: {
          visible: false,
        },
      });
    } catch (e) {
      console.error("Error setting directions:", e);
      // Fall back to drawing a polyline manually
      drawManualPolyline(combinedResults);
    }
  }, 100);

  // Continue with the rest of the function for displaying tolls, summaries, etc.
  // Verificar si hay peajes en la ruta
  const hasTolls = combinedResults.routes[0].warnings.some((warning) =>
    warning.toLowerCase().includes("toll")
  );

  // Calculate total distance and time
  let totalDistance = 0;
  let totalDuration = 0;
  combinedResults.routes[0].legs.forEach((leg) => {
    totalDistance += leg.distance.value;
    totalDuration += leg.duration.value;
  });

  const km = (totalDistance / 1000).toFixed(1);
  const mins = Math.round(totalDuration / 60);

  document.getElementById(
    "summary"
  ).innerHTML = `🛣️ Distancia total: <strong>${km} km</strong><br>⏱️ Tiempo estimado: <strong>${mins} minutos</strong>`;

  if (hasTolls) {
    document.getElementById(
      "summary"
    ).innerHTML += `<br>🚧 Esta ruta pasa por <strong>peajes</strong>.`;
  }

  // Verificar peajes específicos en la ruta
  checkTollPointsOnRoute(combinedResults);

  // Mostrar secuencia de paradas para el chofer
  displayFullRouteSequence(combinedResults);

  // Añadir marcadores numerados para todas las paradas
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

function drawManualPolyline(results) {
  if (results.routes && results.routes[0] && results.routes[0].overview_path) {
    const path = results.routes[0].overview_path;

    // Draw the black outline first
    const polylineOutline = new google.maps.Polyline({
      path: path,
      strokeColor: "#000000", // Black outline
      strokeWeight: 10, // Thicker width
      strokeOpacity: 0.8,
      map: map,
      zIndex: 1, // Lower z-index
    });

    // Draw the main blue line on top
    const polyline = new google.maps.Polyline({
      path: path,
      strokeColor: "#3498db", // Blue line
      strokeWeight: 6, // Slightly thinner than the outline
      strokeOpacity: 1,
      map: map,
      zIndex: 2, // Higher z-index
    });
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

function enhanceRouteDisplay(results) {
  // First, clean up any previous traces
  if (window.routePolyline) {
    window.routePolyline.setMap(null);
  }

  if (window.routeOutline) {
    window.routeOutline.setMap(null);
  }

  if (window.turnMarkers) {
    window.turnMarkers.forEach((marker) => marker.setMap(null));
  }
  window.turnMarkers = [];

  // First draw a thicker black outline behind the route
  window.routeOutline = new google.maps.Polyline({
    path: results.routes[0].overview_path,
    strokeColor: "#000000", // Black outline
    strokeWeight: 10, // Thicker than the main line
    strokeOpacity: 0.8,
    map: map,
    zIndex: 1, // Ensure the outline is below the main route
  });

  // Then draw the main colored route line on top
  window.routePolyline = new google.maps.Polyline({
    path: results.routes[0].overview_path,
    strokeColor: "#0047AB", // Strong blue
    strokeWeight: 6, // Thinner than the outline
    strokeOpacity: 1,
    map: map,
    zIndex: 2, // Ensure the main line is above the outline
  });

  // Add turn markers
  const steps = [];
  results.routes[0].legs.forEach((leg) => {
    leg.steps.forEach((step) => {
      if (step.maneuver) {
        steps.push(step);
      }
    });
  });

  // Add markers at turning points
  steps.forEach((step) => {
    if (
      step.maneuver &&
      (step.maneuver.includes("turn") ||
        step.maneuver.includes("ramp") ||
        step.maneuver.includes("fork") ||
        step.maneuver.includes("roundabout"))
    ) {
      const turnMarker = new google.maps.Marker({
        position: step.start_location,
        map: map,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 7,
          fillColor: "#FFD700", // Gold for turning points
          fillOpacity: 1,
          strokeColor: "#000000", // Black border for better visibility
          strokeWeight: 2,
        },
        title: step.instructions.replace(/<[^>]*>/g, ""),
      });

      window.turnMarkers.push(turnMarker);

      // Add a tooltip with instructions
      const infowindow = new google.maps.InfoWindow({
        content: `<div class="turn-instruction">${step.instructions}</div>`,
      });

      turnMarker.addListener("click", function () {
        infowindow.open(map, turnMarker);
      });
    }
  });
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
      // Agregar marcador de peaje
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
  // Obtener todas las direcciones involucradas
  const start = document.getElementById("start").value;
  const end = document.getElementById("end").value;
  const waypointInputs = document.getElementsByClassName("waypoint");

  // Recolectar todas las direcciones y sus posiciones
  let allStopsInfo = [];

  // Agregar punto de inicio
  allStopsInfo.push({
    number: 1,
    address: start,
    position: results.routes[0].legs[0].start_location,
    isStart: true,
  });

  // Para cada tramo de la ruta
  let stopNumber = 2;
  for (let i = 0; i < results.routes[0].legs.length - 1; i++) {
    allStopsInfo.push({
      number: stopNumber++,
      address: results.routes[0].legs[i].end_address,
      position: results.routes[0].legs[i].end_location,
    });
  }

  // Agregar punto final
  allStopsInfo.push({
    number: stopNumber,
    address: end,
    position:
      results.routes[0].legs[results.routes[0].legs.length - 1].end_location,
    isEnd: true,
  });

  // Mostrar la secuencia
  const routeStepsDiv = document.getElementById("route-steps");
  if (!routeStepsDiv) {
    const newDiv = document.createElement("div");
    newDiv.id = "route-steps";
    newDiv.className = "route-steps";
    document.getElementById("summary").after(newDiv);
    routeStepsDiv = newDiv;
  }

  // Limpiar contenido anterior
  routeStepsDiv.innerHTML = `<h2>SECUENCIA DE PARADAS (${allStopsInfo.length})</h2>`;

  // Crear lista de direcciones ordenadas
  const stopsContainer = document.createElement("div");
  stopsContainer.className = "stops-container";

  allStopsInfo.forEach((stop, index) => {
    const stopElement = document.createElement("div");
    stopElement.className = "stop-item";

    // Agregar clases especiales para inicio y fin
    if (stop.isStart) {
      stopElement.classList.add("start-stop");
    } else if (stop.isEnd) {
      stopElement.classList.add("end-stop");
    }

    // Crear círculo con número
    const numberCircle = document.createElement("div");
    numberCircle.className = "letter-circle";
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

  routeStepsDiv.appendChild(stopsContainer);
}

function addSequenceMarkersForFullRoute(results) {
  // Obtener todas las paradas
  const legs = results.routes[0].legs;
  let stopNumber = 1;

  // Marcador de inicio (1)
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

  routeMarkers.push(startMarker);
  stopNumber++;

  // Marcadores para todas las paradas intermedias
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

    routeMarkers.push(waypointMarker);
    stopNumber++;
  }

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
        icon: "error",
        title: "Archivo no soportado",
        text: "Formato de archivo no soportado. Por favor usa Excel (xlsx, .xls) o CSV (.csv)",
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

    // Tomar la primera hoja
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Convertir a JSON
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

    // Buscar columnas
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

    // Extraer direcciones de inicio y destino
    document.getElementById("start").value = jsonData[1][startIndex] || "";
    document.getElementById("end").value = jsonData[1][destinationIndex] || "";

    // Limpiar puntos intermedios existentes
    document.getElementById("waypoints-container").innerHTML = "";

    // Añadir paradas intermedias - todas las columnas con "parada" o numéricas
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

    const waypointCount = document.querySelectorAll(".waypoint").length;

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
        icon: "error",
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
function processExcel(file) {
  // Cargar la librería SheetJS desde CDN si no está disponible
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
