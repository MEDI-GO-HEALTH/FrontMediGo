import client from './client'

const ENDPOINTS = {
  activeDeliveries: '/api/logistics/deliveries/active',
  acceptOrder: '/api/logistics/deliveries/accept',
  updateLocation: (id) => `/api/logistics/deliveries/${id}/location`,
  pickupDelivery: (id) => `/api/logistics/deliveries/${id}/pickup`,
  completeDelivery: (id) => `/api/logistics/deliveries/${id}/complete`,
}

/**
 * El repartidor toma un pedido del mercado global.
 */
export async function acceptOrder(orderId, driverId) {
  const { data } = await client.post(ENDPOINTS.acceptOrder, null, {
    params: { orderId, driverId }
  })
  return data
}

/**
 * Obtiene las entregas activas de un repartidor.
 */
export async function getActiveDeliveries(driverId) {
  const { data } = await client.get(ENDPOINTS.activeDeliveries, {
    params: { deliveryPersonId: driverId }
  })
  return data
}

/**
 * Marca el pedido como recogido (cambia estado a IN_ROUTE).
 */
export async function pickupDelivery(deliveryId) {
  const { data } = await client.put(ENDPOINTS.pickupDelivery(deliveryId))
  return data
}

/**
 * Finaliza una entrega (cambia estado a DELIVERED).
 */
export async function completeDelivery(deliveryId) {
  const { data } = await client.put(ENDPOINTS.completeDelivery(deliveryId))
  return data
}

/**
 * Actualiza ubicación vía REST (respaldo para WebSocket).
 */
export async function updateDriverLocation(deliveryId, lat, lng) {
  const { data } = await client.put(ENDPOINTS.updateLocation(deliveryId), { lat, lng })
  return data
}
