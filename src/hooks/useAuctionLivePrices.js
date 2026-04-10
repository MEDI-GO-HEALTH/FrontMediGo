/**
 * useAuctionLivePrices
 *
 * Se suscribe al topic STOMP /topic/auctions y notifica cada vez que
 * una puja exitosa cambia el "monto actual" de cualquier subasta activa.
 *
 * Diseño:
 *  - Una sola conexión WebSocket por componente montado.
 *  - cbRef mantiene el callback fresco sin reabrir la conexión.
 *  - Compatible con React StrictMode: el flag `active` descarta mensajes
 *    de la instancia descartada durante el doble-montaje de desarrollo.
 *
 * URL WebSocket derivada de API_CONFIG.baseURL:
 *   http://localhost:8080/api  →  ws://localhost:8080/ws
 *   https://gateway.azure.com  →  wss://gateway.azure.com/ws
 *
 * @param {(auctionId: string, newPrice: number) => void} onPriceUpdate
 */

import { useEffect, useRef } from 'react'
import { Client } from '@stomp/stompjs'
import { API_CONFIG } from '../config/api'

function getWsUrl() {
  const base = API_CONFIG.baseURL.replace(/\/api\/?$/, '')
  return base.replace(/^http/, 'ws') + '/ws'
}

export default function useAuctionLivePrices(onPriceUpdate) {
  // Ref para mantener el callback siempre fresco sin recrear la conexión
  const cbRef = useRef(onPriceUpdate)

  useEffect(() => {
    cbRef.current = onPriceUpdate
  }, [onPriceUpdate])

  useEffect(() => {
    let active = true // guard contra el doble-montaje de React StrictMode
    const wsUrl = getWsUrl()
    console.log('[STOMP] Conectando →', wsUrl)

    const client = new Client({
      brokerURL: wsUrl,
      reconnectDelay: 5000,

      onConnect: () => {
        if (!active) return
        console.log('[STOMP] ✓ Conectado — suscribiéndose a /topic/auctions')

        client.subscribe('/topic/auctions', ({ body }) => {
          if (!active) return
          try {
            const msg = JSON.parse(body)
            if (
              msg.eventType === 'BID_PLACED' &&
              msg.auctionId != null &&
              msg.currentPrice != null
            ) {
              console.log(
                `[STOMP] BID_PLACED subasta=${msg.auctionId} precio=${msg.currentPrice}`,
              )
              cbRef.current?.(String(msg.auctionId), Number(msg.currentPrice))
            }
          } catch (e) {
            console.warn('[STOMP] Error parseando mensaje:', e)
          }
        })
      },

      onStompError: (frame) => {
        console.error('[STOMP] Error STOMP:', frame.headers?.message)
      },
      onWebSocketError: () => {
        console.error('[STOMP] No se pudo conectar a', wsUrl, '— ¿está corriendo el backend?')
      },
      onDisconnect: () => {
        if (active) console.log('[STOMP] Desconectado — reconectando en 5 s…')
      },
    })

    client.activate()

    return () => {
      active = false
      console.log('[STOMP] Limpiando conexión')
      client.deactivate()
    }
  }, [])
}
