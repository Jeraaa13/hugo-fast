let map;
let directionsService;
let directionsRenderer;
let currentLocationMarker;
let watchId;
let directionArrows = [];
let routeMarkers = [];
let currentOrderedStops = [];

const options = {
  componentRestrictions: { country: "ar" },
};
const tollPoints = [
  { lat: -34.7188, lng: -58.2669, name: "Peaje Dock Sud" },
  { lat: -34.8502, lng: -58.0047, name: "Peaje Hudson" },
];

function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: -34.6037, lng: -58.3816 },
    zoom: 12,
    mapTypeControl: false,
  });

  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer({
    map: map,
    suppressMarkers: true,
    polylineOptions: {
      visible: false,
    },
    preserveViewport: false,
  });

  setupAutocomplete(document.getElementById("start"));
  setupAutocomplete(document.getElementById("end"));

  addWaypoint();

  setupExcelImport();
}

window.initMap = initMap;

function setupAutocomplete(inputElement) {
  const autocomplete = new google.maps.places.Autocomplete(inputElement, {
    fields: ["formatted_address", "geometry", "name"],
    componentRestrictions: { country: "ar" },
    strictBounds: false,
  });

  autocomplete.addListener("place_changed", () => {
    const place = autocomplete.getPlace();

    if (!place.geometry || !place.formatted_address) {
      Swal.fire({
        icon: "error",
        title: "Dirección no válida",
        text: "Por favor, seleccioná una dirección válida de la lista.",
      });
      inputElement.value = "";
      return;
    }

    // Opcional: actualizar el valor del input con la dirección validada
    inputElement.value = place.formatted_address;
  });
}

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

  setupAutocomplete(input);
}

function showNotification(message) {
  const notification = document.createElement("div");
  notification.className = "gps-notification";
  notification.textContent = message;

  document.body.appendChild(notification);

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

async function calculateRoute() {
  if (!directionsService) {
    directionsService = new google.maps.DirectionsService();
  }

  const start = document.getElementById("start").value.trim();
  const end = document.getElementById("end").value.trim();
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

  Swal.fire({
    title: "Validando direcciones...",
    html: "Esto puede tomar unos momentos",
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });

  try {
    // Construir un array con todas las direcciones: inicio, waypoints y fin
    const rawAddresses = [start];
    for (let input of waypointInputs) {
      const value = input.value.trim();
      if (value !== "") rawAddresses.push(value);
    }
    rawAddresses.push(end);

    // Validar todas las direcciones
    const validationResults = await Promise.all(
      rawAddresses.map((addr) => validateAddress(addr))
    );

    const validAddresses = [];
    const invalidAddresses = [];

    validationResults.forEach((result, index) => {
      if (result.valid) {
        validAddresses.push(result.formattedAddress);
      } else {
        invalidAddresses.push({
          address: rawAddresses[index],
          message: result.message,
        });
      }
    });

    if (validAddresses.length < 2) {
      Swal.fire({
        icon: "error",
        title: "No hay suficientes direcciones válidas",
        text: "Se necesitan al menos una dirección de inicio y una de destino válidas.",
        confirmButtonColor: "#007bff",
      });
      return;
    }

    if (invalidAddresses.length > 0) {
      let errorMessage =
        "Las siguientes direcciones son inválidas o demasiado generales, pruebe a cambiar la localidad o autocompletarlas:";
      invalidAddresses.forEach((addr, index) => {
        errorMessage += `<br>${index + 1}. "${addr.address}"`;
      });

      Swal.fire({
        icon: "warning",
        title: "Primer Validacion: Direcciones problemáticas",
        html: errorMessage,
        confirmButtonColor: "#007bff",
        showCancelButton: true,
        confirmButtonText: "Continuar sin estas direcciones",
        cancelButtonText: "Cancelar",
      }).then((result) => {
        if (result.isConfirmed) {
          proceedWithChunks(validAddresses, avoidHighways, avoidTolls);
        }
      });
      return;
    }

    proceedWithChunks(validAddresses, avoidHighways, avoidTolls);
  } catch (error) {
    console.error("Error al validar direcciones:", error);
    Swal.fire({
      icon: "error",
      title: "Error al validar direcciones",
      text: "Ocurrió un error al validar las direcciones. Por favor intente nuevamente.",
      confirmButtonColor: "#007bff",
    });
  }
}

async function proceedWithChunks(allAddresses, avoidHighways, avoidTolls) {
  const validationResults = await Promise.all(
    allAddresses.map((addr) => validateAddress(addr))
  );

  const validAddresses = [];
  const invalidAddresses = [];

  validationResults.forEach((result, index) => {
    if (result.valid) {
      validAddresses.push(result.formattedAddress);
    } else {
      invalidAddresses.push({
        address: allAddresses[index],
        message: result.message,
      });
    }
  });

  if (invalidAddresses.length > 0) {
    let errorMessage =
      "Las siguientes direcciones son inválidas o demasiado generales, es probable que google no la este encontrando correctamente, pruebe a cambiar la localidad";
    invalidAddresses.forEach((addr, index) => {
      errorMessage += `<br>${index + 1}. "${addr.address}"`;
    });

    Swal.fire({
      icon: "warning",
      title: "Segunda validacion: Direcciones problemáticas",
      html: errorMessage,
      confirmButtonColor: "#007bff",
      showCancelButton: true,
      confirmButtonText: "Continuar sin estas direcciones",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        proceedWithChunks(validAddresses, avoidHighways, avoidTolls);
        console.log("arreglar");
      }
    });
    return;
  }
  allAddresses = validAddresses;
  // Si pasa la validación, seguimos con el procesamiento de chunks
  if (allAddresses.length <= 25) {
    const waypoints = allAddresses.slice(1, -1).map((address) => ({
      location: address,
      stopover: true,
    }));

    proceedWithRoute(
      allAddresses[0],
      allAddresses[allAddresses.length - 1],
      waypoints,
      avoidHighways,
      avoidTolls
    );
    return;
  }

  Swal.fire({
    title: "Calculando ruta extensa",
    html: `Procesando ${allAddresses.length} direcciones en varios tramos...`,
    allowOutsideClick: false,
    allowEscapeKey: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });

  const chunks = divideIntoChunks(allAddresses);

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

  console.log("Iniciando segunda validación");
  processChunks(chunks, 0, combinedResults, avoidHighways, avoidTolls);

  document.getElementById("secuencia-title").style.display = "block";
  document.getElementById("exportExcelBtn").style.display = "block";
  document.getElementById("secuencia").style.display = "block";

  const infoItems = document.getElementsByClassName("info-item");
  Array.from(infoItems).forEach((item) => {
    item.style.display = "block";
  });
}

