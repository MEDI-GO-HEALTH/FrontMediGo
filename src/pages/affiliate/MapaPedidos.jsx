/**
 * MapaPedidos.jsx — Mapa en vivo con seguimiento del pedido (HU-09/HU-10)
 *
 * HU-09: Mapa Leaflet con repartidores activos en la zona.
 * HU-10: Polling del estado del pedido activo cada 8 s.
 *        Cuando el backend devuelve status=DELIVERED → muestra panel de confirmación.
 *
 * Lee el pedido activo desde localStorage['medigo_active_order'] que guarda
 * CheckoutModal al confirmar el pedido.
 */

import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import { getOrderStatus } from '../../api/affiliateOrderService'
import client from '../../api/client'
import PageLoadingOverlay from '../../components/common/PageLoadingOverlay'
import AffiliateShell from '../../components/layout/AffiliateShell'
import useDriverLocations from '../../hooks/useDriverLocations'
import useDriverLocationWebSocket from '../../hooks/useDriverLocationWebSocket'
import useOrderStatusWebSocket from '../../hooks/useOrderStatusWebSocket'
import useCappedLoading from '../../hooks/useCappedLoading'
import '../../styles/affiliate/perfil-afiliado.css'
import '../../styles/affiliate/mapa-pedidos.css'

// ── Configuración del mapa ────────────────────────────────────────────
const BOGOTA_CENTER = [4.711, -74.0721]
const INITIAL_ZOOM = 14

// ── Colores y etiquetas por estado ───────────────────────────────────
const STATUS_CONFIG = {
  ASSIGNED_TO_ME: { color: '#22c55e', label: 'Tu repartidor', bgClass: 'driver-pin--assigned' },
  AVAILABLE:      { color: '#eab308', label: 'Disponible',    bgClass: 'driver-pin--available' },
  BUSY:           { color: '#9ca3af', label: 'Ocupado',       bgClass: 'driver-pin--busy' },
}

const STATUS_POPUP = {
  ASSIGNED_TO_ME: (name) => `Tu repartidor: ${name} — En camino`,
  AVAILABLE:      (name) => `Repartidor disponible: ${name} — Listo para entregar`,
  BUSY:           (name) => `Repartidor ocupado: ${name} — Entregando otro pedido`,
}

// ── Etiqueta legible para el estado del pedido ───────────────────────
const ORDER_STATUS_LABEL = {
  PENDING:          'Pendiente',
  CONFIRMED:        'Confirmado — esperando repartidor',
  PENDING_SHIPPING: 'Preparando envío',
  ASSIGNED:         'Repartidor asignado',
  IN_ROUTE:         'En camino',
  DELIVERED:        'Entregado',
  CANCELLED:        'Cancelado',
}

/** Crea icono Leaflet para cada estado del repartidor. */
const createDriverIcon = (status) => {
  const { bgClass } = STATUS_CONFIG[status] ?? STATUS_CONFIG.BUSY
  const pulseHtml = status === 'ASSIGNED_TO_ME' ? '<div class="driver-pin__pulse"></div>' : ''
  return L.divIcon({
    className: '',
    html: `<div class="driver-pin ${bgClass}" role="img" aria-label="${STATUS_CONFIG[status]?.label ?? 'Repartidor'}">
             ${pulseHtml}
             <span class="material-symbols-outlined" aria-hidden="true">electric_moped</span>
           </div>`,
    iconSize:    [40, 40],
    iconAnchor:  [20, 20],
    popupAnchor: [0, -24],
  })
}

const fmtTime = (date) =>
  date ? date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'

const fmtDeliveredAt = (isoStr) => {
  if (!isoStr) return '—'
  try { return new Date(isoStr).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) }
  catch { return isoStr }
}

// ── Lee el pedido activo de localStorage ─────────────────────────────
const readActiveOrder = () => {
  try {
    return JSON.parse(localStorage.getItem('medigo_active_order') || 'null')
  } catch {
    return null
  }
}

