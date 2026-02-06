import { INDIA_STATE_CENTROIDS } from '../../data/indiaStateCentroids';

// Haversine formula to calculate distance between two coordinates
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Find the closest Indian state to the given coordinates
export function findClosestIndianState(latitude: number, longitude: number): string | null {
  // Validate coordinates are finite numbers (accept 0, reject NaN/Infinity/undefined)
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }
  
  let closestStateId: string | null = null;
  let minDistance = Infinity;
  
  // Deterministic selection: iterate in stable order, update only when strictly less
  for (const state of INDIA_STATE_CENTROIDS) {
    const distance = haversineDistance(latitude, longitude, state.lat, state.lng);
    if (distance < minDistance) {
      minDistance = distance;
      closestStateId = state.id;
    }
  }
  
  return closestStateId;
}
