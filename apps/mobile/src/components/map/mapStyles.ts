// ═══════════════════════════════════════════════════════════════════════════
// Map Styles — CSS injected into Leaflet WebView
// Split from webMapHtml.ts for maintainability.
// ═══════════════════════════════════════════════════════════════════════════

export const MAP_CSS = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 100%; height: 100%; overflow: hidden; background: #F5F5F5; }
  #map { width: 100%; height: 100%; }

  .dark-mode-tiles {
    filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%);
  }
  .leaflet-control-attribution { display: none !important; }

  /* ── Custom Marker Pins (Google Maps-inspired teardrop) ──────────── */
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

  /* ── Selected pulse ring ─────────────────────────────────────────── */
  .pulse-ring {
    position: absolute;
    width: 40px; height: 40px; top: -6px; left: -6px;
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

  /* ── MarkerCluster overrides ─────────────────────────────────────── */
  .marker-cluster-small {
    background-color: rgba(66, 133, 244, 0.15) !important;
  }
  .marker-cluster-small div {
    background-color: #4285F4 !important;
    color: #FFF !important;
    font-weight: 900 !important;
    font-size: 14px !important;
  }
  .marker-cluster-medium {
    background-color: rgba(234, 67, 53, 0.15) !important;
  }
  .marker-cluster-medium div {
    background-color: #EA4335 !important;
    color: #FFF !important;
    font-weight: 900 !important;
    font-size: 15px !important;
  }
  .marker-cluster-large {
    background-color: rgba(251, 188, 4, 0.15) !important;
  }
  .marker-cluster-large div {
    background-color: #FBBC04 !important;
    color: #FFF !important;
    font-weight: 900 !important;
    font-size: 16px !important;
  }

  /* ── User location dot ───────────────────────────────────────────── */
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
    width: 14px; height: 14px; top: -8px; left: 4px;
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

  /* ── Saved heart badge ───────────────────────────────────────────── */
  .saved-badge {
    position: absolute; top: -6px; right: -6px;
    font-size: 12px; z-index: 5;
    filter: drop-shadow(0 1px 2px rgba(0,0,0,0.2));
  }
`;
