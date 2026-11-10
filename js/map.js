/**
 * CampusOrbit – Smart Campus Navigation Platform
 * Thapar Institute of Engineering & Technology (TIET), Patiala
 * "Your Campus, Within Reach"
 * 
 * Interactive Leaflet Map Module
 * 
 * STRICT ARCHITECTURAL RULES:
 * 1. Single Marker Registry: Every canonical location ID has exactly ONE L.Marker.
 * 2. Category filtering toggles existing markers on/off, NEVER recreating duplicates.
 * 3. Watermark-free, API-key-free map tiles with multi-layer switcher.
 */

(function(window) {
  'use strict';

  // TIET Patiala campus center & bounding coordinates
  const TIET_CENTER = [30.3540, 76.3665];
  const TIET_DEFAULT_ZOOM = 16;
  const TIET_BOUNDS = [
    [30.3470, 76.3540], // Southwest
    [30.3620, 76.3760]  // Northeast
  ];

  // Visual themes for the 7 CampusOrbit categories
  const CATEGORY_STYLES = {
    'Academic Blocks': {
      color: '#2563eb',
      bg: '#eff6ff',
      iconClass: 'cat-academic',
      svg: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zm0 8.45L4.54 9 12 4.95 19.46 9 12 11.45zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z"/></svg>'
    },
    'Hostels': {
      color: '#d97706',
      bg: '#fffbeb',
      iconClass: 'cat-hostels',
      svg: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>'
    },
    'Libraries': {
      color: '#0d9488',
      bg: '#f0fdfa',
      iconClass: 'cat-libraries',
      svg: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9H9V9h10v2zm-4 4H9v-2h6v2zm4-8H9V5h10v2z"/></svg>'
    },
    'Food Courts and Cafes': {
      color: '#e11d48',
      bg: '#fff1f2',
      iconClass: 'cat-food',
      svg: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z"/></svg>'
    },
    'Sports Facilities': {
      color: '#7c3aed',
      bg: '#f5f3ff',
      iconClass: 'cat-sports',
      svg: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z"/></svg>'
    },
    'Administrative Buildings': {
      color: '#334155',
      bg: '#f1f5f9',
      iconClass: 'cat-admin',
      svg: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/></svg>'
    },
    'Other Campus Facilities': {
      color: '#0284c7',
      bg: '#f0f9ff',
      iconClass: 'cat-facilities',
      svg: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>'
    }
  };

  let mapInstance = null;
  const markerRegistry = new Map(); // id -> L.Marker
  let currentSelectedId = null;
  let footprintsLayer = null;
  let activeRouteLayer = null;
  let startMarker = null;
  let endMarker = null;
  let activeCategory = 'All';

  window.CampusMap = {
    /**
     * Initialize Leaflet map instance
     * @param {string} containerId DOM ID
     * @param {Function} onLocationSelect Callback when marker is selected
     */
    init: function(containerId, onLocationSelect) {
      if (mapInstance) return mapInstance;

      // 1. Create Leaflet Map Instance
      mapInstance = L.map(containerId, {
        center: TIET_CENTER,
        zoom: TIET_DEFAULT_ZOOM,
        minZoom: 14,
        maxZoom: 19,
        maxBounds: [
          [30.3420, 76.3480],
          [30.3680, 76.3820]
        ],
        maxBoundsViscosity: 0.85,
        zoomControl: false
      });

      // Custom Zoom Control at top-right
      L.control.zoom({ position: 'topright' }).addTo(mapInstance);

      // 2. Watermark-Free & Reliable Base Tile Layers
      // Default: OpenStreetMap Standard (NO WATERMARK, NO API KEY)
      const osmStandard = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      });

      // Esri Campus Streets (NO WATERMARK, NO API KEY)
      const esriStreet = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Sources: Esri, HERE, Garmin, USGS, Intermap, INCREMENT P, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri Korea, Esri (Thailand), NGCC, (c) OpenStreetMap contributors, and the GIS User Community',
        maxZoom: 19
      });

      // Esri World Imagery (Satellite) (NO WATERMARK, NO API KEY)
      const esriSatellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
        maxZoom: 19
      });

      // Set OpenStreetMap Standard as active layer
      osmStandard.addTo(mapInstance);

      // Layer Switcher Control
      const baseMaps = {
        "Campus Map (OpenStreetMap)": osmStandard,
        "Campus Streets (Esri)": esriStreet,
        "Satellite Aerial (Esri)": esriSatellite
      };
      L.control.layers(baseMaps, null, { position: 'topright' }).addTo(mapInstance);

      // 3. Render Building Footprints
      this.initFootprintsLayer();

      // 4. Render All Canonical Markers (Once!)
      this.initMarkers(onLocationSelect);

      // 5. Map background click resets selection
      mapInstance.on('click', function(e) {
        if (e.originalEvent.target.classList.contains('leaflet-container')) {
          window.CampusMap.clearSelection();
        }
      });

      console.log('[CampusOrbit] Map initialized with watermark-free tiles and', markerRegistry.size, 'canonical markers.');
      return mapInstance;
    },

    /**
     * Render Campus Building & Sports Pitch Footprints
     */
    initFootprintsLayer: function() {
      if (!window.CampusFootprints || !mapInstance) return;

      footprintsLayer = L.geoJSON(window.CampusFootprints, {
        style: function(feature) {
          const props = feature.properties || {};
          const isLeisure = props.leisure === 'pitch' || props.leisure === 'swimming_pool';
          return {
            color: isLeisure ? '#059669' : '#64748b',
            weight: 1.2,
            opacity: 0.8,
            fillColor: isLeisure ? '#d1fae5' : '#e2e8f0',
            fillOpacity: 0.45
          };
        },
        onEachFeature: function(feature, layer) {
          const name = feature.properties && feature.properties.name;
          if (name) {
            layer.bindTooltip(name, {
              permanent: false,
              direction: 'center',
              className: 'building-tooltip'
            });
          }
        }
      }).addTo(mapInstance);
    },

    /**
     * Create markers for all canonical locations.
     * Guaranteed ZERO duplicate markers.
     */
    initMarkers: function(onSelectCallback) {
      const locations = window.CampusLocations.getAll();

      locations.forEach(loc => {
        if (markerRegistry.has(loc.id)) return;

        const style = CATEGORY_STYLES[loc.category] || CATEGORY_STYLES['Other Campus Facilities'];

        const iconHtml = `
          <div class="custom-map-pin ${style.iconClass}" id="pin-${loc.id}" style="--category-color: ${style.color}; --category-bg: ${style.bg};">
            <div class="pin-inner">
              ${style.svg}
            </div>
            <div class="pin-pulse"></div>
          </div>
        `;

        const customIcon = L.divIcon({
          className: 'campus-marker-wrapper',
          html: iconHtml,
          iconSize: [36, 42],
          iconAnchor: [18, 40],
          popupAnchor: [0, -38]
        });

        const marker = L.marker(loc.coordinates, {
          icon: customIcon,
          title: loc.name,
          riseOnHover: true
        });

        // Popup Card
        const popupContent = `
          <div class="map-popup-card">
            <div class="popup-badge" style="background: ${style.bg}; color: ${style.color};">
              ${loc.category} &bull; ${loc.subcategory || ''}
            </div>
            <h4 class="popup-title">${loc.name}</h4>
            <p class="popup-desc">${loc.description.substring(0, 95)}...</p>
            <div class="popup-actions">
              <button class="popup-btn primary" onclick="window.CampusApp.selectLocation('${loc.id}')">View Details</button>
              <button class="popup-btn secondary" onclick="window.CampusApp.startNavigationTo('${loc.id}')">Directions</button>
            </div>
          </div>
        `;

        marker.bindPopup(popupContent, {
          maxWidth: 280,
          className: 'campus-leaflet-popup'
        });

        marker.on('click', () => {
          if (onSelectCallback) {
            onSelectCallback(loc.id);
          }
        });

        marker.addTo(mapInstance);
        markerRegistry.set(loc.id, marker);
      });
    },

    /**
     * Filter visible markers by category without duplicating markers
     */
    filterCategory: function(category) {
      activeCategory = category;
      const allLocs = window.CampusLocations.getAll();

      allLocs.forEach(loc => {
        const marker = markerRegistry.get(loc.id);
        if (!marker) return;

        const shouldShow = (category === 'All' || loc.category === category);
        if (shouldShow) {
          if (!mapInstance.hasLayer(marker)) {
            marker.addTo(mapInstance);
          }
        } else {
          if (loc.id !== currentSelectedId && mapInstance.hasLayer(marker)) {
            marker.remove();
          }
        }
      });
    },

    /**
     * Highlight and focus a specific location
     */
    selectLocation: function(id, openPopup = true) {
      const loc = window.CampusLocations.getById(id);
      if (!loc) return;

      const marker = markerRegistry.get(id);
      if (!marker) return;

      if (!mapInstance.hasLayer(marker)) {
        marker.addTo(mapInstance);
      }

      if (currentSelectedId) {
        const prevPin = document.getElementById(`pin-${currentSelectedId}`);
        if (prevPin) prevPin.classList.remove('selected-pin');
      }

      currentSelectedId = id;

      const currentPin = document.getElementById(`pin-${id}`);
      if (currentPin) {
        currentPin.classList.add('selected-pin');
      }

      mapInstance.flyTo(loc.coordinates, 17, {
        duration: 1.0,
        easeLinearity: 0.25
      });

      if (openPopup) {
        setTimeout(() => {
          marker.openPopup();
        }, 500);
      }
    },

    /**
     * Clear selected highlight
     */
    clearSelection: function() {
      if (currentSelectedId) {
        const pin = document.getElementById(`pin-${currentSelectedId}`);
        if (pin) pin.classList.remove('selected-pin');
        currentSelectedId = null;
      }
    },

    /**
     * Reset map view to fit whole TIET campus
     */
    resetView: function() {
      if (!mapInstance) return;
      this.clearSelection();
      mapInstance.flyToBounds(TIET_BOUNDS, {
        duration: 1.0,
        padding: [30, 30]
      });
    },

    /**
     * Render routing polyline on map
     * @param {Object} routeData
     * @param {boolean} isAlternative
     */
    drawRoute: function(routeData, isAlternative = false) {
      if (!mapInstance || !routeData || !routeData.coordinates) return;

      this.clearRoute();

      const latlngs = routeData.coordinates;

      const glowColor = isAlternative ? '#8b5cf6' : '#0284c7';
      const mainColor = isAlternative ? '#7c3aed' : '#0f766e';

      // Outer glow polyline
      const glowLine = L.polyline(latlngs, {
        color: glowColor,
        weight: 8,
        opacity: 0.35,
        lineCap: 'round',
        lineJoin: 'round'
      });

      // Main route polyline
      const mainLine = L.polyline(latlngs, {
        color: mainColor,
        weight: 4.5,
        opacity: 0.95,
        dashArray: '1, 10',
        lineCap: 'round',
        lineJoin: 'round',
        className: 'animated-route-line'
      });

      activeRouteLayer = L.layerGroup([glowLine, mainLine]).addTo(mapInstance);

      // Start & End Badges
      const startCoord = latlngs[0];
      const endCoord = latlngs[latlngs.length - 1];

      const startIcon = L.divIcon({
        className: 'route-terminal-pin',
        html: '<div class="terminal-badge start-badge">A</div>',
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      const endIcon = L.divIcon({
        className: 'route-terminal-pin',
        html: '<div class="terminal-badge end-badge">B</div>',
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      startMarker = L.marker(startCoord, { icon: startIcon, zIndexOffset: 1000 }).addTo(mapInstance);
      endMarker = L.marker(endCoord, { icon: endIcon, zIndexOffset: 1000 }).addTo(mapInstance);

      mapInstance.flyToBounds(L.latLngBounds(latlngs), {
        duration: 1.2,
        padding: [60, 60]
      });
    },

    /**
     * Clear route from map
     */
    clearRoute: function() {
      if (activeRouteLayer && mapInstance) {
        mapInstance.removeLayer(activeRouteLayer);
        activeRouteLayer = null;
      }
      if (startMarker && mapInstance) {
        mapInstance.removeLayer(startMarker);
        startMarker = null;
      }
      if (endMarker && mapInstance) {
        mapInstance.removeLayer(endMarker);
        endMarker = null;
      }
    },

    /**
     * Invalidate map size
     */
    invalidateSize: function() {
      if (mapInstance) {
        mapInstance.invalidateSize();
      }
    }
  };
})(window);
