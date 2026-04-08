/**
 * inventarioService.js — Gestión de Inventario (MVP)
 *
 * Endpoints reales vía API Gateway:
 * - GET  /api/medications/search?name={name}
 * - GET  /api/medications/branch/{branchId}/stock
 * - GET  /api/medications/branches
 * - GET  /api/medications/{medicationId}/availability/branch/{branchId}
 * - POST /api/medications
 * - PUT  /api/medications/{medicationId}/branch/{branchId}/stock
 */

import client from './client'

const MEDICATIONS_BASE = '/api/medications'

const toArray = (payload) => {
  if (Array.isArray(payload)) {
    return payload
  }

  if (Array.isArray(payload?.data)) {
    return payload.data
  }

  if (Array.isArray(payload?.items)) {
    return payload.items
  }

  return []
}

export const searchMedicationsByName = async (name) => {
  const response = await client.get(`${MEDICATIONS_BASE}/search`, {
    params: { name: String(name || '').trim() },
  })
  return toArray(response.data)
}

export const getBranchStock = async (branchId) => {
  const response = await client.get(`${MEDICATIONS_BASE}/branch/${branchId}/stock`)
  return toArray(response.data)
}

export const getBranchesWithMedications = async () => {
  const response = await client.get(`${MEDICATIONS_BASE}/branches`)
  return toArray(response.data)
}

export const getMedicationAvailabilityByBranch = async (medicationId, branchId) => {
  const response = await client.get(`${MEDICATIONS_BASE}/${medicationId}/availability/branch/${branchId}`)
  return response.data
}

export const createMedicamento = async (payload) => {
  const response = await client.post(`${MEDICATIONS_BASE}`, payload)
  return response.data
}

export const updateMedicamentoStock = async ({ medicationId, branchId, quantity }) => {
  const response = await client.put(`${MEDICATIONS_BASE}/${medicationId}/branch/${branchId}/stock`, {
    medicationId,
    quantity,
  })
  return response.data
}

/**
 * Compatibilidad con pantalla actual de Inventario.
 * Permite consultar stock por sede o búsqueda por nombre.
 */
export const getInventario = async (params = {}) => {
  const response = await client.get(`${MEDICATIONS_BASE}`, {
    params: {
      branchId: params?.branchId,
      q: params?.name,
      page: params?.page || 1,
      limit: params?.limit || 20,
    },
  })

  const payload = response?.data
  if (Array.isArray(payload)) {
    return payload
  }

  if (Array.isArray(payload?.items)) {
    return payload.items
  }

  return []
}

/**
 * No existe endpoint dedicado de métricas en backend/gateway.
 * Se construyen métricas básicas a partir del inventario consolidado.
 */
export const getInventarioStats = async (params = {}) => {
  const response = await client.get(`${MEDICATIONS_BASE}/stats`, {
    params: {
      branchId: params?.branchId,
    },
  })
  return response.data
}

// Alias para compatibilidad con código legado.
export const updateMedicamento = async (id, data) =>
  updateMedicamentoStock({ medicationId: id, branchId: data?.branchId, quantity: data?.quantity })
