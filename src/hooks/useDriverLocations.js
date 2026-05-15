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
          dashboard.drivers.map((d) => {
            // Si el backend ya marcó ASSIGNED_TO_ME úsalo; si no, detectar por orderId coincidente
            const status = d.status === 'ASSIGNED_TO_ME' || (orderId != null && d.orderId === orderId)
              ? 'ASSIGNED_TO_ME'
              : (d.status || 'BUSY')
            return {
              id: d.id,
              name: d.name || `Repartidor ${d.id}`,
              lat: Number(d.lat),
              lng: Number(d.lng),
              status,
              deliveryId: d.deliveryId ?? `u${d.id}`,
              estimatedTime: d.estimatedTime ?? null,
              orderId: d.orderId ?? null,
              lastUpdate: new Date(),
            }
          })
        )
      } else {
        setDrivers([])
      }
    } catch {
      // API no disponible → mantener lista actual sin borrarla
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
