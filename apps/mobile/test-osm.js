import { searchNearby, searchPlaces } from './src/services/osmPlaces.js';

// Setup basic global polyfills for fetch if node version is older
import fetch from 'node-fetch';
if (!globalThis.fetch) {
  globalThis.fetch = fetch;
}

async function runTest() {
  console.log("Testing searchNearby in Addis Ababa...");
  const nearby = await searchNearby(9.0222, 38.7468, 1000);
  console.log(`Found ${nearby.length} nearby places.`);
  if (nearby.length > 0) {
    console.log("Sample place:", JSON.stringify(nearby[0], null, 2));
  }

  console.log("\nTesting searchPlaces for 'Tomoca'...");
  const places = await searchPlaces('Tomoca', {lat: 9.0222, lng: 38.7468}, 5000);
  console.log(`Found ${places.length} places matching 'Tomoca'.`);
  if (places.length > 0) {
    console.log("Sample place:", JSON.stringify(places[0], null, 2));
  }
}

runTest().catch(console.error);
