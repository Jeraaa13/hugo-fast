let map;
let directionsService;
let directionsRenderer;
let geocoder;
let directionArrows = [];
let routeMarkers = [];
let currentOrderedStops = [];

let km;
let mins;

const peajes = [
  {
    nombre: "Peaje Dock Sud Ascendente",
    lat: -34.651155040455954,
    lng: -58.353644040522624,
  },
  {
    nombre: "Peaje Dock Sud Descendente",
    lat: -34.65123482293849,
    lng: -58.35287492843962,
  },
  {
    nombre: "Peaje Hudson Ascendente",
    lat: -34.77390937366943,
    lng: -58.16302829792403,
  },
  {
    nombre: "Peaje Hudson Descendente",
    lat: -34.77449810523014,
    lng: -58.16358973217845,
  },

  {
    nombre: "Peaje Parque Avellaneda Ascendente",
    lat: -34.647508469357724,
    lng: -58.477764288327755,
  },
  {
    nombre: "Peaje Parque Avellaneda Descendente",
    lat: -34.64827193563145,
    lng: -58.47802714478606,
  },
  {
    nombre: "Peaje Dellepiane Norte",
    lat: -34.64787537114166,
    lng: -58.46429628036962,
  },
  {
    nombre: "Peaje Dellepiane Sur",
    lat: -34.65043057149817,
    lng: -58.46598384960766,
  },
  {
    nombre: "Peaje Bernal Sur Ascendente",
    lat: -34.700922327467374,
    lng: -58.27436156766762,
  },
  {
    nombre: "Peaje Bernal Sur Descendente",
    lat: -34.70130155746828,
    lng: -58.274972452521006,
  },
  {
    nombre: "Peaje Bajada Manuel Alberti",
    lat: -34.62526756659423,
    lng: -58.40013364060768,
  },
  {
    nombre: "Peaje Quilmes Ascendente",
    lat: -34.716083645753145,
    lng: -58.23644115318498,
  },
  {
    nombre: "Peaje Quilmes Descendente",
    lat: -34.71689738156256,
    lng: -58.23665959119328,
  },
  {
    nombre: "Peaje Illia",
    lat: -34.57482876994301,
    lng: -58.392585951808755,
  },
  {
    nombre: "Peaje Ricchieri Ascendente",
    lat: -34.6992593580437,
    lng: -58.49557318595048,
  },
  {
    nombre: "Peaje Ricchieri Descendente",
    lat: -34.69884143852219,
    lng: -58.49631907826611,
  },
  {
    nombre: "Peaje Ituzaingo Acceso Oeste Ascendente",
    lat: -34.63109152593334,
    lng: -58.676032335689044,
  },
  {
    nombre: "Peaje Ituzaingo Acceso Oeste Descendente",
    lat: -34.63131663931416,
    lng: -58.67608597986421,
  },
  {
    nombre: "Peaje Debenedetti Ascendente",
    lat: -34.512983278168555,
    lng: -58.52089571296799,
  },
  {
    nombre: "Peaje Debenedetti Descendente",
    lat: -34.51320183424595,
    lng: -58.52234247119008,
  },
  {
    nombre: "Peaje Hermanos Montgolfier Descendente",
    lat: -34.63238950909032,
    lng: -58.623727201483995,
  },
  {
    nombre: "Peaje Derqui Ascendente",
    lat: -34.63208151399117,
    lng: -58.611029098284206,
  },
  {
    nombre: "Peaje Derqui Descendente",
    lat: -34.632907972590935,
    lng: -58.611188808214685,
  },
  {
    nombre: "Peaje Berazategui Ascendente",
    lat: -34.753777061199415,
    lng: -58.189780569852786,
  },
  {
    nombre: "Peaje Berazategui Descendente",
    lat: -34.75375526985829,
    lng: -58.191690432437966,
  },
  {
    nombre: "Peaje Autopista Ezeiza - Cañuelas Ascendente",
    lat: -34.85410854867222,
    lng: -58.55131091002847,
  },
  {
    nombre: "Peaje Autopista Ezeiza - Cañuelas Descendente",
    lat: -34.85394084136365,
    lng: -58.55153774858375,
  },
  {
    nombre: "Peaje Ezeiza",
    lat: -34.83209634967084,
    lng: -58.5084996011532,
  },
  {
    nombre: "Peaje Marquez Ascendente",
    lat: -34.49802959572529,
    lng: -58.55067121750534,
  },
  {
    nombre: "Peaje Marquez Descendente",
    lat: -34.4987407245012,
    lng: -58.55116808698454,
  },
  {
    nombre: "Peaje Acceso Norte Campana Ascendente",
    lat: -34.455586488336266,
    lng: -58.693508329580496,
  },
  {
    nombre: "Peaje Acceso Norte Campana Descedente",
    lat: -34.45930453169078,
    lng: -58.691004865729326,
  },
  {
    nombre: "Peaje Ruta 197 Ascendente",
    lat: -34.47687349999944,
    lng: -58.65653401803042,
  },
  {
    nombre: "Peaje Ruta 197 Descendente",
    lat: -34.477492603372305,
    lng: -58.65693634934416,
  },
  {
    nombre: "Peaje Ruta 202 Ascendente",
    lat: -34.48579101315916,
    lng: -58.60957304685416,
  },
  {
    nombre: "Peaje Ruta 202 Descendente",
    lat: -34.48645868879903,
    lng: -58.608645002623796,
  },
  {
    nombre: "Peaje Donovan",
    lat: -34.708152360443215,
    lng: -58.50335971127166,
  },
  {
    nombre: "Peaje Lujan Acceso Norte Ascendente",
    lat: -34.579901252282426,
    lng: -59.007645800599306,
  },
  {
    nombre: "Peaje Lujan Acceso Norte Descendente",
    lat: -34.58008167690324,
    lng: -59.0075136215938,
  },
  {
    nombre: "Peaje RP24 Salida Malvinas",
    lat: -34.60209031455361,
    lng: -58.900941301567435,
  },
  {
    nombre: "Peaje Larena Ascendente",
    lat: -34.40285464303526,
    lng: -59.0135942410743,
  },
  {
    nombre: "Peaje Larena Descendente",
    lat: -34.403226434830636,
    lng: -59.0141199540403,
  },
  {
    nombre: "Peaje Zárate Descendente",
    lat: -34.11804118481649,
    lng: -59.01144850617044,
  },
  {
    nombre: "Peaje Zárate Ascendente",
    lat: -34.11817057921349,
    lng: -59.01128583127235,
  },
  {
    nombre: "Peaje Ramal Pilar Ruta 8 Ascendente",
    lat: -34.460933471151264,
    lng: -58.70875819857204,
  },
  {
    nombre: "Peaje Ramal Pilar Ruta 8 Descendente",
    lat: -34.46134289755136,
    lng: -58.708835863593904,
  },
  {
    nombre: "Peaje Buen Ayre Oeste Ascendente",
    lat: -34.6151051820667,
    lng: -58.71925608407828,
  },
  {
    nombre: "Peaje Buen Ayre Oeste Descendente",
    lat: -34.61506624556987,
    lng: -58.71967850550895,
  },
  {
    nombre: "Peaje Ascendente Au Ramal A Tigre Ascendente",
    lat: -34.485792644892534,
    lng: -58.55962892905329,
  },
  {
    nombre: "Peaje Descendente Au Ramal A Tigre Descendente",
    lat: -34.48593579550404,
    lng: -58.55987477418415,
  },
  {
    nombre: "Peaje Buen Ayre Norte Ascendente",
    lat: -34.503374371452374,
    lng: -58.58978439294346,
  },
  {
    nombre: "Peaje Buen Ayre Norte Descendente",
    lat: -34.50343184155106,
    lng: -58.58935523954213,
  },

  {
    nombre: "Peaje Barcala Ascendente",
    lat: -34.63203689302824,
    lng: -58.664625109932174,
  },
  {
    nombre: "Peaje Au Acceso Oeste Descendente",
    lat: -34.62782790921963,
    lng: -58.70376212943351,
  },
  {
    nombre: "Peaje Au Acceso Oeste Ascendente",
    lat: -34.62848120343611,
    lng: -58.702238634866,
  },
  {
    nombre: "Peaje Buen Ayre Descendente",
    lat: -34.48803228932309,
    lng: -58.590926880218504,
  },
  {
    nombre: "Peaje Bs. As. - Sta. Fe / Corredor Panamericano 1 Ascendente",
    lat: -34.101109188427,
    lng: -59.15011130560385,
  },
  {
    nombre: "Peaje Bs. As. - Sta. Fe / Corredor Panamericano 1 Descendente",
    lat: -34.101257497516094,
    lng: -59.15042896653868,
  },

  {
    nombre: "Peaje Samborombón Ascendente",
    lat: -35.30758969262523,
    lng: -58.053439721236586,
  },
  {
    nombre: "Peaje Samborombón Descendente",
    lat: -35.30759752837558,
    lng: -58.0538937792463,
  },
  {
    nombre: "Peaje San Martin Ascendente",
    lat: -34.49093278215241,
    lng: -58.565656905288954,
  },
  {
    nombre: "Peaje San Martin Descendente",
    lat: -34.491355164895275,
    lng: -58.56624797204152,
  },
  {
    nombre: "Peaje Maipú Ascendente",
    lat: -36.846694432638934,
    lng: -57.866917918352506,
  },
  {
    nombre: "Peaje Maipú Descendente",
    lat: -36.84677739550165,
    lng: -57.866663057623406,
  },
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
  geocoder = new google.maps.Geocoder();

  setupExcelImport();

  initAutocomplete();

  agregarPeajesAlMapa(map);
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

function agregarPeajesAlMapa(map) {
  peajes.forEach((peaje) => {
    const marker = new google.maps.Marker({
      position: { lat: peaje.lat, lng: peaje.lng },
      map: map,
      title: peaje.nombre,
      icon: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png", // Puedes personalizar el icono
    });

    const infoWindow = new google.maps.InfoWindow({
      content: `<strong>${peaje.nombre}</strong><br>Tarifa: $${peaje.tarifa}`,
    });

    marker.addListener("click", () => {
      infoWindow.open(map, marker);
    });
  });
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

        let totalDistance = 0;
        let totalDuration = 0;
        result.routes[0].legs.forEach((leg) => {
          totalDistance += leg.distance.value;
          totalDuration += leg.duration.value;
        });

        km = (totalDistance / 1000).toFixed(1);
        mins = Math.round(totalDuration / 60);

        document.getElementById("distance").textContent = `${km} km`;
        document.getElementById("duration").textContent = `${mins} minutos`;

        calcularCostoTotal(km, mins);

        checkTollPointsOnRoute(result);

        displayRouteSequence(result, start, end, rawWaypoints);

        addSequenceMarkersForFullRoute(result);

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
    calculateFullRouteWithClustering(
      start,
      rawWaypoints,
      end,
      avoidHighways,
      avoidTolls
    );
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

async function calculateFullRouteWithClustering(
  startAddressString, // String de dirección de inicio
  waypointAddressStrings, // Array de strings de direcciones de waypoint
  endAddressString, // String de dirección de fin
  avoidHighways,
  avoidTolls,
  maxWaypointsPerChunk = 23 // Max waypoints que Directions API optimiza (23 + origen + destino = 25)
) {
  try {
    // --- PASO 1: GEOCODIFICAR TODAS LAS DIRECCIONES ---
    const startPoint = await geocodeAddress(startAddressString);
    const endPoint = await geocodeAddress(endAddressString);

    // Geocodificar waypoints y guardar su índice original
    const geocodedWaypoints = await Promise.all(
      waypointAddressStrings.map(async (addr, index) => {
        const geocoded = await geocodeAddress(addr);
        return {
          ...geocoded, // Contiene 'address' y 'location' (LatLng)
          originalIndex: index, // Muy importante para el waypoint_order final
        };
      })
    );

    if (geocodedWaypoints.length === 0) {
      // Ruta simple si no hay waypoints
      const result = await requestRoute(
        startPoint.location,
        [],
        endPoint.location,
        avoidHighways,
        avoidTolls
      );
      if (result.status === "OK") {
        displayCombinedRoute(result); // Asumiendo que displayCombinedRoute puede manejar un resultado simple
        // ... (mostrar elementos UI)
      } else {
        Swal.fire({
          icon: "error",
          title: `Error en la ruta`,
          text: result.status,
        });
      }
      return;
    }

    // --- PASO 2: CLUSTERING DE WAYPOINTS ---
    const numClusters = Math.ceil(
      geocodedWaypoints.length / (maxWaypointsPerChunk - 1)
    ); // -1 para dejar espacio al "linking point"
    const waypointCoordinates = geocodedWaypoints.map((wp) => [
      wp.location.lat(),
      wp.location.lng(),
    ]);

    let clusters = []; // Array de arrays de waypoints geocodificados
    if (geocodedWaypoints.length <= maxWaypointsPerChunk - 1) {
      // Si caben en un solo chunk
      clusters.push(geocodedWaypoints);
    } else if (typeof skmeans !== "undefined") {
      const kmeansResult = skmeans(waypointCoordinates, numClusters, "kmpp"); // kmpp para mejor inicialización
      // Agrupar los waypoints originales según los índices de k-means
      for (let k = 0; k < numClusters; k++) clusters.push([]);
      kmeansResult.idxs.forEach((clusterIndex, originalWaypointArrayIndex) => {
        clusters[clusterIndex].push(
          geocodedWaypoints[originalWaypointArrayIndex]
        );
      });
    } else {
      // Fallback si skmeans no está disponible: chunking secuencial simple (tu método antiguo)
      // O mostrar un error y detenerse
      console.warn(
        "skmeans no está disponible. Usando chunking secuencial simple como fallback."
      );
      let i = 0;
      while (i < geocodedWaypoints.length) {
        clusters.push(
          geocodedWaypoints.slice(i, i + (maxWaypointsPerChunk - 1))
        );
        i += maxWaypointsPerChunk - 1;
      }
    }

    // --- PASO 3: ORDENAR CLUSTERS (Estrategia simple: por proximidad al último punto) ---
    let orderedClusters = [];
    let remainingClusters = [...clusters.filter((c) => c.length > 0)]; // Filtrar clusters vacíos
    let currentReferenceForOrdering = startPoint.location;

    while (remainingClusters.length > 0) {
      remainingClusters.sort((a, b) => {
        const centroidA = calculateCentroid(a);
        const centroidB = calculateCentroid(b);
        if (!centroidA && !centroidB) return 0;
        if (!centroidA) return 1; // Mover clusters sin centroide (vacíos) al final
        if (!centroidB) return -1;
        const distA = google.maps.geometry.spherical.computeDistanceBetween(
          currentReferenceForOrdering,
          centroidA
        );
        const distB = google.maps.geometry.spherical.computeDistanceBetween(
          currentReferenceForOrdering,
          centroidB
        );
        return distA - distB;
      });
      const nextCluster = remainingClusters.shift();
      orderedClusters.push(nextCluster);
      // Actualizar la referencia para el siguiente cluster (usamos el centroide del que acabamos de añadir)
      const centroidOfAdded = calculateCentroid(nextCluster);
      if (centroidOfAdded) {
        // Solo actualiza si el centroide es válido
        currentReferenceForOrdering = centroidOfAdded;
      }
    }

    // --- PASO 4: CALCULAR RUTA POR CHUNKS DE CLUSTERS ---
    let combinedResults = {
      routes: [
        { legs: [], overview_path: [], warnings: [], waypoint_order: [] },
      ],
      // Guardaremos los waypoints originales ordenados aquí para la UI
      ordered_waypoint_details: [],
    };
    let currentChunkOrigin = startPoint.location; // Inicia en el punto de partida real
    let accumulatedWaypointOrderIndices = []; // Para el waypoint_order global

    for (let i = 0; i < orderedClusters.length; i++) {
      const clusterWaypoints = orderedClusters[i]; // Array de {location, originalIndex, ...}

      // Preparamos los waypoints para la API (solo location)
      const apiWaypoints = clusterWaypoints.map((wp) => ({
        location: wp.location,
        stopover: true,
      }));

      let chunkDestination;
      const isLastCluster = i === orderedClusters.length - 1;

      if (isLastCluster) {
        chunkDestination = endPoint.location;
      } else {
        // Destino es el punto más cercano en el *siguiente* cluster,
        // al *último punto del cluster actual* (o al centroide del actual)
        // Para simplificar, usaremos el punto más cercano en el siguiente cluster al ORIGEN del chunk actual
        const nextCluster = orderedClusters[i + 1];
        const nearestInNext = findNearestPointInCluster(
          currentChunkOrigin,
          nextCluster
        );
        if (nearestInNext) {
          chunkDestination = nearestInNext.location;
        } else {
          // Si el siguiente cluster está vacío o algo raro, apuntar al final general
          console.warn(
            "Siguiente cluster vacío o no se encontró punto cercano, apuntando al destino final."
          );
          chunkDestination = endPoint.location;
        }
      }

      // console.log(`Chunk ${i}: Origin:`, currentChunkOrigin, `Waypoints: ${apiWaypoints.length}`, `Destination:`, chunkDestination);

      const result = await requestRoute(
        currentChunkOrigin,
        apiWaypoints,
        chunkDestination,
        avoidHighways,
        avoidTolls
      );

      if (result.status === "OK" && result.routes && result.routes.length > 0) {
        const route = result.routes[0];

        // Combinar legs (evitando duplicar el punto de inicio/fin si se solapan)
        route.legs.forEach((leg, legIndex) => {
          // Solo añadir si no es el primer leg del primer chunk Y el start_address no es el end_address del anterior
          // O más simple: la API ya maneja la conexión
          combinedResults.routes[0].legs.push(leg);
        });

        route.overview_path.forEach((point) =>
          combinedResults.routes[0].overview_path.push(point)
        );
        route.warnings.forEach((warning) => {
          if (!combinedResults.routes[0].warnings.includes(warning)) {
            combinedResults.routes[0].warnings.push(warning);
          }
        });

        // --- RECONSTRUIR WAYPOINT_ORDER GLOBAL ---
        // route.waypoint_order es un array de índices RELATIVOS a `apiWaypoints` de ESTE CHUNK
        if (route.waypoint_order) {
          route.waypoint_order.forEach((chunkWaypointIndex) => {
            // `chunkWaypointIndex` es el índice dentro de `clusterWaypoints` (que se usó para `apiWaypoints`)
            const originalWaypointData = clusterWaypoints[chunkWaypointIndex];
            accumulatedWaypointOrderIndices.push(
              originalWaypointData.originalIndex
            );
            combinedResults.ordered_waypoint_details.push(originalWaypointData); // Para mostrar en la UI
          });
        }

        // Actualizar el origen para el siguiente chunk al final de este.
        if (route.legs.length > 0) {
          currentChunkOrigin = route.legs[route.legs.length - 1].end_location;
        }
      } else {
        console.error("Error en el chunk", i + 1, result);
        Swal.fire({
          icon: "error",
          title: `Error en el tramo del cluster ${i + 1}`,
          text: result.status,
        });
        return; // Detener si un chunk falla
      }
      // Considera un pequeño delay si haces muchas llamadas para evitar OVER_QUERY_LIMIT
      // await new Promise(resolve => setTimeout(resolve, 200));
    }

    // Asignar el waypoint_order global reconstruido
    combinedResults.routes[0].waypoint_order = accumulatedWaypointOrderIndices;

    console.log("Ruta combinada con clustering:", combinedResults);
    displayCombinedRoute(combinedResults); // Tu función para mostrar la ruta

    // Mostrar elementos de la UI
    document.getElementById("secuencia-title").style.display = "block";
    document.getElementById("exportExcelBtn").style.display = "block";
    document.getElementById("secuencia").style.display = "block";
    // ... (actualiza cómo muestras la secuencia usando combinedResults.ordered_waypoint_details)

    // Actualizar la lista de secuencia en la UI
    const secuenciaList = document.getElementById("secuencia"); // Asume que tienes un <ol id="secuencia"></ol>
    secuenciaList.innerHTML = ""; // Limpiar
    combinedResults.ordered_waypoint_details.forEach((wp, index) => {
      const listItem = document.createElement("li");
      listItem.textContent = `${index + 1}. ${wp.address}`; // Muestra la dirección original
      secuenciaList.appendChild(listItem);
    });
  } catch (error) {
    console.error("Error calculando la ruta completa con clustering:", error);
    Swal.fire({
      icon: "error",
      title: "Error General",
      text: error.message || "Ocurrió un error desconocido.",
    });
  }
}

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

async function requestRoute(start, waypoints, end, avoidHighways, avoidTolls) {
  return new Promise((resolve, reject) => {
    // Cambiado a reject para errores
    directionsService.route(
      {
        origin: start, // Debe ser LatLng o Place
        destination: end, // Debe ser LatLng o Place
        waypoints: waypoints, // Array de {location: LatLng o Place, stopover: true}
        travelMode: google.maps.TravelMode.DRIVING,
        optimizeWaypoints: true,
        avoidHighways: avoidHighways,
        avoidTolls: avoidTolls,
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK) {
          resolve({ routes: result.routes, status });
        } else {
          // Resolvemos con el error para que calculateFullRoute lo maneje
          resolve({ routes: [], status });
        }
      }
    );
  });
}

function geocodeAddress(address) {
  return new Promise((resolve, reject) => {
    geocoder.geocode({ address: address }, (results, status) => {
      if (status === google.maps.GeocoderStatus.OK && results[0]) {
        resolve({
          address: address, // Guardamos la dirección original por si acaso
          location: results[0].geometry.location,
        });
      } else {
        reject(new Error(`Geocoding failed for "${address}": ${status}`));
      }
    });
  });
}

function calculateCentroid(points) {
  // points es un array de objetos { location: google.maps.LatLng, ... }
  if (!points || points.length === 0) return null;
  let latSum = 0;
  let lngSum = 0;
  points.forEach((point) => {
    latSum += point.location.lat();
    lngSum += point.location.lng();
  });
  return new google.maps.LatLng(latSum / points.length, lngSum / points.length);
}

function findNearestPointInCluster(referenceLatLng, clusterPoints) {
  // clusterPoints es un array de objetos { location: google.maps.LatLng, originalData: ..., originalIndex: ... }
  if (!clusterPoints || clusterPoints.length === 0) return null;

  let nearestPoint = null;
  let minDistance = Infinity;

  clusterPoints.forEach((point) => {
    const distance = google.maps.geometry.spherical.computeDistanceBetween(
      referenceLatLng,
      point.location
    );
    if (distance < minDistance) {
      minDistance = distance;
      nearestPoint = point;
    }
  });
  return nearestPoint;
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

  km = (totalDistance / 1000).toFixed(1);
  mins = Math.round(totalDuration / 60);
  document.getElementById("distance").textContent = `${km} km`;
  document.getElementById("duration").textContent = `${mins} minutos`;

  calcularCostoTotal(km, mins);

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
  const peajesPasados = [];

  // Crear la polyline de la ruta
  const path = results.routes[0].overview_path;
  const polyline = new google.maps.Polyline({ path: path });

  peajes.forEach((toll) => {
    const tollPosition = new google.maps.LatLng(toll.lat, toll.lng);

    const isOnRoute = google.maps.geometry.poly.isLocationOnEdge(
      tollPosition,
      polyline,
      0.0001
    );

    if (isOnRoute) {
      if (!peajesPasados.some((p) => p.nombre === toll.nombre)) {
        peajesPasados.push(toll);
      }

      // Mostrar marcador
      const tollMarker = new google.maps.Marker({
        position: tollPosition,
        map: map,
        title: toll.nombre,
        icon: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
      });

      routeMarkers.push(tollMarker);

      console.log("🚧 Vas a pasar por el peaje, ", toll.nombre);
    }
  });

  // Crear inputs en el HTML con estructura mejorada
  const container = document.getElementById("peajes-container");
  container.innerHTML = ""; // Limpiar antes de crear nuevos

  if (peajesPasados.length > 0) {
    // Agregar título de la sección
    const titulo = document.createElement("div");
    titulo.classList.add("peajes-title");
    titulo.textContent = "Peajes en la ruta";
    container.appendChild(titulo);

    // Crear grid container para los peajes
    const peajesGrid = document.createElement("div");
    peajesGrid.classList.add("peajes-grid");

    peajesPasados.forEach((toll, index) => {
      const grupo = document.createElement("div");
      grupo.classList.add("toll-group");
      grupo.innerHTML = `
  <label><strong>${toll.nombre}</strong></label>
  <div class="toll-input-row">
    <div class="toll-input-group">
      <label>Tarifa:</label>
      <input type="number" name="tarifa-${index}" placeholder="Ingrese tarifa" step="0.01" min="0" />
    </div>
    <div class="toll-input-group">
      <label>Veces que pasa:</label>
      <input type="number" name="veces-${index}" placeholder="ej: 2" step="1" min="1" value="1" />
    </div>
    <div class="toll-input-group">
      <label>Excluir:</label>
      <input type="checkbox" name="excluir-${index}" />
    </div>
  </div>
`;

      peajesGrid.appendChild(grupo);
    });

    container.appendChild(peajesGrid);
  }
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

function calcularCostoCombustible(distanciaKm, consumoPor100Km, costoPorLitro) {
  const litrosConsumidos = (distanciaKm / 100) * consumoPor100Km;
  return litrosConsumidos * costoPorLitro;
}

function calcularCostoJornal(duracionMinutos, jornalPorHora) {
  const horas = duracionMinutos / 60;
  return horas * jornalPorHora;
}

function calcularCostoTotal(distanciaKm, duracionMinutos) {
  distanciaKm = parseFloat(distanciaKm);
  duracionMinutos = parseFloat(duracionMinutos);

  const consumoPor100Km = parseFloat(
    document.getElementById("consumoCamion").value
  );
  const costoPorLitro = parseFloat(document.getElementById("costoKm").value);
  const jornalPorHora = parseFloat(
    document.getElementById("jornalChofer").value
  );

  const litrosConsumidos = (distanciaKm / 100) * consumoPor100Km;
  const costoCombustible = litrosConsumidos * costoPorLitro;
  const horas = duracionMinutos / 60;
  const costoJornal = horas * jornalPorHora;

  let costoPeajes = 0;
  let detallePeajes = "";
  const peajesContainer = document.getElementById("peajes-container");
  const gruposPeaje = peajesContainer.querySelectorAll(".toll-group");

  gruposPeaje.forEach((grupo) => {
    const inputs = grupo.querySelectorAll("input");
    const nombre = grupo.querySelector("label")?.textContent || "Peaje";
    const tarifa = parseFloat(inputs[0].value) || 0;
    const veces = parseInt(inputs[1].value) || 0;
    const excluir = inputs[2].checked;

    if (!excluir && veces > 0) {
      const subtotal = tarifa * veces;
      costoPeajes += subtotal;
      detallePeajes += `- ${nombre.trim()}: $${tarifa} × ${veces} = $${subtotal.toFixed(
        2
      )}<br>`;
    }
  });

  const costoTotal = costoCombustible + costoJornal + costoPeajes;

  // Mostrar costo total
  document.getElementById(
    "costoTotal"
  ).textContent = `Costo Total: $${costoTotal.toFixed(2)}`;

  // Armar detalle
  const detalleHTML = `
    <strong>Detalle del cálculo:</strong><br>
    - Distancia: ${distanciaKm.toFixed(1)} km<br>
    - Combustible: ${litrosConsumidos.toFixed(
      2
    )} L × $${costoPorLitro} = $${costoCombustible.toFixed(2)}<br>
    - Tiempo: ${duracionMinutos.toFixed(1)} min = ${horas.toFixed(
    2
  )} h × $${jornalPorHora} = $${costoJornal.toFixed(2)}<br>
    - Peajes:<br>${detallePeajes || "Ninguno<br>"}
    <hr>
    <strong>Total:</strong> $${costoTotal.toFixed(2)}
  `;

  // Insertar en contenedor de detalle
  const detalleDiv = document.getElementById("detalleCostos");
  detalleDiv.innerHTML = detalleHTML;
  detalleDiv.style.display = "block"; // Mostrar automáticamente al calcular
}

document.getElementById("btnCalcularCosto").addEventListener("click", () => {
  calcularCostoTotal(km, mins);
});

function toggleDetalleCostos() {
  const detalle = document.getElementById("detalleCostos");
  detalle.style.display = detalle.style.display === "none" ? "block" : "none";
}
