

// Map functionality
function openFullMap() {
    // Center the full map view on the route in a new tab (fallback to Google Maps area)
    window.open('https://www.google.com/maps/@28.48,77.02,12z', '_blank');
}

(function() {
    const mapEl = document.getElementById('orderMap');
    if (!mapEl) return;

    // Predefined places list (cleaned strings)
    const RANDOM_PLACES = [
        "Narela Industrial Estate",
        "Mangolpuri Industrial Area",
        "Kirti Nagar Industrial Sheds",
        "Okhla Industrial Estate (Phase I)",
        "Jhilmil Industrial Area",
        "Lawrence Road Industrial Sheds",
        "Wazirpur Industrial Sheds",
        "DDA Industrial Estates",
        "DSIIDC JJR Clusters",
        "Anand Parbat",
        "Shahdara",
        "Firni Road",
        "Tikri Kalan",
        "Nangli Sakrawati",
        "Jharoda Kalan",
        "Bakkarwala Road",
        "Gamri Village",
        "Moti Nagar",
        "Kirti Nagar",
        "Shahdara",
        "Burari",
        "Jagatpuri",
        "Ballimaran"
    ];

    // Current selected pair (names)
    let currentFromName = null;
    let currentToName = null;

    let mapInstance = null;
    let routeLayer = null;
    let pickupMarker = null;
    let deliveryMarker = null;
    const geocodeCache = new Map();

    async function geocodePlace(name) {
        if (geocodeCache.has(name)) return geocodeCache.get(name);

        const candidates = [
            `${name}, Delhi, India`,
            `${name}, New Delhi, India`,
            `${name}, Delhi NCR, India`,
            name
        ];
        const headers = { 'Accept-Language': 'en' };
        const viewbox = '76.80,28.90,77.40,28.30'; // Roughly Delhi region (left,top,right,bottom)

        for (const q of candidates) {
            const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&addressdetails=0&viewbox=${viewbox}&bounded=1&q=${encodeURIComponent(q)}`;
            try {
                const res = await fetch(url, { headers });
                if (!res.ok) continue;
                const data = await res.json();
                if (data && data.length > 0) {
                    const coords = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
                    geocodeCache.set(name, coords);
                    return coords;
                }
            } catch (_) {
                // try next candidate
            }
        }
        throw new Error('Address not found');
    }

    async function fetchRoute(from, to) {
        const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        const data = await res.json();
        if (!data || !data.routes || data.routes.length === 0) throw new Error('Route not found');
        return data.routes[0].geometry; // GeoJSON LineString
    }

    function addMarkers(from, to) {
        if (pickupMarker) mapInstance.removeLayer(pickupMarker);
        if (deliveryMarker) mapInstance.removeLayer(deliveryMarker);

        pickupMarker = L.circleMarker([from.lat, from.lng], {
            color: '#16a34a', fillColor: '#16a34a', fillOpacity: 0.9, radius: 7, weight: 2
        }).addTo(mapInstance).bindPopup('<strong>Pickup</strong>');

        deliveryMarker = L.circleMarker([to.lat, to.lng], {
            color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 0.9, radius: 7, weight: 2
        }).addTo(mapInstance).bindPopup('<strong>Delivery</strong>');
    }

    function drawRoute(geojsonLine) {
        if (routeLayer) mapInstance.removeLayer(routeLayer);
        routeLayer = L.geoJSON(geojsonLine, {
            style: { color: '#2563eb', weight: 5, opacity: 0.9 }
        }).addTo(mapInstance);
        mapInstance.fitBounds(routeLayer.getBounds(), { padding: [30, 30] });
    }

    function selectRandomPair() {
        if (RANDOM_PLACES.length < 2) return [null, null];
        let i = Math.floor(Math.random() * RANDOM_PLACES.length);
        let j = i;
        while (j === i) {
            j = Math.floor(Math.random() * RANDOM_PLACES.length);
        }
        return [RANDOM_PLACES[i], RANDOM_PLACES[j]];
    }

    /* function updateRouteTitle(fromName, toName) {
        const titleEl = document.querySelector('.map-title');
        if (titleEl) {
            titleEl.textContent = `Route: ${fromName} → ${toName}`;
        }
    } */

    async function initMap(forceNewPair = false) {
        if (!mapInstance) {
            mapInstance = L.map('orderMap').setView([28.48, 77.02], 12);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap contributors' }).addTo(mapInstance);
        }

        // Pick a new random pair on first run or when forced
        if (!currentFromName || !currentToName || forceNewPair) {
            const [fromName, toName] = selectRandomPair();
            currentFromName = fromName;
            currentToName = toName;
        }

        // Clear previous layers before loading new ones
        if (pickupMarker) { mapInstance.removeLayer(pickupMarker); pickupMarker = null; }
        if (deliveryMarker) { mapInstance.removeLayer(deliveryMarker); deliveryMarker = null; }
        if (routeLayer) { mapInstance.removeLayer(routeLayer); routeLayer = null; }

        // Try up to 4 pairs to overcome occasional geocode/route failures
        let attempts = 0;
        while (attempts < 4) {
            try {
                const [from, to] = await Promise.all([
                    geocodePlace(currentFromName),
                    geocodePlace(currentToName)
                ]);
                addMarkers(from, to);
                const route = await fetchRoute(from, to);
                drawRoute(route);
                // updateRouteTitle(currentFromName, currentToName);
                return; // success
            } catch (e) {
                // pick a new random pair and retry
                const [fromName, toName] = selectRandomPair();
                currentFromName = fromName;
                currentToName = toName;
                attempts++;
            }
        }
        // If still failing, leave map centered but without route
    }

    window.orderMapController = {
        refresh: function() { initMap(true); }
    };

    document.addEventListener('DOMContentLoaded', initMap);
})();

function refreshMap() {
    if (window.orderMapController) {
        window.orderMapController.refresh();
    }
}
