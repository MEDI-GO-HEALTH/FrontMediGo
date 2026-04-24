/**
 * driverDeliveryService.js — Operaciones de entrega del repartidor
 *
 * Flujo real:
 *  1. getPendingOrders()   → GET /api/orders?status=CONFIRMED   (pedidos sin repartidor)
 *  2. getActiveDeliveries()→ GET /api/logistics/deliveries/active?deliveryPersonId={}
 *  3. selfAssignOrder()    → POST /api/logistics/deliveries/assign {deliveryPersonId, orderId}
 *  4. finalizeDelivery()   → PUT /api/logistics/deliveries/{id}/complete
 */
import client from './client'

const getUserId = () => {
  try {
    const user = JSON.parse(localStorage.getItem('medigo_user') || '{}')
    return user.id || user.user_id || user.userId || user.sub || null
  } catch {
    return null
  }
}

// ── Endpoints ─────────────────────────────────────────────────────────

/**
 * Pedidos confirmados por afiliados que aún no tienen repartidor asignado.
 * El repartidor los ve para elegir cuál tomar.
 *
 * @returns {Promise<Array<{id, orderNumber, totalPrice, street, city, branchId, items}>>}
 */
export async function getPendingOrders() {
  const { data } = await client.get('/api/orders', { params: { status: 'CONFIRMED' } })
  return Array.isArray(data) ? data : []
}

/**
 * Entregas activas asignadas al repartidor autenticado.
 * Incluye status ASSIGNED e IN_ROUTE.
 *
 * @returns {Promise<Array>}
 */
export async function getActiveDeliveries() {
  const id = getUserId()
  if (!id) return []
  const { data } = await client.get('/api/logistics/deliveries/active', {
    params: { deliveryPersonId: id },
  })
  return Array.isArray(data) ? data : (data ? [data] : [])
}

/**
 * El repartidor se auto-asigna a un pedido confirmado.
 * Llama a POST /api/logistics/deliveries/assign con {deliveryPersonId, orderId}.
 *
 * @param {number|string} orderId  ID del pedido a tomar
 * @returns {Promise<{id, orderId, deliveryPersonId, status, assignedAt}>}
 */
export async function selfAssignOrder(orderId) {
  const deliveryPersonId = getUserId()
  if (!deliveryPersonId) throw new Error('No se encontró el ID del repartidor')
  const { data } = await client.post('/api/logistics/deliveries/assign', {
    deliveryPersonId: Number(deliveryPersonId),
    orderId: Number(orderId),
  })
  return data
}

/**
 * Marca la entrega como IN_ROUTE (repartidor recogió en sucursal).
 * PUT /api/logistics/deliveries/{id}/pickup
 *
 * @param {number|string} deliveryId
 * @returns {Promise<{id, orderId, deliveryPersonId, status, assignedAt}>}
 */
export async function markPickup(deliveryId) {
  const { data } = await client.put(`/api/logistics/deliveries/${deliveryId}/pickup`)
  return data
}

/**
 * Confirma la entrega de un pedido.
 * PUT /api/logistics/deliveries/{id}/complete
 * Cambia status → DELIVERED y registra deliveredAt.
 *
 * @param {number|string} deliveryId  ID de la entrega (no del pedido)
 * @returns {Promise<{id, orderId, deliveryPersonId, status, assignedAt, deliveredAt}>}
 */
export async function finalizeDelivery(deliveryId) {
  const { data } = await client.put(`/api/logistics/deliveries/${deliveryId}/complete`)
  return data
}

/**
 * @deprecated Usar getActiveDeliveries() y selfAssignOrder() en su lugar.
 */
export async function getDriverMapSnapshot() {
  return getActiveDeliveries()
}

/**
 * @deprecated Usar getActiveDeliveries() en su lugar.
 */
export async function getDriverCurrentOrder() {
  const deliveries = await getActiveDeliveries()
  return deliveries[0] ?? null
}

/**
 * @deprecated Usar selfAssignOrder() en su lugar.
 */
export async function acceptDriverOrder(payload) {
  const { data } = await client.post('/api/logistics/deliveries/assign', payload)
  return data
}

export async function startDriverShift() {
  return getActiveDeliveries()
}