function proceedWithRoute(start, end, waypoints, avoidHighways, avoidTolls) {
  Swal.fire({
    title: "Calculando ruta...",
    html: "Esto puede tomar unos momentos",
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });

  const request = {
    origin: start,
    destination: end,
    waypoints: waypoints,
    travelMode: google.maps.TravelMode.DRIVING,
    optimizeWaypoints: true,
    avoidHighways: avoidHighways,
    avoidTolls: avoidTolls,
    provideRouteAlternatives: false,
    drivingOptions: {
      departureTime: new Date(),
      trafficModel: google.maps.TrafficModel.BEST_GUESS,
    },
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
        const tolls = warnings.filter((w) => w.toLowerCase().includes("toll"));
      }

      if (!avoidTolls && hasTolls) {
        Swal.fire({
          icon: "warning",
          title: "Ruta con peajes",
          text: "⚠️ Esta ruta incluye peajes. Revisá el recorrido para estimar el costo.",
          confirmButtonColor: "#007bff",
        });
      }

      displayRouteSequence(result, start, end, waypoints);

      addSequenceMarkersForFullRoute(result);

      const totalDistanceKm = (totalDistance / 1000).toFixed(2);

      const totalDurationMinutes = Math.floor(totalDuration / 60);
      const hours = Math.floor(totalDurationMinutes / 60);
      const minutes = totalDurationMinutes % 60;

      document.getElementById("distance").textContent = `${totalDistanceKm} km`;
      document.getElementById("duration").textContent = `${hours}h ${minutes}m`;

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
}

function validateAddress(address) {
  return new Promise((resolve) => {
    if (!address || address.trim() === "") {
      resolve({ valid: false, message: "Dirección vacía" });
      return;
    }

    const geocoder = new google.maps.Geocoder();

    geocoder.geocode(
      {
        address: address,
        componentRestrictions: {
          country: "ar",
        },
      },
      (results, status) => {
        if (status === google.maps.GeocoderStatus.OK && results.length > 0) {
          const result = results[0];
          const formatted = result.formatted_address;

          console.log(result);

          if (result.partial_match == true) {
            console.log("ASD");
            resolve({
              valid: false,
              message: `La dirección "${address}" no tiene suficiente detalle o Google no la puede encontrar`,
              formattedAddress: formatted,
              originalAddress: address,
            });
          } else {
            resolve({
              valid: true,
              formattedAddress: formatted,
              originalAddress: address,
              location: result.geometry.location,
            });
          }
        } else {
          let errorMsg = "Error desconocido";
          switch (status) {
            case google.maps.GeocoderStatus.ZERO_RESULTS:
              errorMsg = `No se pudo encontrar la dirección "${address}"`;
              break;
            case google.maps.GeocoderStatus.OVER_QUERY_LIMIT:
              errorMsg = "Límite de consultas excedido, intente más tarde";
              break;
            case google.maps.GeocoderStatus.REQUEST_DENIED:
              errorMsg = "Solicitud denegada";
              break;
            case google.maps.GeocoderStatus.INVALID_REQUEST:
              errorMsg = "Solicitud inválida";
              break;
          }
          resolve({
            valid: false,
            message: errorMsg,
            originalAddress: address,
          });
        }
      }
    );
  });
}

