import client from './client'

// NOTE: Replace these endpoint paths when backend contracts are finalized.
const ENDPOINTS = {
  dashboard: '/api/logistics/affiliate/dashboard',
  createOrder: '/api/logistics/orders',
  assignCourier: '/api/logistics/assignments',
}

export async function getAffiliateLogisticsDashboard() {
  const { data } = await client.get(ENDPOINTS.dashboard)
  return data
}

export async function createAffiliateOrder(payload) {
  const { data } = await client.post(ENDPOINTS.createOrder, payload)
  return data
}

export async function assignAffiliateCourier(payload) {
  const { data } = await client.post(ENDPOINTS.assignCourier, payload)
  return data
}

export const affiliateLogisticsEndpoints = ENDPOINTS
