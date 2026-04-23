/**
 * affiliateOrderService.js — Consulta de estado de pedidos del afiliado (HU-10)
 *
 * Permite al panel del cliente saber cuando su pedido fue marcado como ENTREGADO
 * por el repartidor, para ocultar el mapa en vivo y mostrar la hora de entrega.
 */
import client from './client'

const ENDPOINTS = {
  ordersByAffiliate: '/api/orders',                 // GET ?affiliateId=X → lista de órdenes
  orderStatus: (orderId) => `/api/logistics/orders/${orderId}/status`,  // GET → estado del pedido
}

/**
 * Obtiene todas las órdenes del afiliado (cualquier estado).
 * Útil para detectar si la orden más reciente cambió a DELIVERED.
 *
 * @param {number} affiliateId
 * @returns {Promise<Array>} lista de órdenes
 */
export async function getAffiliateOrders(affiliateId) {
  const { data } = await client.get(ENDPOINTS.ordersByAffiliate, {
    params: { affiliateId },
  })
  return Array.isArray(data) ? data : []
}

/**
 * Consulta el estado actual de un pedido específico.
 * HU-10 Escenario 2: cliente consulta si su pedido fue entregado.
 *
 * @param {number} orderId
 * @returns {Promise<{orderId: number, status: string, deliveredAt: string}>}
 */
export async function getOrderStatus(orderId) {
  const { data } = await client.get(ENDPOINTS.orderStatus(orderId))
  return data
}

export const affiliateOrderEndpoints = ENDPOINTS
