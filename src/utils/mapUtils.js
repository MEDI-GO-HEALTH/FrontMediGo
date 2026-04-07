/**
 * Bounding box para Bogotá — MediGo
 * Ajustado para cubrir la mayor parte del área urbana de interés.
 */
const BOGOTA_BOUNDS = {
  minLat: 4.55,
  maxLat: 4.80,
  minLng: -74.20,
  maxLng: -74.00,
};

/**
 * Convierte coordenadas geográficas a porcentajes CSS (top/left)
 * @param {number} lat 
 * @param {number} lng 
 * @returns {{ top: string, left: string }}
 */
export function coordToPercent(lat, lng) {
  const { minLat, maxLat, minLng, maxLng } = BOGOTA_BOUNDS;

  // Clamp values inside bounds for safety
  const clat = Math.min(Math.max(lat, minLat), maxLat);
  const clng = Math.min(Math.max(lng, minLng), maxLng);

  const left = ((clng - minLng) / (maxLng - minLng)) * 100;
  // En CSS, el top 0% es el Norte (maxLat), por eso invertimos
  const top = (1 - (clat - minLat) / (maxLat - minLat)) * 100;

  return {
    top: `${top.toFixed(2)}%`,
    left: `${left.toFixed(2)}%`,
  };
}

/**
 * Genera una posición aleatoria dentro de las fronteras de Bogotá
 * Útil para pruebas y mocks.
 */
export function getRandomBogotaCoord() {
  const { minLat, maxLat, minLng, maxLng } = BOGOTA_BOUNDS;
  return {
    lat: minLat + Math.random() * (maxLat - minLat),
    lng: minLng + Math.random() * (maxLng - minLng),
  };
}
