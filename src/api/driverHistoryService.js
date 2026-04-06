import client from './client'

// NOTE: Replace these endpoint paths when backend contracts are finalized.
const ENDPOINTS = {
  summary: '/driver/history/summary',
  trips: '/driver/history/trips',
  emergencySupport: '/driver/support/emergency',
}

export async function getDriverHistorySummary(params = {}) {
  const { data } = await client.get(ENDPOINTS.summary, { params })
  return data
}

export async function getDriverTrips(params = {}) {
  const { data } = await client.get(ENDPOINTS.trips, { params })
  return data
}

export async function requestDriverEmergencySupport(payload = {}) {
  const { data } = await client.post(ENDPOINTS.emergencySupport, payload)
  return data
}

export const driverHistoryEndpoints = ENDPOINTS
