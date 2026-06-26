// ═══════════════════════════════════════════════════════════════════════════
// Map Engine — JavaScript injected into Leaflet WebView
// Initializes the map, tile layers, region reporting, and message handling.
// ═══════════════════════════════════════════════════════════════════════════

export const MAP_ENGINE_JS = `
(function() {
  // ── Initialize map ─────────────────────────────────────────────────
  var map = L.map('map', {
    center: [9.02, 38.74],
    zoom: 13,
    zoomControl: false,
    attributionControl: false,
    dragging: true,
    scrollWheelZoom: true,
    doubleClickZoom: true,
    touchZoom: true,
    keyboard: false,
  });

  // ── Tile Layers ────────────────────────────────────────────────────
  var tileLayers = {
    standard: L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      maxZoom: 20, minZoom: 2, subdomains: ['mt0','mt1','mt2','mt3'], attribution: '© Google'
    }),
    dark: L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      maxZoom: 20, minZoom: 2, subdomains: ['mt0','mt1','mt2','mt3'], attribution: '© Google', className: 'dark-mode-tiles'
    }),
    satellite: L.tileLayer('https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
      maxZoom: 20, minZoom: 2, subdomains: ['mt0','mt1','mt2','mt3'], attribution: '© Google'
    }),
    terrain: L.tileLayer('https://{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}', {
      maxZoom: 20, minZoom: 2, subdomains: ['mt0','mt1','mt2','mt3'], attribution: '© Google'
    }),
    light: L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19, minZoom: 2, attribution: '© CARTO'
    }),
  };

  tileLayers.dark.addTo(map);
  var currentLayer = 'dark';

  // ── Init clustering (defined in clustering.js) ─────────────────────
  var markerClusterGroup = initClustering(map);

  // ── State ──────────────────────────────────────────────────────────
  var isReady = false;
  var userMarker = null;
  var userAccuracyCircle = null;
  var followUser = false;
  var moveTimeout = null;
  var lastBoundsReport = null;

  // ── Helpers ─────────────────────────────────────────────────────────
  function latDeltaToZoom(latDelta) {
    if (latDelta <= 0) return 13;
    var zoom = Math.round(Math.log2(360 / latDelta));
    return Math.max(2, Math.min(19, zoom));
  }

  // ── Report region + bounds to React Native ─────────────────────────
  function reportRegion() {
    var center = map.getCenter();
    var bounds = map.getBounds();
    var zoom = map.getZoom();
    var latDelta = bounds.getNorth() - bounds.getSouth();
    var lngDelta = bounds.getEast() - bounds.getWest();

    var payload = {
      latitude: center.lat,
      longitude: center.lng,
      latitudeDelta: latDelta,
      longitudeDelta: lngDelta,
      zoom: zoom,
      northEast: { lat: bounds.getNorth(), lng: bounds.getEast() },
      southWest: { lat: bounds.getSouth(), lng: bounds.getWest() },
    };

    // Only report if bounds changed significantly (>5% change)
    var boundsKey = bounds.getNorth().toFixed(4) + ',' + bounds.getSouth().toFixed(4)
      + ',' + bounds.getEast().toFixed(4) + ',' + bounds.getWest().toFixed(4);
    if (lastBoundsReport === boundsKey) return;
    lastBoundsReport = boundsKey;

    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: 'regionChange',
      payload: payload,
    }));
  }

  // ── Debounced region report ────────────────────────────────────────
  function onMapMove() {
    if (moveTimeout) clearTimeout(moveTimeout);
    moveTimeout = setTimeout(reportRegion, 300);
  }

  map.on('moveend', function () {
    if (isReady) {
      if (moveTimeout) clearTimeout(moveTimeout);
      reportRegion();
    }
  });
  map.on('dragstart', function () {
    followUser = false;
  });

  // ── Report map ready ───────────────────────────────────────────────
  var tilesLoaded = false;
  map.on('load', function () {
    if (!tilesLoaded) {
      tilesLoaded = true;
      isReady = true;
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'mapReady' }));
    }
  });
  setTimeout(function () {
    if (!tilesLoaded) {
      tilesLoaded = true;
      isReady = true;
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'mapReady' }));
    }
  }, 1000);

  // ── Animate to region ──────────────────────────────────────────────
  function animateTo(region) {
    var zoom = latDeltaToZoom(region.latitudeDelta || 0.05);
    map.flyTo([region.latitude, region.longitude], zoom, {
      duration: (region.duration || 500) / 1000,
    });
  }

  // ── Traffic overlay ────────────────────────────────────────────────
  var trafficLayer = null;
  function setTrafficLayer(enabled) {
    if (trafficLayer) { map.removeLayer(trafficLayer); trafficLayer = null; }
    if (!enabled) return;
    trafficLayer = L.layerGroup();
    var roads = [
      { coords: [[9.015,38.745],[9.020,38.748],[9.025,38.750],[9.030,38.752]], color: '#FF4444', weight: 6 },
      { coords: [[9.032,38.738],[9.025,38.732],[9.018,38.740],[9.020,38.755],[9.030,38.760]], color: '#FF8800', weight: 5 },
      { coords: [[9.010,38.755],[9.015,38.750],[9.020,38.748],[9.025,38.745]], color: '#44AA44', weight: 5 },
    ];
    roads.forEach(function (road) {
      L.polyline(road.coords, { color: road.color, weight: road.weight, opacity: 0.7, interactive: false }).addTo(trafficLayer);
    });
    map.addLayer(trafficLayer);
  }

  // ── Map layer switch ───────────────────────────────────────────────
  function setMapLayer(layerName) {
    if (!tileLayers[layerName] || layerName === currentLayer) return;
    map.removeLayer(tileLayers[currentLayer]);
    tileLayers[layerName].addTo(map);
    currentLayer = layerName;
    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: 'layerChanged', payload: { layer: layerName }
    }));
  }

  // ── Handle messages from React Native ──────────────────────────────
  function handleRNMessage(event) {
    var data;
    try { data = JSON.parse(event.data); } catch (e) { return; }

    switch (data.type) {
      case 'setMarkers':
        setMarkersOnMap(data.payload, markerClusterGroup);
        break;
      case 'animateTo':
        animateTo(data.payload);
        break;
      case 'setUserLocation':
        if (data.payload) {
          var result = setUserLocationOnMap(
            data.payload.latitude, data.payload.longitude,
            data.payload.accuracy, data.payload.heading,
            followUser, userMarker, userAccuracyCircle
          );
          userMarker = result.userMarker;
          userAccuracyCircle = result.userAccuracyCircle;
        }
        break;
      case 'setFollowUser':
        followUser = data.payload;
        break;
      case 'setInitialRegion':
        if (!tilesLoaded) {
          var zoom = latDeltaToZoom(data.payload.latitudeDelta || 0.08);
          map.setView([data.payload.latitude, data.payload.longitude], zoom);
        }
        break;
      case 'setMapLayer':
        setMapLayer(data.payload);
        break;
      case 'setTraffic':
        setTrafficLayer(!!data.payload);
        break;
      case 'zoomIn':
        map.zoomIn(1, { animate: true });
        break;
      case 'zoomOut':
        map.zoomOut(1, { animate: true });
        break;
      case 'resetBearing':
        // Leaflet doesn't support rotation
        break;
    }
  }

  document.addEventListener('message', handleRNMessage);
  window.addEventListener('message', handleRNMessage);
  window.handleRNMessage = handleRNMessage;
})();
`;
