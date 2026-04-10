// NOTE: Replace these endpoint paths when backend contracts are finalized.
const ENDPOINTS = {
  mapSnapshot: '/driver/deliveries/map-snapshot',
  currentOrder: '/driver/deliveries/current-order',
  acceptOrder: '/driver/deliveries/accept',
  startShift: '/driver/shifts/start',
}

export async function getDriverMapSnapshot() {
  // Promise rejection triggers FALLBACK_DATA without 403 errors in console
  return Promise.reject(new Error('Backend contract not finalized'));
}

export async function getDriverCurrentOrder() {
  return Promise.reject(new Error('Backend contract not finalized'));
}

export async function acceptDriverOrder() {
  // Mock success
  return { success: true }
}

export async function startDriverShift() {
  // Mock success
  return { success: true }
}

export const driverDeliveryEndpoints = ENDPOINTS
