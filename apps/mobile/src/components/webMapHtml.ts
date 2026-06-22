// ── Leaflet/OpenStreetMap HTML Template ────────────────────────────────
// This HTML is loaded inside a WebView to render the map.
// Communicates with React Native via postMessage.

export const GENERATED_MAP_HTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>Map</title>
  <link
    rel="stylesheet"
    href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
    integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
    crossorigin=""
  />
  <script
    src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
    integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
    crossorigin=""
  ></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: #F5F5F5; }
    #map { width: 100%; height: 100%; }
    
    /* Google Maps Dark Mode simulation */
    .dark-mode-tiles {
      filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%);
    }
    .leaflet-control-attribution {
      display: none !important;
    }
    /* Custom Marker Styles - Google Maps-inspired */
    .map-pin {
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50% 50% 50% 0;
      width: 28px !important;
      height: 28px !important;
      transform: rotate(-45deg);
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      cursor: pointer;
      transition: transform 0.2s ease;
      position: relative;
    }
    .map-pin-inner {
      transform: rotate(45deg);
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
    }
    .map-pin-icon { font-size: 12px; line-height: 1; pointer-events: none; }
    .map-pin:active { transform: rotate(-45deg) scale(0.85); }

    /* Selected pulse ring */
    .pulse-ring {
      position: absolute;
      width: 40px;
      height: 40px;
      top: -6px;
      left: -6px;
      border-radius: 50%;
      border: 2px solid;
      opacity: 0.25;
      animation: pulse 1.5s ease-in-out infinite;
      pointer-events: none;
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1) rotate(45deg); opacity: 0.25; }
      50% { transform: scale(1.6) rotate(45deg); opacity: 0.08; }
    }

    /* Cluster marker */
    .cluster-marker {
      width: 52px; height: 52px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      border: 2px solid #4285F4; background: rgba(66,133,244,0.15);
      cursor: pointer;
    }
    .cluster-inner {
      width: 34px; height: 34px; border-radius: 50%;
      background: #4285F4; color: #FFF;
      display: flex; align-items: center; justify-content: center;
      font-size: 14px; font-weight: 900;
    }

    /* User location dot - Google Maps style with heading indicator */
    .user-location-dot {
      width: 22px; height: 22px; border-radius: 50%;
      background: #4285F4; border: 3px solid #FFF;
      box-shadow: 0 0 0 2px rgba(66,133,244,0.3), 0 2px 8px rgba(0,0,0,0.4);
      position: relative;
    }
    .user-location-pulse {
      position: absolute;
      width: 40px; height: 40px; top: -9px; left: -9px;
      border-radius: 50%;
      background: rgba(66,133,244,0.15);
      animation: userPulse 2s ease-in-out infinite;
      pointer-events: none;
    }
    @keyframes userPulse {
      0%, 100% { transform: scale(0.8); opacity: 0.5; }
      50% { transform: scale(1.5); opacity: 0.1; }
    }
    .user-heading {
      position: absolute;
      width: 14px; height: 14px;
      top: -8px; left: 4px;
      clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
      background: #4285F4;
      transform-origin: center bottom;
    }
    .user-accuracy {
      border-radius: 50%;
      background: rgba(66,133,244,0.08);
      border: 1px solid rgba(66,133,244,0.2);
      position: absolute;
    }

    /* Saved heart badge */
    .saved-badge {
      position: absolute; top: -6px; right: -6px;
      font-size: 12px; z-index: 5;
      filter: drop-shadow(0 1px 2px rgba(0,0,0,0.2));
    }
  </style>
