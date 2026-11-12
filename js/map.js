/**
 * js/map.js
 * Leaflet map controller for CampusRoutes.
 * Manages markers, route polylines, building footprints, tile fallback, and viewport transitions.
 */

(function (global) {
    'use strict';

    const TIET_CENTER = [30.3542, 76.3685];
    const DEFAULT_ZOOM = 16;
    const MAX_BOUNDS = [
        [30.3430, 76.3530],
        [30.3640, 76.3800]
    ];

    const CATEGORY_META = {
        academic: { label: 'Academic', symbol: 'A', color: '#2563eb' },
        hostel:   { label: 'Hostel',   symbol: 'H', color: '#7c3aed' },
        dining:   { label: 'Dining',   symbol: 'D', color: '#d97706' },
        admin:    { label: 'Admin',    symbol: 'M', color: '#0f766e' },
        sports:   { label: 'Sports',   symbol: 'S', color: '#16a34a' },
        landmark: { label: 'Landmark', symbol: 'L', color: '#db2777' },
        medical:  { label: 'Medical',  symbol: '+', color: '#dc2626' },
        gate:     { label: 'Gate',     symbol: 'G', color: '#475569' }
    };

    let mapInstance = null;
    let markerLayerGroup = null;
    let footprintLayer = null;
    let primaryRouteLine = null;
    let altRouteLine = null;
    let originPin = null;
    let destPin = null;
    let tileErrorNotified = false;

    const markerRegistry = new Map();

    function createCategoryIcon(category, isSelected = false) {
        const meta = CATEGORY_META[category] || CATEGORY_META.landmark;
        const size = isSelected ? 34 : 28;
        const ring = isSelected ? 'box-shadow: 0 0 0 4px rgba(37,99,235,0.35); transform: scale(1.08);' : '';

        return L.divIcon({
            className: `campus-pin campus-pin--${category} ${isSelected ? 'is-selected' : ''}`,
            iconSize: [size, size],
            iconAnchor: [size / 2, size / 2],
            html: `<span style="
                display:flex;align-items:center;justify-content:center;
                width:${size}px;height:${size}px;border-radius:50%;
                background:${meta.color};color:#fff;font-weight:700;
                font-size:${isSelected ? 14 : 12}px;border:2px solid #fff;
                ${ring}
            " aria-hidden="true">${meta.symbol}</span>`
        });
    }

    function createEndpointIcon(type) {
        const isStart = type === 'origin';
        const bg = isStart ? '#16a34a' : '#dc2626';
        const label = isStart ? 'START' : 'END';
        return L.divIcon({
            className: `route-endpoint-pin route-endpoint-pin--${type}`,
            iconSize: [44, 24],
            iconAnchor: [22, 12],
            html: `<span style="
                display:inline-flex;align-items:center;justify-content:center;
                padding:2px 6px;border-radius:12px;background:${bg};color:#fff;
                font-size:10px;font-weight:800;letter-spacing:0.04em;
                border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3);
            ">${label}</span>`
        });
    }

    function initMap(containerId, options = {}) {
        if (mapInstance) return mapInstance;

        const container = document.getElementById(containerId);
        if (!container || typeof L === 'undefined') {
            throw new Error('Leaflet library or map container not found.');
        }

        mapInstance = L.map(containerId, {
            center: TIET_CENTER,
            zoom: DEFAULT_ZOOM,
            minZoom: 15,
            maxZoom: 19,
            maxBounds: MAX_BOUNDS,
            maxBoundsViscosity: 0.85,
            zoomControl: false
        });

        L.control.zoom({ position: 'bottomright' }).addTo(mapInstance);

        const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors | TIET CampusRoutes',
            maxZoom: 19
        });

        tileLayer.on('tileerror', () => {
            if (!tileErrorNotified && typeof options.onTileError === 'function') {
                tileErrorNotified = true;
                options.onTileError('Map background tiles could not load. Campus markers and routes remain active.');
            }
        });

        tileLayer.on('load', () => {
            tileErrorNotified = false;
        });

        tileLayer.addTo(mapInstance);
        markerLayerGroup = L.layerGroup().addTo(mapInstance);

        loadBuildingFootprints();
        return mapInstance;
    }

    async function loadBuildingFootprints() {
        if (!mapInstance || footprintLayer) return;
        try {
            const response = await fetch('campus-footprints.geojson');
            if (!response.ok) return;
            const geojson = await response.json();
            if (!geojson || geojson.type !== 'FeatureCollection') return;

            footprintLayer = L.geoJSON(geojson, {
                style: {
                    color: '#64748b',
                    weight: 1,
                    fillColor: '#94a3b8',
                    fillOpacity: 0.16
                },
                interactive: false
            }).addTo(mapInstance);
            footprintLayer.bringToBack();
        } catch (_err) {
            // Optional enhancement
        }
    }

    function renderMarkers(locations, options = {}) {
        if (!mapInstance || !markerLayerGroup) return 0;

        const visibleIds = new Set();
        const activeCategory = options.category || 'all';
        const selectedId = options.selectedId || null;

        for (const loc of locations) {
            if (!loc || !loc.id || !Number.isFinite(loc.lat) || !Number.isFinite(loc.lng)) continue;
            const shouldShow = activeCategory === 'all' || loc.category === activeCategory;
            if (!shouldShow) continue;

            visibleIds.add(loc.id);
            const isSelected = loc.id === selectedId;
            let marker = markerRegistry.get(loc.id);

            if (!marker) {
                marker = L.marker([loc.lat, loc.lng], {
                    icon: createCategoryIcon(loc.category, isSelected),
                    title: `${loc.name} (${CATEGORY_META[loc.category]?.label || loc.category})`,
                    alt: loc.name,
                    keyboard: true
                });

                marker.on('click', () => {
                    if (typeof options.onSelect === 'function') {
                        options.onSelect(loc);
                    }
                });

                markerRegistry.set(loc.id, marker);
            } else {
                marker.setLatLng([loc.lat, loc.lng]);
                marker.setIcon(createCategoryIcon(loc.category, isSelected));
            }

            if (!markerLayerGroup.hasLayer(marker)) {
                markerLayerGroup.addLayer(marker);
            }
        }

        for (const [id, marker] of markerRegistry.entries()) {
            if (!visibleIds.has(id) && markerLayerGroup.hasLayer(marker)) {
                markerLayerGroup.removeLayer(marker);
            }
        }

        return visibleIds.size;
    }

    function focusLocation(loc, zoomLevel = 18) {
        if (!mapInstance || !loc) return false;
        mapInstance.flyTo([loc.lat, loc.lng], zoomLevel, { duration: 0.65 });
        const marker = markerRegistry.get(loc.id);
        if (marker) {
            marker.setZIndexOffset(500);
        }
        return true;
    }

    function clearRoute() {
        if (!mapInstance) return;
        [primaryRouteLine, altRouteLine, originPin, destPin].forEach((layer) => {
            if (layer && mapInstance.hasLayer(layer)) {
                mapInstance.removeLayer(layer);
            }
        });
        primaryRouteLine = null;
        altRouteLine = null;
        originPin = null;
        destPin = null;
    }

    function drawRoute(routeData, options = {}) {
        if (!mapInstance || !routeData || !routeData.primary) return false;
        clearRoute();

        const useAlternative = Boolean(options.useAlternative && routeData.alternative);
        const activeRoute = useAlternative ? routeData.alternative : routeData.primary;
        const secondaryRoute = useAlternative ? routeData.primary : routeData.alternative;

        if (secondaryRoute && Array.isArray(secondaryRoute.coordinates) && secondaryRoute.coordinates.length > 1) {
            altRouteLine = L.polyline(secondaryRoute.coordinates, {
                color: '#64748b',
                weight: 4,
                opacity: 0.65,
                dashArray: '8, 8'
            }).addTo(mapInstance);
        }

        if (Array.isArray(activeRoute.coordinates) && activeRoute.coordinates.length > 1) {
            primaryRouteLine = L.polyline(activeRoute.coordinates, {
                color: '#2563eb',
                weight: 6,
                opacity: 0.92,
                lineJoin: 'round'
            }).addTo(mapInstance);

            const startCoord = activeRoute.coordinates[0];
            const endCoord = activeRoute.coordinates[activeRoute.coordinates.length - 1];

            originPin = L.marker(startCoord, {
                icon: createEndpointIcon('origin'),
                zIndexOffset: 900,
                interactive: false
            }).addTo(mapInstance);

            destPin = L.marker(endCoord, {
                icon: createEndpointIcon('destination'),
                zIndexOffset: 950,
                interactive: false
            }).addTo(mapInstance);

            mapInstance.fitBounds(primaryRouteLine.getBounds(), {
                padding: [55, 55],
                maxZoom: 18
            });
        } else if (activeRoute.coordinates && activeRoute.coordinates.length === 1) {
            mapInstance.flyTo(activeRoute.coordinates[0], 18, { duration: 0.5 });
        }

        return true;
    }

    function resetView() {
        if (!mapInstance) return;
        mapInstance.flyTo(TIET_CENTER, DEFAULT_ZOOM, { duration: 0.6 });
    }

    const CampusMap = {
        CATEGORY_META,
        initMap,
        renderMarkers,
        focusLocation,
        drawRoute,
        clearRoute,
        resetView,
        getMap: () => mapInstance,
        getMarkerCount: () => markerLayerGroup ? markerLayerGroup.getLayers().length : 0
    };

    global.CampusMap = CampusMap;
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = CampusMap;
    }
})(typeof window !== 'undefined' ? window : globalThis);
