const MapView = (() => {
    let map = null;
    let routeLayer = null;
    let progressLayer = null;
    let markers = [];
    let petMarker = null;
    let petInterval = null;
    let currentProgress = 0;
    let currentRoute = null;

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
        if (petInterval) {
            clearInterval(petInterval);
            petInterval = null;
        }
        if (routeLayer) {
            map.removeLayer(routeLayer);
            routeLayer = null;
        }
        if (progressLayer) {
            map.removeLayer(progressLayer);
            progressLayer = null;
        }
        if (petMarker) {
            map.removeLayer(petMarker);
            petMarker = null;
        }
        markers.forEach(m => map.removeLayer(m));
        markers = [];
        currentProgress = 0;
        currentRoute = null;
    }

    function interpolatePoint(origin, dest, progress) {
        const lat = origin.lat + (dest.lat - origin.lat) * progress;
        const lng = origin.lng + (dest.lng - origin.lng) * progress;
        return { lat, lng };
    }

    function showRoute(originCoords, destCoords, originName, destName, options = {}) {
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

        currentRoute = { origin, dest };
        currentProgress = options.initialProgress || 0;

        const startIcon = L.divIcon({
            className: 'custom-marker',
            html: `<div style="background:#2D6A4F;color:white;padding:6px 14px;border-radius:20px;font-size:12px;font-weight:600;box-shadow:0 2px 8px rgba(0,0,0,0.3);white-space:nowrap;">起运: ${originName}</div>`,
            iconSize: [null, null],
            iconAnchor: [80, 0]
        });

        const endIcon = L.divIcon({
            className: 'custom-marker',
            html: `<div style="background:#E76F51;color:white;padding:6px 14px;border-radius:20px;font-size:12px;font-weight:600;box-shadow:0 2px 8px rgba(0,0,0,0.3);white-space:nowrap;">目的: ${destName}</div>`,
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
            color: '#CBD5E1',
            weight: 8,
            opacity: 0.5,
            lineCap: 'round'
        }).addTo(map);

        if (currentProgress > 0) {
            const progressPoint = interpolatePoint(origin, dest, currentProgress);
            const progressLatlngs = [
                [origin.lat, origin.lng],
                [progressPoint.lat, progressPoint.lng]
            ];
            progressLayer = L.polyline(progressLatlngs, {
                color: '#2D6A4F',
                weight: 6,
                opacity: 0.9,
                lineCap: 'round'
            }).addTo(map);
        }

        const petIcon = L.divIcon({
            className: 'pet-marker',
            html: `
                <div style="
                    position: relative;
                    transform: translateX(-50%) translateY(-100%);
                ">
                    <div style="
                        background: linear-gradient(135deg, #E76F51, #F4A261);
                        color: white;
                        padding: 8px 14px;
                        border-radius: 18px;
                        font-size: 12px;
                        font-weight: 700;
                        box-shadow: 0 4px 16px rgba(231, 111, 81, 0.5);
                        white-space: nowrap;
                        display: flex;
                        align-items: center;
                        gap: 6px;
                        animation: petPulse 2s infinite;
                    ">
                        <span style="font-size:14px;">🐾</span>
                        运输中
                        <div style="
                            position: absolute;
                            bottom: -6px;
                            left: 50%;
                            transform: translateX(-50%);
                            width: 0;
                            height: 0;
                            border-left: 6px solid transparent;
                            border-right: 6px solid transparent;
                            border-top: 8px solid #E76F51;
                        "></div>
                    </div>
                </div>
            `,
            iconSize: [0, 0],
            iconAnchor: [0, 0]
        });

        const initialPetPoint = interpolatePoint(origin, dest, currentProgress);
        petMarker = L.marker([initialPetPoint.lat, initialPetPoint.lng], { icon: petIcon }).addTo(map);

        const arrowIcon = L.divIcon({
            className: 'arrow-marker',
            html: `<div style="background:white;color:#2D6A4F;padding:4px 10px;border-radius:50%;font-size:14px;box-shadow:0 2px 8px rgba(0,0,0,0.2);font-weight:bold;">→</div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 16]
        });

        const midLat = (origin.lat + dest.lat) / 2;
        const midLng = (origin.lng + dest.lng) / 2;
        const midMarker = L.marker([midLat, midLng], { icon: arrowIcon, interactive: false }).addTo(map);
        markers.push(midMarker);

        map.fitBounds(routeLayer.getBounds(), { padding: [100, 100] });

        if (options.animateProgress && currentProgress < 1) {
            startProgressAnimation(origin, dest, options.targetProgress || currentProgress);
        }
    }

    function startProgressAnimation(origin, dest, targetProgress) {
        if (petInterval) clearInterval(petInterval);

        petInterval = setInterval(() => {
            if (currentProgress >= targetProgress) {
                clearInterval(petInterval);
                petInterval = null;
                return;
            }

            currentProgress = Math.min(targetProgress, currentProgress + 0.01);

            const point = interpolatePoint(origin, dest, currentProgress);
            if (petMarker) {
                petMarker.setLatLng([point.lat, point.lng]);
            }

            if (progressLayer) {
                map.removeLayer(progressLayer);
            }
            const progressLatlngs = [
                [origin.lat, origin.lng],
                [point.lat, point.lng]
            ];
            progressLayer = L.polyline(progressLatlngs, {
                color: '#2D6A4F',
                weight: 6,
                opacity: 0.9,
                lineCap: 'round'
            }).addTo(map);
        }, 80);
    }

    function updateProgress(progress) {
        if (!map || !currentRoute || !petMarker) return;

        const targetProgress = Math.max(0, Math.min(1, progress));

        if (petInterval) {
            clearInterval(petInterval);
            petInterval = null;
        }

        startProgressAnimation(currentRoute.origin, currentRoute.dest, targetProgress);
    }

    function destroy() {
        if (petInterval) {
            clearInterval(petInterval);
            petInterval = null;
        }
        if (map) {
            map.remove();
            map = null;
        }
        routeLayer = null;
        progressLayer = null;
        petMarker = null;
        markers = [];
        currentRoute = null;
        currentProgress = 0;
    }

    return {
        init,
        showRoute,
        updateProgress,
        clear,
        destroy
    };
})();
