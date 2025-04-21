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
    } else {
      alert("No se pudo calcular la ruta: " + status);
    }
  });
}
