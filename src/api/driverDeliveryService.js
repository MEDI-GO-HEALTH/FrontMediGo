import client from './client'

// NOTE: Replace these endpoint paths when backend contracts are finalized.
const ENDPOINTS = {
  mapSnapshot: '/driver/deliveries/map-snapshot',
  currentOrder: '/driver/deliveries/current-order',
  acceptOrder: '/driver/deliveries/accept',
  startShift: '/driver/shifts/start',
}

export async function getDriverMapSnapshot() {
  const { data } = await client.get(ENDPOINTS.mapSnapshot)
  return data
}

export async function getDriverCurrentOrder() {
  const { data } = await client.get(ENDPOINTS.currentOrder)
  return data
}

export async function acceptDriverOrder(payload) {
  const { data } = await client.post(ENDPOINTS.acceptOrder, payload)
  return data
}

export async function startDriverShift(payload = {}) {
  const { data } = await client.post(ENDPOINTS.startShift, payload)
  return data
}

export const driverDeliveryEndpoints = ENDPOINTS
