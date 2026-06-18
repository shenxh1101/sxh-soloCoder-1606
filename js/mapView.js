const MapView = (() => {
    let map = null;
    let routeLayer = null;
    let markers = [];

    function init(containerId) {
        if (map) {
            map.remove();
        }
        map = L.map(containerId, {
            center: [35.0, 110.0],
            zoom: 5,
            scrollWheelZoom: true
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
            maxZoom: 18
        }).addTo(map);

        return map;
    }

    function clear() {
        if (routeLayer) {
            map.removeLayer(routeLayer);
            routeLayer = null;
        }
        markers.forEach(m => map.removeLayer(m));
        markers = [];
    }

    function showRoute(originCoords, destCoords, originName, destName) {
        if (!map) return;

        clear();

        let origin, dest;
        if (typeof originCoords === 'string') {
            origin = JSON.parse(originCoords);
        } else {
            origin = originCoords;
        }
        if (typeof destCoords === 'string') {
            dest = JSON.parse(destCoords);
        } else {
            dest = destCoords;
        }

        const startIcon = L.divIcon({
            className: 'custom-marker',
            html: `<div style="background:#2D6A4F;color:white;padding:6px 12px;border-radius:20px;font-size:12px;font-weight:600;box-shadow:0 2px 8px rgba(0,0,0,0.3);white-space:nowrap;">起运: ${originName}</div>`,
            iconSize: [null, null],
            iconAnchor: [80, 0]
        });

        const endIcon = L.divIcon({
            className: 'custom-marker',
            html: `<div style="background:#E76F51;color:white;padding:6px 12px;border-radius:20px;font-size:12px;font-weight:600;box-shadow:0 2px 8px rgba(0,0,0,0.3);white-space:nowrap;">目的: ${destName}</div>`,
            iconSize: [null, null],
            iconAnchor: [80, 0]
        });

        const startMarker = L.marker([origin.lat, origin.lng], { icon: startIcon }).addTo(map);
        const endMarker = L.marker([dest.lat, dest.lng], { icon: endIcon }).addTo(map);
        markers.push(startMarker, endMarker);

        const latlngs = [
            [origin.lat, origin.lng],
            [dest.lat, dest.lng]
        ];

        routeLayer = L.polyline(latlngs, {
            color: '#2D6A4F',
            weight: 4,
            opacity: 0.8,
            dashArray: '10, 10'
        }).addTo(map);

        const arrowIcon = L.divIcon({
            className: 'arrow-marker',
            html: `<div style="background:white;color:#2D6A4F;padding:4px 8px;border-radius:50%;font-size:14px;box-shadow:0 2px 8px rgba(0,0,0,0.2);">→</div>`,
            iconSize: [28, 28],
            iconAnchor: [14, 14]
        });

        const midLat = (origin.lat + dest.lat) / 2;
        const midLng = (origin.lng + dest.lng) / 2;
        const midMarker = L.marker([midLat, midLng], { icon: arrowIcon }).addTo(map);
        markers.push(midMarker);

        map.fitBounds(routeLayer.getBounds(), { padding: [80, 80] });
    }

    function destroy() {
        if (map) {
            map.remove();
            map = null;
        }
        routeLayer = null;
        markers = [];
    }

    return {
        init,
        showRoute,
        clear,
        destroy
    };
})();
