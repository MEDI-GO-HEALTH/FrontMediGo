/**
 * affiliateOrderService.js — Pedidos del afiliado
 *
 * Cubre el flujo completo:
 *  1. confirmOrder()  → POST /api/orders/{branchId}/confirm
 *                       Convierte el carrito PENDING en orden CONFIRMED
 *  2. getOrderStatus()→ GET /api/logistics/orders/{orderId}/status
 *                       Polling del estado para saber cuándo llega el pedido
 *  3. getMyOrders()   → GET /api/orders/affiliate/{affiliateId}
 *                       Historial de órdenes del afiliado
 */
import client from './client'

const getAffiliateId = () => {
  try {
    return Number(JSON.parse(localStorage.getItem('medigo_user') || '{}')?.id) || null
  } catch {
    return null
  }
}

/**
 * Confirma el carrito activo convirtiéndolo en una orden CONFIRMED.
 *
 * Llama a POST /api/orders/{branchId}/confirm?affiliateId={affiliateId}
 * con la dirección de entrega.
 *
 * @param {{ branchId: number, street: string, streetNumber: string, city: string, commune: string, latitude?: number, longitude?: number }} payload
 * @returns {Promise<{ id: number, orderNumber: string, status: string, totalPrice: number, items: Array }>}
 */
export async function confirmOrder({ branchId, street, streetNumber, city, commune, latitude, longitude }) {
  const affiliateId = getAffiliateId()
  if (!affiliateId) throw new Error('No se encontró el ID del afiliado')

  const { data } = await client.post(
    `/api/orders/${branchId}/confirm`,
    { street, streetNumber, city, commune, latitude, longitude },
    { params: { affiliateId } },
  )
  return data
}

/**
 * Consulta el estado actual de una orden específica.
 * HU-10: el afiliado sabe cuándo su pedido fue marcado DELIVERED.
 *
 * @param {number} orderId
 * @returns {Promise<{ orderId: number, status: string, deliveredAt: string|null }>}
 */
export async function getOrderStatus(orderId) {
  const { data } = await client.get(`/api/logistics/orders/${orderId}/status`)
  return data
}

/**
 * Obtiene todas las órdenes del afiliado autenticado.
 *
 * @returns {Promise<Array>}
 */
export async function getMyOrders() {
  const affiliateId = getAffiliateId()
  if (!affiliateId) return []
  const { data } = await client.get(`/api/orders/affiliate/${affiliateId}`)
  return Array.isArray(data) ? data : []
}
