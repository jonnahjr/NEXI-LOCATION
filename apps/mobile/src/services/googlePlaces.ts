// ── Google Places API Service (New v1 API) ──────────────────────────────
// Uses the new Google Places API (v1) with POST requests and field masks.
// Endpoints:
//   POST https://places.googleapis.com/v1/places:searchText
//   POST https://places.googleapis.com/v1/places:searchNearby
//   GET  https://places.googleapis.com/v1/places/{placeId}
//   GET  https://places.googleapis.com/v1/places/{placeId}/photos/{ref}/media

import { GOOGLE_API_KEY } from '../config';

const PLACES_NEW_BASE = 'https://places.googleapis.com/v1';

// ── Response Types ──────────────────────────────────────────────────────
export interface PlaceGeometry {
  location: { lat: number; lng: number };
}

export interface PlaceResult {
  place_id: string;
  name: string;
  formatted_address: string;
  vicinity: string;
  geometry: PlaceGeometry;
  rating?: number;
  user_ratings_total?: number;
  price_level?: number;
  types: string[];
  icon: string;
  photos?: { photo_reference: string; height: number; width: number }[];
  opening_hours?: { open_now: boolean; weekday_text?: string[] };
  business_status?: string;
  formatted_phone_number?: string;
  website?: string;
}

// ── Common headers for new Places API ───────────────────────────────────
function newApiHeaders(fields: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'X-Goog-Api-Key': GOOGLE_API_KEY,
    'X-Goog-FieldMask': fields,
  };
}

// ── Map new API place object to our legacy PlaceResult interface ────────
interface NewPlace {
  name?: string;                    // "places/ChIJ..."
  displayName?: { text?: string };
  formattedAddress?: string;
  shortFormattedAddress?: string;
  location?: { latitude: number; longitude: number };
  rating?: number;
  userRatingCount?: number;
  types?: string[];
  photos?: { name?: string; photoReference?: string; heightPx?: number; widthPx?: number }[];
  currentOpeningHours?: { openNow?: boolean; weekdayDescriptions?: string[] };
  businessStatus?: string;
  nationalPhoneNumber?: string;
  websiteUri?: string;
  googleMapsUri?: string;
  priceLevel?: string;
}

function mapNewPlaceToResult(place: NewPlace): PlaceResult | null {
  if (!place) return null;
  // Extract place_id from the resource name: "places/ChIJ..." -> "ChIJ..."
  const placeId = place.name?.replace('places/', '') || '';
  const lat = place.location?.latitude ?? 0;
  const lng = place.location?.longitude ?? 0;

  return {
    place_id: placeId,
    name: place.displayName?.text || '',
    formatted_address: place.formattedAddress || place.shortFormattedAddress || '',
    vicinity: place.shortFormattedAddress || '',
    geometry: {
      location: { lat, lng },
    },
    rating: place.rating,
    user_ratings_total: place.userRatingCount,
    price_level: place.priceLevel ? parseInt(place.priceLevel.replace('PRICE_LEVEL_', '')) || 0 : undefined,
    types: place.types || [],
    icon: '',
    photos: place.photos?.map((p) => ({
      photo_reference: p.name || '',
      height: p.heightPx || 400,
      width: p.widthPx || 400,
    })),
    opening_hours: place.currentOpeningHours
      ? { open_now: place.currentOpeningHours.openNow || false, weekday_text: place.currentOpeningHours.weekdayDescriptions }
      : undefined,
    business_status: place.businessStatus,
    formatted_phone_number: place.nationalPhoneNumber,
    website: place.websiteUri,
  };
}

// ── Fields to request from the new API ───────────────────────────────────
const SEARCH_FIELDS = [
  'places.name',
  'places.displayName',
  'places.formattedAddress',
  'places.shortFormattedAddress',
  'places.location',
  'places.rating',
  'places.userRatingCount',
  'places.types',
  'places.photos',
  'places.currentOpeningHours',
  'places.businessStatus',
  'places.nationalPhoneNumber',
  'places.websiteUri',
  'places.googleMapsUri',
  'places.priceLevel',
].join(',');

