// ═══════════════════════════════════════════════════════════════════════════
// Marker Service — JavaScript injected into Leaflet WebView
// Handles marker creation, icons, and interactions.
// ═══════════════════════════════════════════════════════════════════════════

export const MARKER_SERVICE_JS = `
// ── Create a single marker icon (Google Maps-style teardrop pin) ────
function createMarkerIcon(data) {
  const isCluster = data.count && data.count > 1;
  if (isCluster) {
    // MarkerCluster handles cluster rendering, but fallback for custom clusters
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

  html += '<span class="map-pin-icon">' + (data.emoji || '📍') + '</span>';
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
    iconAnchor: [size / 2 + 4, size + 8],
  });
}

// ── Set markers on the map (replaces all existing) ─────────────────
function setMarkersOnMap(markerData, markerClusterGroup) {
  // Clear existing markers from cluster group
  markerClusterGroup.clearLayers();

  if (!markerData || !markerData.length) return;

  markerData.forEach(function (data) {
    var icon = createMarkerIcon(data);
    var marker = L.marker([data.latitude, data.longitude], {
      icon: icon,
      keyboard: false,
    });

    marker.on('click', function () {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'markerPress',
          payload: { id: data.id }
        }));
      }
    });

    markerClusterGroup.addLayer(marker);
  });
}

// ── Set user location on map ───────────────────────────────────────
function setUserLocationOnMap(lat, lng, accuracy, heading, follow, userMarker, userAccuracyCircle) {
  var result = { userMarker: userMarker, userAccuracyCircle: userAccuracyCircle };

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
    userMarker = L.marker([lat, lng], {
      icon: icon,
      keyboard: false,
      interactive: false,
      zIndexOffset: 10000
    }).addTo(map);
    result.userMarker = userMarker;
  }

  // Heading indicator
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
      result.userAccuracyCircle = userAccuracyCircle;
    }
  }

  if (follow) {
    map.panTo([lat, lng]);
  }

  return result;
}
`;
