import client from './client'

// NOTE: Replace these endpoint paths when backend contracts are finalized.
const ENDPOINTS = {
  profile: '/affiliate/profile',
  paymentMethods: '/affiliate/payment-methods',
  preferences: '/affiliate/preferences',
  accountStatus: '/affiliate/account-status',
  updateProfile: '/affiliate/profile',
  updatePreferences: '/affiliate/preferences',
  createPaymentMethod: '/affiliate/payment-methods',
  deletePaymentMethod: '/affiliate/payment-methods',
}

export async function getAffiliateProfile() {
  const { data } = await client.get(ENDPOINTS.profile)
  return data
}

export async function getAffiliatePaymentMethods() {
  const { data } = await client.get(ENDPOINTS.paymentMethods)
  return data
}

export async function getAffiliatePreferences() {
  const { data } = await client.get(ENDPOINTS.preferences)
  return data
}

export async function getAffiliateAccountStatus() {
  const { data } = await client.get(ENDPOINTS.accountStatus)
  return data
}

export async function updateAffiliateProfile(payload = {}) {
  const { data } = await client.put(ENDPOINTS.updateProfile, payload)
  return data
}

export async function updateAffiliatePreferences(payload = {}) {
  const { data } = await client.patch(ENDPOINTS.updatePreferences, payload)
  return data
}

export async function createAffiliatePaymentMethod(payload = {}) {
  const { data } = await client.post(ENDPOINTS.createPaymentMethod, payload)
  return data
}

export async function deleteAffiliatePaymentMethod(paymentMethodId) {
  const { data } = await client.delete(`${ENDPOINTS.deletePaymentMethod}/${paymentMethodId}`)
  return data
}

export const affiliateProfileEndpoints = ENDPOINTS
