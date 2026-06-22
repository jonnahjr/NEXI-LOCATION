import https from 'https';

const API_KEY = 'AIzaSyB2Nc8a3Qg4IG__s_TOrDU0m1M8ka2-njI';

const data = JSON.stringify({
  locationRestriction: {
    circle: {
      center: { latitude: 9.02, longitude: 38.74 },
      radius: 1500,
    },
  },
  maxResultCount: 10,
});

const req = https.request(
  'https://places.googleapis.com/v1/places:searchNearby',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask': 'places.displayName,places.formattedAddress',
    },
  },
  (res) => {
    let body = '';
    res.on('data', (chunk) => (body += chunk));
    res.on('end', () => {
      console.log('Status Code:', res.statusCode);
      console.log('Response Body:', body);
    });
  }
);

req.on('error', (e) => {
  console.error(e);
});
req.write(data);
req.end();