</head>
<body>
  <div id="map"></div>

  <script>
    (function() {
      const map = L.map('map', {
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

      // ── Tile Layers (multiple map styles) ──────────────────────────
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
      
      // Default layer: dark (Google Maps Dark Mode)
      tileLayers.dark.addTo(map);
      var currentLayer = 'dark';

      let isReady = false;
      let markers = {};
      let userMarker = null;
      let userLocationCircle = null;
      let userAccuracyCircle = null;
      let followUser = false;
      let moveTimeout = null;

      // ── Helper: Convert latitudeDelta to zoom level ─────────────────
      function latDeltaToZoom(latDelta) {
        if (latDelta <= 0) return 13;
        const maxZoom = 19, minZoom = 2;
        const zoom = Math.round(Math.log2(360 / latDelta));
        return Math.max(minZoom, Math.min(maxZoom, zoom));
      }

      // ── Helper: Zoom to latDelta ──────────────────────────────────
      function zoomToLatDelta(zoom) {
        return 360 / Math.pow(2, zoom);
      }

      // ── Report region to React Native ─────────────────────────────
      function reportRegion() {
        const center = map.getCenter();
        const bounds = map.getBounds();
        const latDelta = bounds.getNorth() - bounds.getSouth();
        const lngDelta = bounds.getEast() - bounds.getWest();
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'regionChange',
          payload: {
            latitude: center.lat,
            longitude: center.lng,
            latitudeDelta: latDelta,
            longitudeDelta: lngDelta,
          }
        }));
      }

      // ── Debounced region report ───────────────────────────────────
      function onMapMove() {
        if (moveTimeout) clearTimeout(moveTimeout);
        moveTimeout = setTimeout(reportRegion, 300);
      }

      map.on('moveend', function() {
        if (isReady) {
          if (moveTimeout) clearTimeout(moveTimeout);
          reportRegion();
        }
      });
      map.on('dragstart', function() {
        followUser = false;
      });

      // ── Report map is ready ───────────────────────────────────────
      // Wait for tiles to load before reporting ready
      var tilesLoaded = false;
      map.on('load', function() {
        if (!tilesLoaded) {
          tilesLoaded = true;
          isReady = true;
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'mapReady' }));
        }
      });
      // Also fire after a short delay in case tiles are cached
      setTimeout(function() {
        if (!tilesLoaded) {
          tilesLoaded = true;
          isReady = true;
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'mapReady' }));
        }
      }, 1000);

      // ── Render a single marker (Google Maps-style teardrop pin) ────
      function createMarkerIcon(data) {
        const isCluster = data.count && data.count > 1;
        if (isCluster) {
          return L.divIcon({
            className: '',
            html: '<div class="cluster-marker"><div class="cluster-inner">' + data.count + '</div></div>',
            iconSize: [52, 52],
            iconAnchor: [26, 26],
          });
        }

        const isSelected = data.isSelected;
        const size = isSelected ? 32 : 28;
        const bgColor = data.color || '#EA4335';
        const borderWidth = isSelected ? 3 : 2;

        let html = '<div class="map-pin" style="width:' + size + 'px;height:' + size + 'px;background:' + bgColor + ';border:' + borderWidth + 'px solid white;">';
        html += '<div class="map-pin-inner">';

        // Saved heart badge
        if (data.isSaved && data.showSavedLayer) {
          html += '<span class="saved-badge">❤️</span>';
        }

        html += '<span class="map-pin-icon">' + data.emoji + '</span>';
        html += '</div>';

        // Pulse ring for selected
        if (isSelected) {
          html += '<div class="pulse-ring" style="border-color:' + bgColor + ';"></div>';
        }

        html += '</div>';

        return L.divIcon({
          className: '',
          html: html,
          iconSize: [size + 8, size + 12],
          iconAnchor: [size/2 + 4, size + 8],
        });
      }

      // ── Set markers (called from React Native) ────────────────────
      function setMarkers(markerData) {
        // Remove old markers
        Object.keys(markers).forEach(function(key) {
          map.removeLayer(markers[key]);
        });
        markers = {};

        if (!markerData || !markerData.length) return;

        markerData.forEach(function(data) {
          var icon = createMarkerIcon(data);
          var marker = L.marker([data.latitude, data.longitude], {
            icon: icon,
            keyboard: false,
          }).addTo(map);

          marker.on('click', function() {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'markerPress',
              payload: { id: data.id }
            }));
          });

          markers[data.id] = marker;
        });
      }

      // ── Set user location (blue dot with accuracy) ─────────────────
      function setUserLocation(lat, lng, accuracy, heading) {
        if (userMarker) {
          userMarker.setLatLng([lat, lng]);
        } else {
          var icon = L.divIcon({
            className: '',
            html: '<div style="position:relative;width:40px;height:40px;">'
              + '<div class="user-location-pulse"></div>'
              + '<div class="user-location-dot"><div class="user-heading"></div></div>'
              + '</div>',
            iconSize: [40, 40],
            iconAnchor: [20, 20],
          });
          userMarker = L.marker([lat, lng], { icon: icon, keyboard: false, interactive: false, zIndexOffset: 10000 }).addTo(map);
        }

        // Heading indicator (blue chevron pointing direction)
        if (heading != null && userMarker) {
          var headingEl = userMarker.getElement()?.querySelector('.user-heading');
          if (headingEl) {
            headingEl.style.transform = 'rotate(' + heading + 'deg)';
          }
        }

        // Accuracy circle
        if (accuracy && accuracy > 0) {
          if (userAccuracyCircle) {
            userAccuracyCircle.setLatLng([lat, lng]);
            userAccuracyCircle.setRadius(accuracy);
          } else {
            userAccuracyCircle = L.circle([lat, lng], {
              radius: accuracy,
              color: 'rgba(66,133,244,0.15)',
              fillColor: 'rgba(66,133,244,0.06)',
              fillOpacity: 1,
              weight: 1,
              interactive: false,
            }).addTo(map);
          }
        }

        if (followUser) {
          map.panTo([lat, lng]);
        }
      }

      // ── Animate to region ──────────────────────────────────────────
      function animateTo(region) {
        var zoom = latDeltaToZoom(region.latitudeDelta || 0.05);
        map.flyTo([region.latitude, region.longitude], zoom, {
          duration: (region.duration || 500) / 1000,
        });
      }

      // ── Traffic overlay (simulated major roads with flow colors) ────
      var trafficLayer = null;
      var trafficOn = false;
      
      function setTrafficLayer(enabled) {
        trafficOn = enabled;
        
        // Remove existing traffic layer
        if (trafficLayer) {
          map.removeLayer(trafficLayer);
          trafficLayer = null;
        }
        
        if (!enabled) return;
        
        // Create a canvas overlay for simulated traffic
        trafficLayer = L.canvas({ padding: 0.1 });
        
        // Draw major roads as colored polylines (simulated traffic flow)
        // Using key Addis Ababa roads with color coding
        var roads = [
          // Bole Road (heavy traffic - red)
          { coords: [[9.015, 38.745], [9.020, 38.748], [9.025, 38.750], [9.030, 38.752]], color: '#FF4444', weight: 6 },
          // Ring Road (moderate traffic - orange)
          { coords: [[9.032, 38.738], [9.025, 38.732], [9.018, 38.740], [9.020, 38.755], [9.030, 38.760]], color: '#FF8800', weight: 5 },
          // Airport Road (light traffic - green)
          { coords: [[9.010, 38.755], [9.015, 38.750], [9.020, 38.748], [9.025, 38.745]], color: '#44AA44', weight: 5 },
          // Churchill Ave (moderate)
          { coords: [[9.028, 38.738], [9.024, 38.742], [9.020, 38.745]], color: '#FFAA00', weight: 4 },
          // Debre Zeit Road (light)
          { coords: [[9.022, 38.755], [9.018, 38.760], [9.014, 38.765]], color: '#44CC44', weight: 4 },
          // Kenya Street (slow - red)
          { coords: [[9.027, 38.742], [9.030, 38.746], [9.028, 38.750]], color: '#DD3333', weight: 4 },
          // Cameroon St (moderate)
          { coords: [[9.021, 38.746], [9.023, 38.750], [9.025, 38.753]], color: '#FF9900', weight: 4 },
          // Africa Ave (moderate)
          { coords: [[9.023, 38.740], [9.020, 38.745], [9.018, 38.750]], color: '#FFAA44', weight: 4 },
          // Additional streets
          { coords: [[9.016, 38.742], [9.019, 38.745], [9.022, 38.747]], color: '#44CC44', weight: 3 },
          { coords: [[9.024, 38.748], [9.022, 38.752], [9.020, 38.756]], color: '#FF6644', weight: 3 },
        ];
        
        roads.forEach(function(road) {
          L.polyline(road.coords, {
            color: road.color,
            weight: road.weight + 2,
            opacity: 0.3,
            interactive: false,
          }).addTo(trafficLayer);
          
          L.polyline(road.coords, {
            color: road.color,
            weight: road.weight,
            opacity: 0.7,
            interactive: false,
            dashArray: '8, 12',
          }).addTo(trafficLayer);
        });
        
        map.addLayer(trafficLayer);
      }

      // ── Zoom controls ───────────────────────────────────────────────
      function zoomIn() {
        map.zoomIn(1, { animate: true });
      }
      function zoomOut() {
        map.zoomOut(1, { animate: true });
      }
      function resetBearing() {
        // Leaflet doesn't support rotation natively, but we can reset view
        // This is a no-op that maintains API compatibility
      }

      // ── Switch map layer style ─────────────────────────────────────
      function setMapLayer(layerName) {
        if (!tileLayers[layerName] || layerName === currentLayer) return;
        
        // Remove current layer
        map.removeLayer(tileLayers[currentLayer]);
        // Add new layer
        tileLayers[layerName].addTo(map);
        currentLayer = layerName;
        
        // Report back
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'layerChanged',
          payload: { layer: layerName }
        }));
      }

      // ── Handle messages from React Native ──────────────────────────
      function handleRNMessage(event) {
        var data;
        try {
          data = JSON.parse(event.data);
        } catch(e) { return; }

        switch (data.type) {
          case 'setMarkers':
            setMarkers(data.payload);
            break;
          case 'animateTo':
            animateTo(data.payload);
            break;
          case 'setUserLocation':
            if (data.payload) {
              setUserLocation(
                data.payload.latitude,
                data.payload.longitude,
                data.payload.accuracy,
                data.payload.heading
              );
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
            zoomIn();
            break;
          case 'zoomOut':
            zoomOut();
            break;
          case 'resetBearing':
            resetBearing();
            break;
        }
      }

      // Listen for messages (iOS uses document, Android uses window)
      document.addEventListener('message', handleRNMessage);
      window.addEventListener('message', handleRNMessage);

      // Expose for React Native injected JavaScript
      window.handleRNMessage = handleRNMessage;

      // ── Try to get user location via browser geolocation ─────────
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          function(pos) {
            setUserLocation(pos.coords.latitude, pos.coords.longitude);
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'userLocation',
              payload: { latitude: pos.coords.latitude, longitude: pos.coords.longitude }
            }));
          },
          function() { /* Silently fail - RN will provide location */ },
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 30000 }
        );

        // Watch position (with accuracy and heading)
        navigator.geolocation.watchPosition(
          function(pos) {
            setUserLocation(
              pos.coords.latitude,
              pos.coords.longitude,
              pos.coords.accuracy || null,
              pos.coords.heading || null
            );
          },
          function() {},
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
        );
      }
    })();
  </script>
</body>
</html>
`;
