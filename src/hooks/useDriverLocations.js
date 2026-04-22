/**
 * useDriverLocations.js — Ubicaciones de repartidores en tiempo real (HU-09)
 *
 * Gestiona el estado de todos los repartidores activos en la zona:
 *   - ASSIGNED_TO_ME: el repartidor asignado al pedido del afiliado actual (verde)
 *   - AVAILABLE:      repartidores disponibles sin pedido asignado (amarillo)
 *   - BUSY:           repartidores con pedido de otro cliente (gris)
 *
 * Estrategia de datos:
 *   1. Intenta obtener información real del dashboard logístico.
 *   2. Genera datos mock deterministas cuando el backend no está disponible.
 *   3. Aplica variaciones de posición en cada poll para simular movimiento en vivo.
 *
 * @param {number} pollIntervalMs  Intervalo de actualización (default: 7 000 ms)
 * @returns {{
 *   drivers: DriverLocation[],
 *   assignedDriver: DriverLocation | null,
 *   isLoading: boolean,
 *   lastUpdated: Date | null,
 *   noDrivers: boolean
 * }}
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { getAffiliateLogisticsDashboard } from '../api/affiliateLogisticsService'

/** @typedef {{ id: number, name: string, lat: number, lng: number, status: 'ASSIGNED_TO_ME'|'AVAILABLE'|'BUSY', estimatedTime?: string, lastUpdate: Date }} DriverLocation */

const POLL_INTERVAL_MS = 7_000

// Posiciones base centradas en Bogotá D.C.
const MOCK_DRIVER_BASE = [
  { id: 1, name: 'Juan Pérez',        baseLat: 4.7110, baseLng: -74.0721, status: 'ASSIGNED_TO_ME', estimatedTime: '8 min' },
  { id: 2, name: 'Carlos López',      baseLat: 4.7205, baseLng: -74.0660, status: 'AVAILABLE' },
  { id: 3, name: 'María Rodríguez',   baseLat: 4.7050, baseLng: -74.0780, status: 'BUSY' },
  { id: 4, name: 'Andrés Mora',       baseLat: 4.7180, baseLng: -74.0700, status: 'AVAILABLE' },
]

/** Desplazamiento pequeño para simular movimiento (~10–50 m). */
const jitter = (base, amount = 0.0004) => base + (Math.random() - 0.5) * amount

const buildMockDrivers = (prevDrivers) => {
  if (prevDrivers.length === 0) {
    // Primera carga: sin jitter para posiciones predecibles
    return MOCK_DRIVER_BASE.map((d) => ({
      id: d.id,
      name: d.name,
      lat: d.baseLat,
      lng: d.baseLng,
      status: d.status,
      estimatedTime: d.estimatedTime ?? null,
      lastUpdate: new Date(),
    }))
  }

  // Actualizaciones: aplicar pequeño jitter a cada repartidor
  return prevDrivers.map((driver) => ({
    ...driver,
    lat: jitter(driver.lat),
    lng: jitter(driver.lng),
    lastUpdate: new Date(),
  }))
}

const getAffiliateId = () => {
  try {
    return Number(JSON.parse(localStorage.getItem('medigo_user') || '{}')?.id) || null
  } catch {
    return null
  }
}

export default function useDriverLocations(pollIntervalMs = POLL_INTERVAL_MS) {
  const [drivers, setDrivers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)
  const pollCountRef = useRef(0)

  const fetchLocations = useCallback(async () => {
    const isFirstLoad = pollCountRef.current === 0
    pollCountRef.current += 1

    try {
      // Intentar obtener datos reales del backend
      const dashboard = await getAffiliateLogisticsDashboard()

      if (dashboard?.drivers && Array.isArray(dashboard.drivers) && dashboard.drivers.length > 0) {
        // Backend devuelve datos reales: mapear y actualizar
        setDrivers(
          dashboard.drivers.map((d) => ({
            id: d.id,
            name: d.name || `Repartidor ${d.id}`,
            lat: Number(d.lat),
            lng: Number(d.lng),
            status: d.status || 'BUSY',
            estimatedTime: d.estimatedTime ?? null,
            lastUpdate: new Date(),
          }))
        )
      } else {
        // Backend no devuelve datos de repartidores: usar mock
        setDrivers((prev) => buildMockDrivers(isFirstLoad ? [] : prev))
      }
    } catch {
      // API no disponible: datos mock con movimiento simulado
      setDrivers((prev) => buildMockDrivers(isFirstLoad ? [] : prev))
    } finally {
      setLastUpdated(new Date())
      if (isFirstLoad) {
        setIsLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    fetchLocations()
    const intervalId = setInterval(fetchLocations, pollIntervalMs)
    return () => clearInterval(intervalId)
  }, [fetchLocations, pollIntervalMs])

  const assignedDriver = drivers.find((d) => d.status === 'ASSIGNED_TO_ME') ?? null
  const noDrivers = !isLoading && drivers.length === 0

  return { drivers, assignedDriver, isLoading, lastUpdated, noDrivers }
}
