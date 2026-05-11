/**
 * useOrderStatusWebSocket — Suscribe al estado del pedido en tiempo real.
 *
 * El backend publica en /topic/order/{orderId}/status cada vez que
 * el estado cambia (ASSIGNED, IN_ROUTE, DELIVERED).
 *
 * Uso:
 *   const { status, deliveryId, deliveredAt } = useOrderStatusWebSocket({ orderId })
 */

import { useEffect, useRef, useState } from 'react'
import { Client } from '@stomp/stompjs'
import { API_CONFIG } from '../config/api'

export default function useOrderStatusWebSocket({ orderId } = {}) {
  const ref = useRef({ client: null, sub: null })
  const [connected, setConnected] = useState(false)
  const [status, setStatus] = useState(null)
  const [deliveryId, setDeliveryId] = useState(null)
  const [deliveredAt, setDeliveredAt] = useState(null)

  useEffect(() => {
    if (!orderId) return

    const client = new Client({
      brokerURL: API_CONFIG.auctionWsURL,
      reconnectDelay: 5000,
      onConnect: () => {
        setConnected(true)
        ref.current.sub = client.subscribe(
          `/topic/order/${orderId}/status`,
          ({ body }) => {
            try {
              const payload = JSON.parse(body)
              if (payload.status) setStatus(payload.status)
              if (payload.deliveryId) setDeliveryId(payload.deliveryId)
              if (payload.deliveredAt) setDeliveredAt(payload.deliveredAt)
            } catch (_) {
              // ignorar mensajes malformados
            }
          }
        )
      },
      onDisconnect: () => setConnected(false),
      onStompError: () => setConnected(false),
    })

    client.activate()
    ref.current.client = client

    return () => {
      ref.current.sub?.unsubscribe()
      client.deactivate()
      ref.current.client = null
      setConnected(false)
    }
  }, [orderId])

  return { connected, status, deliveryId, deliveredAt }
}
