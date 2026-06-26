// ═══════════════════════════════════════════════════════════════════════════
// Clustering — JavaScript injected into Leaflet WebView
// 3-level zoom clustering with leaflet.markercluster.
// ═══════════════════════════════════════════════════════════════════════════

export const CLUSTERING_JS = `
// ── MarkerCluster configuration ─────────────────────────────────────
// 3-level clustering system:
//   🟢 Zoom 1–10  → clusters only (country/city view)
//   🟡 Zoom 11–14 → clusters + some individual markers (district view)
//   🔴 Zoom 15+   → individual markers (street view)

var markerClusterGroup = L.markerClusterGroup({
  chunkedLoading: true,
  chunkInterval: 100,          // Process markers in chunks of 100ms
  chunkDelay: 50,              // Delay between chunks
  maxClusterRadius: 60,        // Cluster radius in pixels
  disableClusteringAtZoom: 16, // Show individual markers at zoom 16+
  spiderfyOnMaxZoom: true,     // Spiderfied when clicking at max uncluster zoom
  showCoverageOnHover: false,  // Don't show cluster coverage area
  zoomToBoundsOnClick: true,   // Zoom to cluster bounds on click
  spiderLegPolylineOptions: {
    weight: 1.5,
    color: '#4285F4',
    opacity: 0.4,
  },
  iconCreateFunction: function (cluster) {
    var count = cluster.getChildCount();
    var size = 'small';
    if (count >= 50) size = 'large';
    else if (count >= 10) size = 'medium';

    return L.divIcon({
      html: '<div class="marker-cluster-' + size + '"><div>' + count + '</div></div>',
      className: 'marker-cluster marker-cluster-' + size,
      iconSize: L.point(44, 44),
      iconAnchor: [22, 22],
    });
  }
});

// ── Add cluster group to map (called after map init) ───────────────
// This must be called with the map instance
function initClustering(mapInstance) {
  mapInstance.addLayer(markerClusterGroup);
  return markerClusterGroup;
}
`;
