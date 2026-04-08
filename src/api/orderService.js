import client from './client'

const ENDPOINTS = {
  cart: '/api/orders/cart',
  addToCart: '/api/orders/cart/add',
  confirm: (branchId) => `/api/orders/${branchId}/confirm`,
  myOrders: '/api/orders/me',
}

/**
 * Obtiene el carrito actual del usuario para una sede específica.
 */
export async function getCart(affiliateId, branchId) {
  const { data } = await client.get(ENDPOINTS.cart, {
    params: { affiliateId, branchId }
  })
  return data
}

/**
 * Agrega un medicamento al carrito.
 */
export async function addToCart(payload) {
  // payload: { affiliateId, branchId, medicationId, quantity }
  const { data } = await client.post(ENDPOINTS.addToCart, payload)
  return data
}

/**
 * Confirma el pedido y establece la dirección de entrega.
 */
export async function confirmOrder(branchId, affiliateId, addressData) {
  // addressData: { addressLat, addressLng, notes }
  const { data } = await client.post(ENDPOINTS.confirm(branchId), addressData, {
    params: { affiliateId }
  })
  return data
}

export const orderEndpoints = ENDPOINTS
