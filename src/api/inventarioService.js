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
  const sanitized = String(name || '').trim()
  
  // 🛡️ Client-side Security Check for Demo
  const sqlInjectionPattern = /[-'";|\/\*]/
  if (sqlInjectionPattern.test(sanitized)) {
    console.warn('⚠️ Intento de SQL Injection detectado en el cliente:', sanitized)
    throw new Error('Caracteres no permitidos en la búsqueda por motivos de seguridad.')
  }

  const response = await client.get(`${MEDICATIONS_BASE}/search`, {
    params: { name: sanitized },
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

/**
 * Obtiene la disponibilidad de un medicamento en TODAS las sucursales (HU-04).
 *
 * Respuesta del backend:
 * {
 *   medicationId, medicationName, description, unit,
 *   availabilityByBranch: [{ branchId, quantity, isAvailable, availabilityStatus }],
 *   totalAvailable, branchesWithStock
 * }
 *
 * @param {number} medicationId
 * @returns {Promise<MedicationAvailabilityResponse>}
 */
export const getMedicationAvailabilityAllBranches = async (medicationId) => {
  const response = await client.get(`${MEDICATIONS_BASE}/${medicationId}/availability/branches`)
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
  const sanitized = String(params?.name || '').trim()

  // 🛡️ Client-side Security Check for Demo
  const sqlInjectionPattern = /[-'";|\/\*]/
  if (sanitized && sqlInjectionPattern.test(sanitized)) {
    console.warn('⚠️ Intento de SQL Injection detectado en el cliente:', sanitized)
    throw new Error('Caracteres no permitidos en la búsqueda por motivos de seguridad.')
  }

  const response = await client.get(`${MEDICATIONS_BASE}`, {
    params: {
      branchId: params?.branchId,
      q: sanitized,
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