function divideIntoChunks(addresses) {
  const chunks = [];
  const maxChunkSize = 24; // Usamos 24 en lugar de 25 para tener margen

  // Si tenemos menos de maxChunkSize, simplemente devolvemos un chunk
  if (addresses.length <= maxChunkSize) {
    return [addresses];
  }

  let currentIndex = 0;

  while (currentIndex < addresses.length) {
    const endIndex = Math.min(currentIndex + maxChunkSize, addresses.length);

    // Obtenemos el fragmento actual
    const chunk = addresses.slice(currentIndex, endIndex);

    // Si este no es el último chunk, agregamos el primer elemento del siguiente chunk
    if (endIndex < addresses.length) {
      chunk.push(addresses[endIndex]);
    }

    chunks.push(chunk);

    // Avanzamos al siguiente bloque, pero sin solapamiento
    currentIndex = endIndex;
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

  const validationPromises = chunk.map((address) => validateAddress(address));

  Promise.all(validationPromises).then((validationResults) => {
    const validAddresses = validationResults
      .filter((result) => result.valid)
      .map((result) => result.formattedAddress);

    // Si tenemos menos de 2 direcciones válidas, no podemos procesar este chunk
    if (validAddresses.length < 2) {
      Swal.fire({
        icon: "warning",
        title: "Problema con las direcciones",
        text: `No hay suficientes direcciones válidas en el grupo ${index + 1}`,
      });
      return;
    }
  });

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

  Swal.update({
    html: `Procesando tramo ${index + 1} de ${chunks.length}...
           <br>De: ${truncateAddress(chunkStart)}
           <br>A: ${truncateAddress(chunkEnd)}
           <br>Paradas en este tramo: ${chunk.length - 2}`,
  });

  // Si este es el primer chunk, usamos optimizeWaypoints: true
  // Para los siguientes chunks, debemos fijar el orden para las primeras paradas

  let chunkWaypoints = [];
  const isFirstChunk = index === 0;

  // Creamos los waypoints para este chunk
  for (let i = 1; i < chunk.length - 1; i++) {
    chunkWaypoints.push({
      location: chunk[i],
      stopover: true,
    });
  }

  // El parámetro de optimización varía según el chunk
  // Para el primer chunk, optimizamos todo
  // Para el resto, NO optimizamos
  const request = {
    origin: chunkStart,
    destination: chunkEnd,
    waypoints: chunkWaypoints,
    travelMode: google.maps.TravelMode.DRIVING,
    optimizeWaypoints: true,
    avoidHighways: avoidHighways,
    avoidTolls: avoidTolls,
    provideRouteAlternatives: false,
    drivingOptions: {
      departureTime: new Date(),
      trafficModel: google.maps.TrafficModel.BEST_GUESS,
    },
  };

  setTimeout(() => {
    directionsService.route(request, (result, status) => {
      console.log(result);
      if (status === "OK" && result) {
        // Para el primer chunk, agregamos todos los legs
        if (index === 0) {
          combinedResults.routes[0].legs = result.routes[0].legs;
          combinedResults.routes[0].overview_path =
            result.routes[0].overview_path;
          combinedResults.routes[0].warnings = result.routes[0].warnings;
          combinedResults.routes[0].waypoint_order =
            result.routes[0].waypoint_order;
        } else {
          // Para los chunks siguientes, ignoramos el primer leg (es repetición)
          // porque ya procesamos ese punto en el chunk anterior
          for (let i = 1; i < result.routes[0].legs.length; i++) {
            combinedResults.routes[0].legs.push(result.routes[0].legs[i]);
          }

          // Acumulamos la información de ruta
          result.routes[0].overview_path.forEach((point) => {
            combinedResults.routes[0].overview_path.push(point);
          });

          // Acumulamos warnings sin duplicados
          result.routes[0].warnings.forEach((warning) => {
            if (!combinedResults.routes[0].warnings.includes(warning)) {
              combinedResults.routes[0].warnings.push(warning);
            }
          });

          // Para los waypoint_order, necesitamos ajustar los índices
          if (isFirstChunk) {
            combinedResults.routes[0].waypoint_order =
              result.routes[0].waypoint_order;
          } else {
            // No necesitamos acumular waypoint_order porque seguimos el orden secuencial
            // después del primer chunk
          }
        }

        processChunks(
          chunks,
          index + 1,
          combinedResults,
          avoidHighways,
          avoidTolls
        );
      } else {
        Swal.close();

        let errorMessage = `No se pudo calcular el tramo ${
          index + 1
        }: ${status}`;
        let errorSuggestion = "";

        // Manejo de errores (igual que tu código original)
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
          // ... (resto del código de manejo de errores)
        }

        Swal.fire({
          icon: "error",
          title: "Error al calcular la ruta",
          html: errorMessage + errorSuggestion,
          confirmButtonColor: "#007bff",
        });
      }
    });
  }, index * 1000);
}