const DETAILS_FIELDS = [
  'name',
  'displayName',
  'formattedAddress',
  'shortFormattedAddress',
  'location',
  'rating',
  'userRatingCount',
  'types',
  'photos',
  'currentOpeningHours',
  'businessStatus',
  'nationalPhoneNumber',
  'websiteUri',
  'googleMapsUri',
  'priceLevel',
].join(',');

// ── Text Search (for search bar queries) ──────────────────────────────────
export async function searchPlaces(
  query: string,
  location?: { lat: number; lng: number },
  radius?: number,
): Promise<PlaceResult[]> {
  try {
    const body: Record<string, any> = {
      textQuery: query,
    };

    if (location && radius) {
      body.locationBias = {
        circle: {
          center: { latitude: location.lat, longitude: location.lng },
          radius: radius,
        },
      };
    }

    const response = await fetch(`${PLACES_NEW_BASE}/places:searchText`, {
      method: 'POST',
      headers: newApiHeaders(SEARCH_FIELDS),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      // API not enabled — silently return empty results
      return [];
    }

    const data = await response.json();
    const places: NewPlace[] = data.places || [];
    return places.map(mapNewPlaceToResult).filter((p): p is PlaceResult => p !== null);
  } catch {
    return [];
  }
}

// ── Nearby Search (for "places near me") ──────────────────────────────────
export async function searchNearby(
  lat: number,
  lng: number,
  radius: number = 1500,
  includedType?: string,
): Promise<PlaceResult[]> {
  try {
    const body: Record<string, any> = {
      locationRestriction: {
        circle: {
          center: { latitude: lat, longitude: lng },
          radius: radius,
        },
      },
      maxResultCount: 10,
    };

    if (includedType) {
      body.includedTypes = [includedType];
    }

    const response = await fetch(`${PLACES_NEW_BASE}/places:searchNearby`, {
      method: 'POST',
      headers: newApiHeaders(SEARCH_FIELDS),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      // API not enabled — silently return empty results
      return [];
    }

    const data = await response.json();
    const places: NewPlace[] = data.places || [];
    return places.map(mapNewPlaceToResult).filter((p): p is PlaceResult => p !== null);
  } catch {
    return [];
  }
}

// ── Place Details (for business detail screen) ────────────────────────────
export async function getPlaceDetails(placeId: string): Promise<PlaceResult | null> {
  try {
    const response = await fetch(`${PLACES_NEW_BASE}/places/${placeId}`, {
      method: 'GET',
      headers: newApiHeaders(DETAILS_FIELDS),
    });

    if (!response.ok) {
      return null;
    }

    const place: NewPlace = await response.json();
    return mapNewPlaceToResult(place);
  } catch {
    return null;
  }
}

// ── Photo URL helper ──────────────────────────────────────────────────────
export function getPhotoUrl(
  photoReference: string,
  maxWidth: number = 400,
): string {
  // Photo reference in new API format is "places/PLACE_ID/photos/PHOTO_REF/media"
  // If it already includes the full path, use it directly
  if (photoReference.startsWith('places/')) {
    return `${PLACES_NEW_BASE}/${photoReference}/media?maxHeightPx=${maxWidth}&maxWidthPx=${maxWidth}&key=${GOOGLE_API_KEY}`;
  }
  // Fallback to legacy format with direct key parameter
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${GOOGLE_API_KEY}`;
}

// ── Map Google Place type to Nexi category ID ────────────────────────────
export function mapPlaceTypeToCategory(types: string[]): string {
  if (!types || types.length === 0) return 'shop';

  const typeMap: Record<string, string> = {
    restaurant: 'food',
    food: 'food',
    fast_food: 'food',
    bakery: 'food',
    meal_takeaway: 'food',
    meal_delivery: 'food',
    cafe: 'cafe',
    coffee_shop: 'cafe',
    lodging: 'hotel',
    hotel: 'hotel',
    motel: 'hotel',
    guest_house: 'hotel',
    health: 'health',
    hospital: 'health',
    pharmacy: 'health',
    doctor: 'health',
    dentist: 'health',
    clinic: 'health',
    veterinary_care: 'health',
    shopping_mall: 'shop',
    store: 'shop',
    supermarket: 'shop',
    grocery_or_supermarket: 'shop',
    convenience_store: 'shop',
    clothing_store: 'shop',
    electronics_store: 'electronics',
    furniture_store: 'shop',
    hardware_store: 'shop',
    home_goods_store: 'shop',
    book_store: 'shop',
    shoe_store: 'shop',
    night_club: 'club',
    bar: 'club',
    casino: 'club',
    gas_station: 'fuel',
    car_wash: 'carwash',
    car_repair: 'carwash',
    car_dealer: 'auto',
    bank: 'finance',
    atm: 'atm',
    finance: 'finance',
    accounting: 'finance',
    insurance_agency: 'finance',
    school: 'edu',
    university: 'edu',
    library: 'edu',
    primary_school: 'edu',
    secondary_school: 'edu',
    gym: 'gym',
    spa: 'salon',
    beauty_salon: 'salon',
    hair_care: 'salon',
    real_estate_agency: 'realestate',
    bicycle_store: 'sports',
    sport: 'sports',
    church: 'church',
    place_of_worship: 'church',
    mosque: 'church',
    synagogue: 'church',
    hindu_temple: 'church',
    police: 'government',
    fire_station: 'government',
    post_office: 'government',
    embassy: 'government',
    courthouse: 'government',
    city_hall: 'government',
    local_government_office: 'government',
    government_office: 'government',
    park: 'park',
    stadium: 'sports',
    museum: 'culture',
    movie_theater: 'culture',
    amusement_park: 'culture',
    zoo: 'culture',
    airport: 'transport',
    train_station: 'transport',
    bus_station: 'transport',
    taxi_stand: 'transport',
    parking: 'transport',
    hospital_new: 'health',
  };

  for (const type of types) {
    const lower = type.toLowerCase();
    if (typeMap[lower]) return typeMap[lower];
  }

  return 'shop';
}

// ── Map Google Place type to human-readable category label ────────────────
export function getCategoryLabel(types: string[]): string {
  if (!types || types.length === 0) return 'Place';

  const labelMap: Record<string, string> = {
    restaurant: 'Restaurant',
    food: 'Food',
    fast_food: 'Fast Food',
    bakery: 'Bakery',
    cafe: 'Cafe',
    coffee_shop: 'Coffee Shop',
    lodging: 'Hotel',
    hotel: 'Hotel',
    motel: 'Motel',
    health: 'Health',
    hospital: 'Hospital',
    pharmacy: 'Pharmacy',
    doctor: 'Doctor',
    dentist: 'Dentist',
    shopping_mall: 'Shopping Mall',
    store: 'Store',
    supermarket: 'Supermarket',
    grocery_or_supermarket: 'Grocery Store',
    convenience_store: 'Convenience Store',
    clothing_store: 'Clothing Store',
    electronics_store: 'Electronics',
    night_club: 'Night Club',
    bar: 'Bar',
    casino: 'Casino',
    gas_station: 'Fuel Station',
    atm: 'ATM',
    bank: 'Bank',
    school: 'School',
    university: 'University',
    library: 'Library',
    gym: 'Gym',
    spa: 'Spa',
    beauty_salon: 'Beauty Salon',
    hair_care: 'Hair Salon',
    real_estate_agency: 'Real Estate',
    park: 'Park',
    museum: 'Museum',
    movie_theater: 'Cinema',
    church: 'Church',
    place_of_worship: 'Place of Worship',
    mosque: 'Mosque',
    synagogue: 'Synagogue',
    hindu_temple: 'Temple',
    police: 'Police Station',
    fire_station: 'Fire Station',
    post_office: 'Post Office',
    embassy: 'Embassy',
    courthouse: 'Courthouse',
    city_hall: 'City Hall',
    local_government_office: 'Government Office',
    airport: 'Airport',
    train_station: 'Train Station',
    bus_station: 'Bus Station',
    parking: 'Parking',
    stadium: 'Stadium',
    amusement_park: 'Amusement Park',
    zoo: 'Zoo',
  };

  for (const type of types) {
    const lower = type.toLowerCase();
    if (labelMap[lower]) return labelMap[lower];
  }

  const firstType = types[0].replace(/_/g, ' ');
  return firstType.charAt(0).toUpperCase() + firstType.slice(1);
}
