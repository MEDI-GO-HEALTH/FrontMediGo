import client from './client'

// NOTE: Replace these endpoint paths when backend contracts are finalized.
const ENDPOINTS = {
  getProfile: '/driver/profile',
  updateProfile: '/driver/profile',
  updateAvailability: '/driver/profile/availability',
}

export async function getDriverProfile() {
  const { data } = await client.get(ENDPOINTS.getProfile)
  return data
}

export async function updateDriverProfile(payload = {}) {
  const { data } = await client.put(ENDPOINTS.updateProfile, payload)
  return data
}

export async function updateDriverAvailability(payload = {}) {
  const { data } = await client.patch(ENDPOINTS.updateAvailability, payload)
  return data
}

export const driverProfileEndpoints = ENDPOINTS
