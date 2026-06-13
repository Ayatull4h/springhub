// Location obfuscation: snap precise coordinates to a 5 km grid so any two
// springs within ~5 km of each other appear at the same public coordinate.
// This protects vulnerable spring sites from poachers / exploiters. Only
// authorised roles (admins, verified field volunteers) should ever see the
// precise lat/lng.

// 1° latitude ≈ 111 km. 5 km ≈ 0.045°. We use the same step for longitude;
// at Indonesia's latitudes (~-6° to -8°), the east-west distortion is < 1 %.
export const PROTECTION_GRID_DEG = 0.045; // ~5 km
export const PROTECTION_RADIUS_KM = 5;

export type LatLng = { lat: number; lng: number };

/** Snap a precise location to the centre of its 5 km protection cell. */
export function snapToProtectionGrid({ lat, lng }: LatLng): LatLng {
  return {
    lat: Math.round(lat / PROTECTION_GRID_DEG) * PROTECTION_GRID_DEG,
    lng: Math.round(lng / PROTECTION_GRID_DEG) * PROTECTION_GRID_DEG,
  };
}

/** Haversine distance in km between two points. */
export function distanceKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h =
    sinDLat * sinDLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinDLng * sinDLng;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Choose what to display based on the viewer's clearance.
 * - "public" / "volunteer": always snapped
 * - "admin": precise coords
 */
export function visibleLocation(
  precise: LatLng,
  role: "public" | "volunteer" | "admin"
): LatLng {
  if (role === "admin") return precise;
  return snapToProtectionGrid(precise);
}
