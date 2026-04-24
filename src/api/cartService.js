/**
 * cartService.js — Gestión de Carrito de Compras (HU-03)
 *
 * Endpoints:
 * - POST /api/orders/cart/add  → Agregar medicamento al carrito
 * - GET  /api/orders/cart      → Obtener carrito actual
 */

import client from './client'

const ORDERS_BASE = '/api/orders'

/**
 * Agrega un medicamento al carrito. Si ya existe, incrementa la cantidad.
 * El backend valida stock disponible y lanza error si no hay suficiente.
 *
 * @param {{ affiliateId: number, branchId: number, medicationId: number, quantity: number }} params
 * @returns {Promise<CartResponse>}
 */
export const addToCart = async ({ affiliateId, branchId, medicationId, quantity = 1 }) => {
  const response = await client.post(`${ORDERS_BASE}/cart/add`, {
    affiliateId: Number(affiliateId),
    branchId: Number(branchId),
    medicationId: Number(medicationId),
    quantity: Number(quantity),
  })
  return response.data
}

/**
 * Obtiene el carrito pendiente del afiliado en una sucursal.
 * Retorna null si no existe carrito.
 *
 * @param {{ affiliateId: number, branchId: number }} params
 * @returns {Promise<CartResponse|null>}
 */
export const getCart = async ({ affiliateId, branchId }) => {
  const response = await client.get(`${ORDERS_BASE}/cart`, {
    params: {
      affiliateId: Number(affiliateId),
      branchId: Number(branchId),
    },
  })
  return response.data
}
