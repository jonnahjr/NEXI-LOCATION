// ═══════════════════════════════════════════════════════════════════════════
// Leaflet/OpenStreetMap HTML Template
// Composed from modular components for maintainability.
// Loaded inside a WebView to render the map.
// Communicates with React Native via postMessage.
// ═══════════════════════════════════════════════════════════════════════════

import { MAP_CSS } from './map/mapStyles';
import { MARKER_SERVICE_JS } from './map/markerService';
import { CLUSTERING_JS } from './map/clustering';
import { MAP_ENGINE_JS } from './map/mapEngine';

export const GENERATED_MAP_HTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>Map</title>

  <!-- Leaflet CSS -->
  <link
    rel="stylesheet"
    href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
    integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
    crossorigin=""
  />
  <!-- leaflet.markercluster CSS -->
  <link
    rel="stylesheet"
    href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css"
  />
  <link
    rel="stylesheet"
    href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css"
  />

  <!-- Leaflet JS -->
  <script
    src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
    integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
    crossorigin=""
  ></script>
  <!-- leaflet.markercluster JS -->
  <script
    src="https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js"
  ></script>

  <style>${MAP_CSS}</style>
</head>
<body>
  <div id="map"></div>

  <script>
    ${CLUSTERING_JS}
    ${MARKER_SERVICE_JS}
    ${MAP_ENGINE_JS}
  </script>
</body>
</html>
`;
