/**
 * useMedicationAvailability.js — Hook para disponibilidad en tiempo real (HU-04)
 *
 * Consulta la disponibilidad de un medicamento en todas las sucursales y la
 * refresca cada `pollIntervalMs` ms para simular datos en tiempo real.
 *
 * Cuando la API real falla o el medicationId es nulo, genera datos mock
 * deterministas basados en las sucursales cargadas.
 *
 * @param {number|null}  medicationId    ID del medicamento a consultar
 * @param {Array}        branches        Lista de sucursales [{ id, name }]
 * @param {number}       pollIntervalMs  Intervalo de refresco (default: 15 000 ms)
 *
 * @returns {{
 *   availability: Array<{branchId, branchName, quantity, isAvailable, status}>,
 *   medicationName: string,
 *   totalAvailable: number,
 *   branchesWithStock: number,
 *   isLoading: boolean,
 *   lastUpdated: Date|null,
 *   isPolling: boolean,
 *   refresh: () => void
 * }}
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { getMedicationAvailabilityAllBranches } from '../api/inventarioService'

const POLL_INTERVAL_MS = 15_000

/**
 * Genera disponibilidad mock cuando la API no está disponible.
 * Los datos son deterministas para que sean predecibles en pruebas.
 */
const buildMockAvailability = (branches) =>
  branches.map((branch) => {
    // Alterna disponible/no disponible de forma predecible por branchId
    const quantity = branch.id % 2 === 0 ? 0 : (branch.id * 13) % 45 + 5
    return {
      branchId: branch.id,
      branchName: branch.name,
      quantity,
      isAvailable: quantity > 0,
      status: quantity > 0 ? 'Disponible' : 'No disponible',
    }
  })

export default function useMedicationAvailability(medicationId, branches, pollIntervalMs = POLL_INTERVAL_MS) {
  const [availability, setAvailability] = useState([])
  const [medicationName, setMedicationName] = useState('')
  const [totalAvailable, setTotalAvailable] = useState(0)
  const [branchesWithStock, setBranchesWithStock] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [isPolling, setIsPolling] = useState(false)

  // Mapa branchId → branchName para enriquecer la respuesta de la API
  const branchMapRef = useRef({})
  useEffect(() => {
    const map = {}
    branches.forEach((b) => {
      map[b.id] = b.name
    })
    branchMapRef.current = map
  }, [branches])

  const fetchAvailability = useCallback(
    async (silent = false) => {
      if (!medicationId) {
        return
      }

      if (!silent) {
        setIsLoading(true)
      } else {
        setIsPolling(true)
      }

      try {
        const result = await getMedicationAvailabilityAllBranches(medicationId)

        const branchMap = branchMapRef.current
        const perBranch = (result?.availabilityByBranch ?? []).map((item) => ({
          branchId: item.branchId,
          branchName: branchMap[item.branchId] || `Sucursal ${item.branchId}`,
          quantity: Number(item.quantity ?? 0),
          isAvailable: Boolean(item.isAvailable),
          status: item.availabilityStatus || (item.isAvailable ? 'Disponible' : 'No disponible'),
        }))

        setAvailability(perBranch)
        setMedicationName(result?.medicationName || '')
        setTotalAvailable(Number(result?.totalAvailable ?? 0))
        setBranchesWithStock(Number(result?.branchesWithStock ?? 0))
      } catch {
        // API no disponible → usar datos mock como fallback (simulación en tiempo real)
        if (branches.length > 0) {
          const mock = buildMockAvailability(branches)
          setAvailability(mock)
          setTotalAvailable(mock.reduce((s, i) => s + i.quantity, 0))
          setBranchesWithStock(mock.filter((i) => i.isAvailable).length)
        }
      } finally {
        setLastUpdated(new Date())
        setIsLoading(false)
        setIsPolling(false)
      }
    },
    [medicationId, branches]
  )

  // Carga inicial y arranque del intervalo de polling
  useEffect(() => {
    if (!medicationId || branches.length === 0) {
      setAvailability([])
      return
    }

    fetchAvailability(false)

    const intervalId = setInterval(() => fetchAvailability(true), pollIntervalMs)
    return () => clearInterval(intervalId)
  }, [medicationId, branches, pollIntervalMs, fetchAvailability])

  return {
    availability,
    medicationName,
    totalAvailable,
    branchesWithStock,
    isLoading,
    lastUpdated,
    isPolling,
    refresh: () => fetchAvailability(false),
  }
}
