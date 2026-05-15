/**
 * useUserLocationWebSocket — Gestión WebSocket de la posición del AFILIADO (cliente).
 *
 * El afiliado envía su posición para que el repartidor la vea en vivo.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { Client } from '@stomp/stompjs'
import { API_CONFIG } from '../config/api'

export default function useUserLocationWebSocket({ orderId, onLocation } = {}) {
  const ref = useRef({ client: null, sub: null, orderId, onLocation })
  const [connected, setConnected] = useState(false)
  const [position, setPosition]   = useState(null) // { lat, lng, ts }

  ref.current.orderId = orderId
  ref.current.onLocation = onLocation

  useEffect(() => {
    if (!orderId) return

    const r = ref.current

    const client = new Client({
      brokerURL: API_CONFIG.auctionWsURL,
      reconnectDelay: 5000,
      connectHeaders: {
        Authorization: `Bearer ${localStorage.getItem('medigo_token')}`,
      },
      onConnect: () => {
        setConnected(true)
        // Suscribirse para recibir la ubicación del usuario (usado por el repartidor)
        r.sub = client.subscribe(`/topic/order/${orderId}/user-location`, ({ body }) => {
          try {
            const payload = JSON.parse(body)
            setPosition(payload)
            r.onLocation?.(payload)
          } catch (_) { /* ignore */ }
        })
      },
      onDisconnect: () => setConnected(false),
      onStompError: () => setConnected(false),
    })

    client.activate()
    r.client = client

    return () => {
      r.sub?.unsubscribe()
      client.deactivate()
      r.client = null
      setConnected(false)
    }
  }, [orderId])

  const sendUserLocation = useCallback((lat, lng) => {
    const r = ref.current
    if (!r.client?.connected || !r.orderId) return
    r.client.publish({
      destination: `/app/user-location/${r.orderId}`,
      body: JSON.stringify({ lat, lng, ts: Date.now() }),
    })
  }, [])

  return { connected, position, sendUserLocation }
}
