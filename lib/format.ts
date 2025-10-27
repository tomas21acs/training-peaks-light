export function formatDuration(totalSeconds: number) {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return "0 min";
  const minutes = Math.round(totalSeconds / 60);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours > 0) {
    return `${hours}h ${remainingMinutes}m`;
  }
  return `${minutes} min`;
}

export function formatDistance(distanceMeters?: number) {
  if (!distanceMeters) return "—";
  const km = distanceMeters / 1000;
  return `${km.toFixed(km >= 10 ? 0 : 1)} km`;
}

export function formatAverage(value?: number, suffix = "") {
  if (value == null) return "—";
  return `${Math.round(value)}${suffix}`;
}