// ── Marcador individual de repartidor ────────────────────────────────
function DriverMarker({ driver }) {
  const icon = useMemo(() => createDriverIcon(driver.status), [driver.status])
  const popupText = STATUS_POPUP[driver.status]?.(driver.name) ?? driver.name
  const statusCfg = STATUS_CONFIG[driver.status] ?? STATUS_CONFIG.BUSY
  return (
    <Marker position={[driver.lat, driver.lng]} icon={icon} aria-label={popupText}>
      <Popup>
        <div className="driver-popup">
          <div className="driver-popup__dot" style={{ background: statusCfg.color }} />
          <div className="driver-popup__body">
            <p className="driver-popup__name">{driver.name}</p>
            <p className="driver-popup__status">{popupText}</p>
            {driver.estimatedTime && driver.status === 'ASSIGNED_TO_ME' && (
              <p className="driver-popup__eta">
                <span className="material-symbols-outlined">schedule</span>
                Tiempo estimado: {driver.estimatedTime}
              </p>
            )}
            <p className="driver-popup__update">Actualizado: {fmtTime(driver.lastUpdate)}</p>
          </div>
        </div>
      </Popup>
    </Marker>
  )
}

// ── Componente principal ──────────────────────────────────────────────
export default function MapaPedidos() {
  // Pedido activo leído de localStorage
  const [activeOrder, setActiveOrder] = useState(readActiveOrder)
  const orderId = activeOrder?.orderId ?? null

  // Estado del pedido
  const [orderStatus, setOrderStatus] = useState(null)
  const [deliveredAt, setDeliveredAt] = useState(null)
  const [deliveryId, setDeliveryId]   = useState(null)
  const [showToast, setShowToast]     = useState(false)
  const toastTimerRef = useRef(null)

  // ── Estado del pedido en tiempo real vía WebSocket ───────────────────
  const { status: wsStatus, deliveryId: wsDeliveryId, deliveredAt: wsDeliveredAt, connected: wsOrderConnected } =
    useOrderStatusWebSocket({ orderId })

  // ── Carga inicial del estado via HTTP (snapshot) ─────────────────────
  useEffect(() => {
    if (!orderId) return
    getOrderStatus(orderId)
      .then((result) => {
        if (result?.status) setOrderStatus(result.status)
        if (result?.deliveryId) setDeliveryId(result.deliveryId)
        if (result?.deliveredAt) setDeliveredAt(result.deliveredAt)
      })
      .catch(() => {})
  }, [orderId])

  // ── Actualizar estado cuando llega mensaje WebSocket ─────────────────
  const triggerToast = useCallback(() => {
    setShowToast(true)
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    toastTimerRef.current = setTimeout(() => setShowToast(false), 5000)
  }, [])

  useEffect(() => {
    if (!wsStatus) return
    if (wsDeliveryId) setDeliveryId(wsDeliveryId)
    setOrderStatus((prev) => {
      if (wsStatus === 'DELIVERED' && prev !== 'DELIVERED') {
        setDeliveredAt(wsDeliveredAt || new Date().toISOString())
        triggerToast()
        localStorage.removeItem('medigo_active_order')
      }
      return wsStatus
    })
  }, [wsStatus, wsDeliveryId, wsDeliveredAt, triggerToast])

  // Repartidores en tiempo real (polling liviano con orderId para marcar ASSIGNED_TO_ME)
  const { drivers, assignedDriver, isLoading, lastUpdated, noDrivers } = useDriverLocations(undefined, orderId)
  const showLoader = useCappedLoading(isLoading, 1500)

  // Posición GPS del repartidor asignado vía WebSocket
  const { position: wsDriverPos, connected: wsLocationConnected } = useDriverLocationWebSocket({
    deliveryId: deliveryId ?? null,
  })

  const orderDelivered = orderStatus === 'DELIVERED'

  // ── Debug: consulta directa al endpoint de entregas activas ──────────
  const [debugDeliveries, setDebugDeliveries] = useState(null)
  useEffect(() => {
    client.get('/api/logistics/debug/deliveries/active')
      .then(r => setDebugDeliveries(r.data))
      .catch(e => setDebugDeliveries({ error: e?.response?.status ?? e?.message }))
  }, [])

  const handleNuevoPedido = () => {
    setActiveOrder(null)
    setOrderStatus(null)
    setDeliveredAt(null)
    localStorage.removeItem('medigo_active_order')
  }

  return (
    <AffiliateShell active="map" contentMode="fluid">
      <PageLoadingOverlay visible={showLoader} message="Sincronizando mapa de repartidores..." />

      {/* Toast de entrega */}
      {showToast && (
        <div className="delivery-toast" role="status" aria-live="polite" aria-label="Notificación de entrega">
          <span className="material-symbols-outlined delivery-toast__icon">task_alt</span>
          <div>
            <p className="delivery-toast__title">¡Tu pedido ha sido entregado!</p>
            <p className="delivery-toast__sub">Revisa los detalles en tu panel de seguimiento.</p>
          </div>
          <button type="button" className="delivery-toast__close" aria-label="Cerrar notificación" onClick={() => setShowToast(false)}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
      )}

      <div className="affiliate-map-workspace">

        {/* ── Sin pedido activo ─────────────────────────────────────────── */}
        {!activeOrder && !orderDelivered ? (
          <section className="map-no-order" aria-label="Sin pedido activo">
            <span className="material-symbols-outlined map-no-order__icon">receipt_long</span>
            <h3>No tienes un pedido activo</h3>
            <p>Ve al catálogo de medicamentos, agrega productos al carrito y confirma tu pedido para ver el seguimiento aquí.</p>
          </section>

        ) : orderDelivered ? (
          /* ── Panel de entrega completada ─────────────────────────────── */
          <section className="order-delivered-panel" aria-label="Pedido entregado" role="status">
            <div className="order-delivered-animation">
              <span className="material-symbols-outlined order-delivered-icon">task_alt</span>
              <div className="order-delivered-pulse" />
            </div>
            <h2 className="order-delivered-title">¡Pedido Entregado!</h2>
            <p className="order-delivered-sub">Tu medicamento ha llegado a su destino.</p>

            {deliveredAt && (
              <div className="order-delivered-time">
                <span className="material-symbols-outlined">schedule</span>
                <span>Entregado a las <strong>{fmtDeliveredAt(deliveredAt)}</strong></span>
              </div>
            )}

            {activeOrder && (
              <div className="order-delivered-details">
                <div className="order-delivered-detail-row">
                  <span className="material-symbols-outlined">tag</span>
                  <span>Pedido {activeOrder.orderNumber ?? `#${activeOrder.orderId}`}</span>
                </div>
                <div className="order-delivered-detail-row">
                  <span className="material-symbols-outlined">electric_moped</span>
                  <span>{assignedDriver?.name ?? 'Repartidor'}</span>
                </div>
              </div>
            )}

            <p className="order-delivered-history-hint">Este pedido aparecerá en tu historial de pedidos.</p>
            <button type="button" className="order-delivered-new-btn" onClick={handleNuevoPedido}>
              <span className="material-symbols-outlined">add_shopping_cart</span>
              Hacer otro pedido
            </button>
          </section>

        ) : (
          /* ── Mapa Leaflet en vivo ─────────────────────────────────────── */
          <section className="map-viewport" aria-label="Mapa de repartidores en tiempo real">
            <div className="map-live-bar" aria-live="polite" aria-label="Estado de actualización del mapa">
              <span className="map-live-dot" aria-hidden="true" />
              <span>En vivo · {fmtTime(lastUpdated)}</span>
            </div>

            <div className="map-legend" role="complementary" aria-label="Leyenda de repartidores">
              <div className="map-legend__item"><span className="map-legend__dot map-legend__dot--assigned" />Mi repartidor</div>
              <div className="map-legend__item"><span className="map-legend__dot map-legend__dot--available" />Disponible</div>
              <div className="map-legend__item"><span className="map-legend__dot map-legend__dot--busy" />Ocupado</div>
            </div>

            <MapContainer
              center={assignedDriver ? [assignedDriver.lat, assignedDriver.lng] : BOGOTA_CENTER}
              zoom={INITIAL_ZOOM}
              className="leaflet-map"
              aria-label="Mapa de seguimiento de repartidores"
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />
              {drivers.map((driver) => {
                // Si hay posición en tiempo real por WebSocket para el repartidor asignado, usarla
                const realPos = wsDriverPos && driver.status === 'ASSIGNED_TO_ME' ? wsDriverPos : null
                const d = realPos ? { ...driver, lat: realPos.lat, lng: realPos.lng, lastUpdate: new Date(realPos.ts ?? Date.now()) } : driver
                return <DriverMarker key={driver.id} driver={d} />
              })}
            </MapContainer>

            {noDrivers && !showLoader && (
              <div className="map-no-drivers" role="status">
                <span className="material-symbols-outlined">electric_moped</span>
                <span>No hay repartidores disponibles en tu zona en este momento</span>
              </div>
            )}
          </section>
        )}

        {/* ── Panel lateral de seguimiento ─────────────────────────────── */}
        <aside className="logistics-panel">
          <div className="panel-header">
            <h3>Seguimiento de Pedido</h3>
            <p>Estado en tiempo real</p>
          </div>

          <div className="panel-body">

            {/* Sin pedido — invitar a comprar */}
            {!activeOrder && !orderDelivered && (
              <div className="panel-no-order">
                <span className="material-symbols-outlined">shopping_cart</span>
                <p>Confirma un pedido desde el catálogo para ver el seguimiento aquí.</p>
              </div>
            )}

            {/* Pedido activo — número y estado */}
            {activeOrder && (
              <section className="order-tracking-card" aria-label="Pedido activo">
                <label className="panel-label">Número de pedido</label>
                <p className="order-tracking-number">{activeOrder.orderNumber ?? `#${activeOrder.orderId}`}</p>
                <div className="order-tracking-status">
                  <span className={`order-status-dot order-status-dot--${(orderStatus ?? 'CONFIRMED').toLowerCase()}`} />
                  <span>{ORDER_STATUS_LABEL[orderStatus] ?? orderStatus ?? 'Confirmado'}</span>
                </div>
              </section>
            )}

            {/* Repartidor asignado */}
            {assignedDriver && activeOrder && !orderDelivered && (
              <section className="assigned-driver-card" aria-label="Repartidor asignado">
                <div className="assigned-driver-card__dot" />
                <div>
                  <label className="panel-label">Tu Repartidor</label>
                  <p className="assigned-driver-card__name">{assignedDriver.name}</p>
                  <div className="assigned-driver-card__meta">
                    <span className="material-symbols-outlined">electric_moped</span>
                    En camino
                    {assignedDriver.estimatedTime ? ` · llega en ${assignedDriver.estimatedTime}` : ''}
                  </div>
                </div>
              </section>
            )}

            {/* Resumen post-entrega */}
            {orderDelivered && (
              <section className="delivery-summary-card" aria-label="Resumen de entrega">
                <div className="delivery-summary-card__icon">
                  <span className="material-symbols-outlined">verified</span>
                </div>
                <div>
                  <label className="panel-label">Estado del pedido</label>
                  <p className="delivery-summary-card__status">Entregado</p>
                  {deliveredAt && (
                    <p className="delivery-summary-card__time">
                      <span className="material-symbols-outlined">schedule</span>
                      {fmtDeliveredAt(deliveredAt)}
                    </p>
                  )}
                </div>
              </section>
            )}

            {/* Contador de repartidores activos */}
            {!isLoading && !orderDelivered && (
              <section className="drivers-summary" aria-label="Resumen de repartidores">
                <div className="drivers-summary__item">
                  <span className="map-legend__dot map-legend__dot--available" style={{ display: 'inline-block' }} />
                  <span>{drivers.filter((d) => d.status === 'AVAILABLE').length} disponibles</span>
                </div>
                <div className="drivers-summary__item">
                  <span className="map-legend__dot map-legend__dot--busy" style={{ display: 'inline-block' }} />
                  <span>{drivers.filter((d) => d.status === 'BUSY').length} ocupados</span>
                </div>
              </section>
            )}
          </div>
        </aside>
      </div>

      {/* ── Panel de diagnóstico WebSocket (visible en móvil) ─────────── */}
      {orderId && (
        <details
          style={{
            position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999,
            background: '#111', color: '#0f0', fontFamily: 'monospace', fontSize: 12,
            padding: '6px 10px', maxHeight: '40vh', overflowY: 'auto',
          }}
        >
          <summary style={{ cursor: 'pointer', color: '#0f0', fontWeight: 'bold' }}>
            🔌 WS Debug (toca para expandir)
          </summary>
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {JSON.stringify({
              wsUrl: (typeof window !== 'undefined' ? window.__WS_URL__ : null) || 'ver api.js',
              orderId,
              deliveryId,
              orderWS: wsOrderConnected ? 'CONECTADO' : 'DESCONECTADO',
              locationWS: wsLocationConnected ? 'CONECTADO' : 'DESCONECTADO',
              wsOrderStatus: wsStatus,
              orderStatus,
              driversCount: drivers.length,
              drivers: drivers.map(d => ({ id: d.id, name: d.name, status: d.status, orderId: d.orderId })),
              assignedDriver: assignedDriver ? { id: assignedDriver.id, name: assignedDriver.name, status: assignedDriver.status } : null,
              wsDriverPos,
              debugActiveDeliveries: debugDeliveries,
            }, null, 2)}
          </pre>
        </details>
      )}
    </AffiliateShell>
  )
}
