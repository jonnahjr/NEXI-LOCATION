// ── Backend API Configuration ────────────────────────────────────────────
// Your computer's local network IP for physical device connections.
// Find it with: ipconfig (Windows) / ifconfig (Mac/Linux)
// - Android emulator: use 10.0.2.2
// - iOS simulator: localhost works directly
// - Physical device: use your computer's local IP (e.g., 192.168.x.x)
export const API_HOST = '192.168.80.49'; // <-- CHANGE to your computer's local IP
export const API_PORT = '3000';
export const API_BASE_URL = `http://${API_HOST}:${API_PORT}`;

// ── Google APIs Configuration ─────────────────────────────────────────────
// Replace with your actual Google API key that has the following enabled:
// - Places API
// - Geocoding API
// - Maps SDK for Android/iOS (if using native maps)

export const GOOGLE_API_KEY = 'AIzaSyB2Nc8a3Qg4IG__s_TOrDU0m1M8ka2-njI';

export const PLACES_BASE_URL = 'https://maps.googleapis.com/maps/api/place';
