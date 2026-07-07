export function haversineKm(a: [number, number], b: [number, number]): number {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const lat1 = (a[0] * Math.PI) / 180;
  const lat2 = (b[0] * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(h));
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

export function estTime(km: number): string {
  const mins = Math.max(1, Math.round((km / 25) * 60)); // ~25km/h city
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

export function relativeDate(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const day = 86400000;
  if (diff < day && new Date().toDateString() === d.toDateString()) return "Today";
  if (diff < 2 * day) return "Yesterday";
  if (diff < 7 * day) return `${Math.floor(diff / day)} days ago`;
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}
