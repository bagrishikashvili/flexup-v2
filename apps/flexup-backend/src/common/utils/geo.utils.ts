const EARTH_RADIUS_KM = 6371;

/**
 * Haversine distance in kilometers between two coordinates.
 * Returns null if any of the source coordinates is null.
 */
export function haversineDistanceKm(
  lat1: number | null,
  lng1: number | null,
  lat2: number,
  lng2: number,
): number | null {
  if (lat1 === null || lng1 === null) {
    return null;
  }
  const toRad = (deg: number): number => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}
