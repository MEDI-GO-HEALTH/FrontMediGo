/**
 * useDriverLocationWebSocket — Gestión WebSocket de la posición del repartidor.
 *
 * Para el REPARTIDOR (MapaEntregas):
 *   - Llama a sendLocation(lat, lng) para publicar GPS en tiempo real al backend.
 *   - El backend retransmite en /topic/delivery/{deliveryId}/location.
 *
 * Para el AFILIADO (MapaPedidos):
 *   - Suscribe /topic/delivery/{deliveryId}/location.
 *   - Llama a onLocation({ lat, lng, ts }) cada vez que llega una actualización.
 *
 * Uso (repartidor):
 *   const { sendLocation, connected } = useDriverLocationWebSocket({ deliveryId })
 *
 * Uso (afiliado):
 *   const { position, connected } = useDriverLocationWebSocket({ deliveryId, onLocation })
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { Client } from '@stomp/stompjs'
import { API_CONFIG } from '../config/api'

export default function useDriverLocationWebSocket({ deliveryId, onLocation } = {}) {
  const ref = useRef({ client: null, sub: null, deliveryId, onLocation })
  const [connected, setConnected] = useState(false)
  const [position, setPosition]   = useState(null) // { lat, lng, ts }

  // Keep latest values without recreating the connection
  ref.current.deliveryId = deliveryId
  ref.current.onLocation = onLocation

  useEffect(() => {
    if (!deliveryId) return

    const r = ref.current

    const subscribe = (client) => {
      r.sub?.unsubscribe()
      r.sub = client.subscribe(`/topic/delivery/${deliveryId}/location`, ({ body }) => {
        try {
          const payload = JSON.parse(body)
          setPosition(payload)
          r.onLocation?.(payload)
        } catch (_) {
          // ignore malformed messages
        }
      })
    }

    const client = new Client({
      brokerURL: API_CONFIG.auctionWsURL, // same /ws endpoint, reuse config
      reconnectDelay: 5000,
      connectHeaders: {
        Authorization: `Bearer ${localStorage.getItem('medigo_token')}`,
      },
      onConnect: () => {
        setConnected(true)
        subscribe(client)
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
  }, [deliveryId]) // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Publica la posición GPS del repartidor al backend.
   * Solo disponible cuando connected === true.
   */
  const sendLocation = useCallback((lat, lng) => {
    const r = ref.current
    if (!r.client?.connected || !r.deliveryId) return
    const userId = localStorage.getItem('medigo_user_id')
    r.client.publish({
      destination: `/app/location/${r.deliveryId}`,
      body: JSON.stringify({ 
        lat, 
        lng, 
        ts: Date.now(),
        deliveryPersonId: userId ? Number(userId) : null
      }),
    })
  }, [])

  return { connected, position, sendLocation }
}