function truncateAddress(address) {
  return address.length > 30 ? address.substring(0, 27) + "..." : address;
}

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
    legendDiv.className = "map-legend";
    legendDiv.innerHTML = `
      <div class="legend-item">
        <div class="legend-color" style="background-color: #FFA500; opacity: 0.4; border: 1px solid #FF8C00;"></div>
        <div class="legend-text">Múltiples paradas cercanas (Hover para ver detalles)</div>
      </div>
    `;
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

function clearMarkers() {
  routeMarkers.forEach((marker) => marker.setMap(null));
  routeMarkers = [];
}

function addSequenceMarkers(response, start, end, waypoints) {
  const waypointOrder = response.routes[0].waypoint_order;
  const legs = response.routes[0].legs;

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

  let stopNumber = 2;
  waypointOrder.forEach((index, i) => {
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

  waypointOrder.forEach((index, i) => {
    const waypointAddress = waypoints[index].location;
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

function isSharpTurn(prevPoint, currentPoint, nextPoint) {
  return false;
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

function enhanceRouteDisplay(results) {
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

  let mainPathPoints = [];
  let finalSegmentPoints = [];

  if (results.routes[0].legs && results.routes[0].legs.length > 1) {
    const penultimateStopLeg =
      results.routes[0].legs[results.routes[0].legs.length - 2];
    const penultimateStopPosition = penultimateStopLeg.end_location;

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

    mainPathPoints = path.slice(0, closestPointIndex + 1);
    finalSegmentPoints = path.slice(closestPointIndex);
  } else {
    const splitPoint = Math.floor(path.length * 0.9);
    mainPathPoints = path.slice(0, splitPoint);
    finalSegmentPoints = path.slice(splitPoint - 1);
  }

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
    strokeColor: "#0047AB",
    strokeWeight: 6,
    strokeOpacity: 1,
    map: map,
    zIndex: 2,
  });

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
    strokeColor: "#c0392b",
    strokeWeight: 6,
    strokeOpacity: 1,
    map: map,
    zIndex: 4,
  });

  addDirectionalArrows(results);

  map.addListener("zoom_changed", function () {
    setTimeout(function () {
      clearDirectionalArrows();
      addDirectionalArrows(results);
    }, 100);
  });

  const routeLegendDiv = document.createElement("div");
  routeLegendDiv.className = "route-legend";
  routeLegendDiv.innerHTML = `
    <div class="legend-item">
      <div class="legend-color" style="background-color: #0047AB;"></div>
      <div class="legend-text">Ruta principal</div>
    </div>
    <div class="legend-item">
      <div class="legend-color" style="background-color: #c0392b;"></div>
      <div class="legend-text">Tramo final</div>
    </div>
  `;
  document.getElementById("map").appendChild(routeLegendDiv);
}

function clearDirectionalArrows() {
  for (let arrow of directionArrows) {
    arrow.setMap(null);
  }
  directionArrows = [];
}

function toggleDirectionalArrows() {
  const toggleBtn = document.getElementById("arrow-toggle-btn");
  const arrowsVisible =
    toggleBtn.getAttribute("data-arrows-visible") === "true";

  if (arrowsVisible) {
    directionArrows.forEach((arrow) => arrow.setVisible(false));
    toggleBtn.textContent = "👁️ Mostrar Flechas";
    toggleBtn.setAttribute("data-arrows-visible", "false");
  } else {
    directionArrows.forEach((arrow) => arrow.setVisible(true));
    toggleBtn.textContent = "👁️ Ocultar Flechas";
    toggleBtn.setAttribute("data-arrows-visible", "true");
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

function getArrowSpacing(zoom) {
  if (zoom >= 17) return 75;
  if (zoom >= 15) return 150;
  if (zoom >= 13) return 300;
  if (zoom >= 11) return 600;
  return 1000;
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

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
