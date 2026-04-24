/**
 * useDriverLocations.js — Ubicaciones de repartidores en tiempo real (HU-09)
 *
 * Obtiene repartidores activos del dashboard logístico del backend.
 * Si el backend no devuelve datos, la lista queda vacía — sin mocks.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { getAffiliateLogisticsDashboard } from '../api/affiliateLogisticsService'

/** @typedef {{ id: number, name: string, lat: number, lng: number, status: 'ASSIGNED_TO_ME'|'AVAILABLE'|'BUSY', estimatedTime?: string, lastUpdate: Date }} DriverLocation */

const POLL_INTERVAL_MS = 7_000

export default function useDriverLocations(pollIntervalMs = POLL_INTERVAL_MS, orderId = null) {
  const [drivers, setDrivers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)
  const pollCountRef = useRef(0)

  const fetchLocations = useCallback(async () => {
    const isFirstLoad = pollCountRef.current === 0
    pollCountRef.current += 1

    try {
      const dashboard = await getAffiliateLogisticsDashboard(orderId)

      if (dashboard?.drivers && Array.isArray(dashboard.drivers) && dashboard.drivers.length > 0) {
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
        // Sin datos reales → lista vacía
        setDrivers([])
      }
    } catch {
      // API no disponible → lista vacía
      setDrivers([])
    } finally {
      setLastUpdated(new Date())
      if (isFirstLoad) setIsLoading(false)
    }
  }, [orderId])

  useEffect(() => {
    fetchLocations()
    const intervalId = setInterval(fetchLocations, pollIntervalMs)
    return () => clearInterval(intervalId)
  }, [fetchLocations, pollIntervalMs])

  const assignedDriver = drivers.find((d) => d.status === 'ASSIGNED_TO_ME') ?? null
  const noDrivers = !isLoading && drivers.length === 0

  return { drivers, assignedDriver, isLoading, lastUpdated, noDrivers }
}
