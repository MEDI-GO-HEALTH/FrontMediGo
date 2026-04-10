/**
 * useAuctionWebSocket — Hook para actualización en tiempo real de subastas.
 *
 * Establece una única conexión STOMP con el backend y gestiona las
 * suscripciones a tres topics:
 *
 *   /topic/auctions            → precio actual de todas las subastas activas
 *   /topic/auction/{id}        → estado completo de una subasta concreta
 *   /topic/auction/{id}/bids   → nueva puja registrada en esa subasta
 *
 * La URL de WebSocket se deriva automáticamente de API_CONFIG.baseURL:
 *   http://localhost:8080/api  →  ws://localhost:8080/ws
 *   https://gateway.azure.com  →  wss://gateway.azure.com/ws
 *
 * @param {object} options
 * @param {string|number|null} options.auctionId  – ID de la subasta seleccionada
 * @param {function} options.onGlobalUpdate  – llamado con AuctionPriceUpdateMessage del topic global
 * @param {function} options.onAuctionUpdate – llamado con (id, AuctionPriceUpdateMessage)
 * @param {function} options.onBidPlaced     – llamado con (id, BidPlacedMessage)
 */

import { useEffect, useRef } from 'react'
import { Client } from '@stomp/stompjs'
import { API_CONFIG } from '../config/api'

function getWsUrl() {
  // Elimina el sufijo /api y cambia http(s) por ws(s)
  const httpBase = API_CONFIG.baseURL.replace(/\/api\/?$/, '')
  return httpBase.replace(/^http/, 'ws') + '/ws'
}

function safeParse(body) {
  try {
    return JSON.parse(body)
  } catch {
    return null
  }
}

export default function useAuctionWebSocket({ auctionId, onGlobalUpdate, onAuctionUpdate, onBidPlaced }) {
  // Un único ref acumula el estado mutable del hook sin generar re-renders
  const ref = useRef({
    client: null,
    subs: { global: null, auction: null, bids: null },
    auctionId,
    cb: { onGlobalUpdate, onAuctionUpdate, onBidPlaced },
    resubscribeAuction: null,
  })

  // Mantiene callbacks y auctionId frescos en cada render (sin recrear la conexión)
  useEffect(() => {
    ref.current.auctionId = auctionId
    ref.current.cb = { onGlobalUpdate, onAuctionUpdate, onBidPlaced }
  }, [auctionId, onGlobalUpdate, onAuctionUpdate, onBidPlaced])

  // ── Conexión STOMP (solo al montar el componente) ─────────────────────
  useEffect(() => {
    const r = ref.current

    function resubscribeAuction(id) {
      r.subs.auction?.unsubscribe()
      r.subs.bids?.unsubscribe()
      r.subs.auction = null
      r.subs.bids = null

      if (!id || !r.client?.connected) return

      r.subs.auction = r.client.subscribe(`/topic/auction/${id}`, ({ body }) => {
        const msg = safeParse(body)
        if (msg) r.cb.onAuctionUpdate?.(id, msg)
      })

      r.subs.bids = r.client.subscribe(`/topic/auction/${id}/bids`, ({ body }) => {
        const msg = safeParse(body)
        if (msg) r.cb.onBidPlaced?.(id, msg)
      })
    }

    // Guardamos la función para poder usarla desde el segundo useEffect
    r.resubscribeAuction = resubscribeAuction

    const client = new Client({
      brokerURL: getWsUrl(),
      reconnectDelay: 5000,
      onConnect: () => {
        // Topic global: siempre activo mientras el componente esté montado
        r.subs.global?.unsubscribe()
        r.subs.global = client.subscribe('/topic/auctions', ({ body }) => {
          const msg = safeParse(body)
          if (msg) r.cb.onGlobalUpdate?.(msg)
        })

        // Topics por subasta con el ID actual en el momento de la conexión
        resubscribeAuction(r.auctionId)
      },
    })

    client.activate()
    r.client = client

    return () => {
      client.deactivate()
      r.client = null
    }
  }, [])

  // ── Re-suscripción cuando cambia la subasta seleccionada ─────────────
  useEffect(() => {
    // Si el cliente ya está conectado, re-suscribimos de inmediato.
    // Si todavía está conectando, el onConnect usará ref.current.auctionId.
    const r = ref.current
    if (r.client?.connected) {
      r.resubscribeAuction?.(auctionId)
    }
  }, [auctionId])
}
