/**
 * MapaEntregas.jsx — Mapa en vivo para repartidores
 *
 * Flujo real completo:
 *  1. Sin pedido activo → muestra lista de pedidos CONFIRMED disponibles
 *  2. Repartidor elige uno → POST /api/logistics/deliveries/assign (auto-asignación)
 *  3. Pedido asignado (ASSIGNED) → botón "Confirmar recogida en sucursal"
 *  4. Recogido (PICKED_UP visual) → botón "Confirmar entrega al cliente"
 *  5. PUT /api/logistics/deliveries/{id}/complete → DELIVERED → panel de éxito
 */

import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import { useNavigate } from 'react-router'
import {
  finalizeDelivery,
  getActiveDeliveries,
  getPendingOrders,
  markPickup,
  selfAssignOrder,
  startDriverShift,
} from '../../api/driverDeliveryService'
import MedigoSidebarBrand from '../../components/common/MedigoSidebarBrand'
import PageLoadingOverlay from '../../components/common/PageLoadingOverlay'
import useCappedLoading from '../../hooks/useCappedLoading'
import useDriverLocationWebSocket from '../../hooks/useDriverLocationWebSocket'
import '../../styles/driver/mapa-entregas.css'

// ── Config ────────────────────────────────────────────────────────────
const BOGOTA_CENTER  = [4.711, -74.0721]
const INITIAL_ZOOM   = 13
const POLL_INTERVAL  = 15_000   // refresca pedidos disponibles cada 15 s

// ── Íconos Leaflet ───────────────────────────────────────────────────
const pickupIcon = L.divIcon({
  className: '',
  html: `<div class="driver-map-pin driver-map-pin--pickup" role="img" aria-label="Sucursal de recogida">
           <span class="material-symbols-outlined">warehouse</span>
         </div>`,
  iconSize: [40, 40], iconAnchor: [20, 40], popupAnchor: [0, -44],
})

const destinationIcon = L.divIcon({
  className: '',
  html: `<div class="driver-map-pin driver-map-pin--destination" role="img" aria-label="Destino de entrega">
           <span class="material-symbols-outlined">local_hospital</span>
         </div>`,
  iconSize: [40, 40], iconAnchor: [20, 40], popupAnchor: [0, -44],
})

const driverIcon = L.divIcon({
  className: '',
  html: `<div class="driver-map-pin driver-map-pin--self" role="img" aria-label="Tu ubicación">
           <div class="driver-map-pin__pulse"></div>
           <span class="material-symbols-outlined">electric_moped</span>
         </div>`,
  iconSize: [44, 44], iconAnchor: [22, 22], popupAnchor: [0, -26],
})

// ── Sub-componente: centra el mapa ───────────────────────────────────
function MapCenter({ center }) {
  const map = useMap()
  useEffect(() => {
    if (center) map.setView(center, map.getZoom(), { animate: true })
  }, [center, map])
  return null
}

// ── Formateadores ────────────────────────────────────────────────────
const fmtTime = (date) =>
  date ? date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : ''

const fmtPrice = (v) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(v) || 0)

// ── Extrae dirección de entrega del pedido ───────────────────────────
const orderAddress = (order) =>
  [order?.street, order?.streetNumber, order?.commune, order?.city]
    .filter(Boolean).join(', ') || 'Dirección no especificada'

// ── Componente principal ─────────────────────────────────────────────
export default function MapaEntregas() {
  const navigate = useNavigate()

  // Estado de pedidos disponibles (CONFIRMED, sin repartidor)
  const [pendingOrders, setPendingOrders]   = useState([])
  const [loadingOrders, setLoadingOrders]   = useState(false)

  // Pedido/entrega activa del repartidor
  const [activeDelivery, setActiveDelivery] = useState(null)   // objeto Delivery del backend
  const [activeOrder, setActiveOrder]       = useState(null)   // objeto Order seleccionado

  // Estado local del paso de entrega
  // 'ASSIGNED' | 'PICKED_UP' | 'DELIVERED'
  const [deliveryStep, setDeliveryStep]     = useState(null)
  const [deliveredAt, setDeliveredAt]       = useState(null)

  const [loading, setLoading]     = useState(false)
  const [actionError, setActionError] = useState('')
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [pendingAction, setPendingAction]   = useState(null)   // 'PICKED_UP' | 'DELIVERED'

  const [driverPos, setDriverPos]   = useState(BOGOTA_CENTER)
  const watchRef  = useRef(null)
  const pollRef   = useRef(null)

  // Ref estable para sendLocation — evita cambio de tamaño del array de deps en useEffect
  const sendLocationRef = useRef(null)

  // Transmite la posición GPS del repartidor al backend vía WebSocket
  const { sendLocation } = useDriverLocationWebSocket({
    deliveryId: activeDelivery?.id ?? null,
  })

  // Mantener la referencia actualizada sin recrear el geolocation watcher
  sendLocationRef.current = sendLocation

  const showLoader = useCappedLoading(loading || loadingOrders, 3000)

  // ── Geolocalización ──────────────────────────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) return

    const onSuccess = (pos) => {
      const { latitude, longitude } = pos.coords
      setDriverPos([latitude, longitude])
      sendLocationRef.current?.(latitude, longitude)
    }

    const onError = () => {
      // Geolocalización denegada o no disponible — mantener posición actual
    }

    const opts = { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }

    // Obtener posición inicial de inmediato
    navigator.geolocation.getCurrentPosition(onSuccess, onError, opts)

    // Seguir actualizando con watchPosition
    watchRef.current = navigator.geolocation.watchPosition(onSuccess, onError, opts)

    return () => {
      if (watchRef.current != null) navigator.geolocation.clearWatch(watchRef.current)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const mapCenter = useMemo(() => driverPos ?? BOGOTA_CENTER, [driverPos])

  // ── Carga inicial: entrega activa + pedidos disponibles ──────────
  useEffect(() => {
    let mounted = true
    const init = async () => {
      setLoadingOrders(true)
      try {
        const [deliveries, orders] = await Promise.all([
          getActiveDeliveries(),
          getPendingOrders(),
        ])
        if (!mounted) return

        // Si ya tiene una entrega activa, restaurar el estado
        if (deliveries.length > 0) {
          const d = deliveries[0]
          setActiveDelivery(d)
          setDeliveryStep(d.status === 'IN_ROUTE' ? 'PICKED_UP' : 'ASSIGNED')
          // Reconstruir activeOrder mínimo desde la entrega
          setActiveOrder({ id: d.orderId, orderNumber: `#${d.orderId}` })
        } else {
          setPendingOrders(orders)
        }
      } catch {
        // mantener estado vacío
      } finally {
        if (mounted) setLoadingOrders(false)
      }
    }
    init()
    return () => { mounted = false }
  }, [])

  // ── Polling de pedidos disponibles (solo si no hay entrega activa) ─
  useEffect(() => {
    if (activeDelivery) return

    const refresh = async () => {
      try {
        const orders = await getPendingOrders()
        setPendingOrders(orders)
      } catch { /* ignorar */ }
    }

    pollRef.current = setInterval(refresh, POLL_INTERVAL)
    return () => clearInterval(pollRef.current)
  }, [activeDelivery])

  // ── El repartidor elige un pedido → confirma antes de asignarse ──
  const handleSelectOrder = useCallback((order) => {
    setActiveOrder(order)
    setPendingAction('ACCEPT')
    setShowConfirmModal(true)
    setActionError('')
  }, [])

  // ── Confirmar modal ──────────────────────────────────────────────
  const handleConfirmAction = useCallback(async () => {
    setShowConfirmModal(false)
    setLoading(true)
    setActionError('')

    try {
      if (pendingAction === 'ACCEPT') {
        // Auto-asignación: POST /api/logistics/deliveries/assign
        const delivery = await selfAssignOrder(activeOrder.id)
        setActiveDelivery(delivery)
        setDeliveryStep('ASSIGNED')
        setPendingOrders([])

      } else if (pendingAction === 'PICKED_UP') {
        // Marca IN_ROUTE en el backend (recogida en sucursal)
        const deliveryId = activeDelivery?.id
        if (deliveryId) await markPickup(deliveryId)
        setDeliveryStep('PICKED_UP')

      } else if (pendingAction === 'DELIVERED') {
        // Finalizar entrega: PUT /api/logistics/deliveries/{id}/complete
        const deliveryId = activeDelivery?.id
        if (!deliveryId) throw new Error('ID de entrega no encontrado')
        const result = await finalizeDelivery(deliveryId)
        const ts = result?.deliveredAt ? new Date(result.deliveredAt) : new Date()
        setDeliveredAt(ts)
        setDeliveryStep('DELIVERED')
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Error al actualizar estado.'
      setActionError(msg)
      // Avanzar visualmente de todas formas
      if (pendingAction === 'ACCEPT') {
        setActiveDelivery({ id: null, orderId: activeOrder?.id, status: 'ASSIGNED' })
        setDeliveryStep('ASSIGNED')
      } else if (pendingAction === 'PICKED_UP') {
        setDeliveryStep('PICKED_UP')
      } else if (pendingAction === 'DELIVERED') {
        setDeliveredAt(new Date())
        setDeliveryStep('DELIVERED')
      }
    } finally {
      setLoading(false)
      setPendingAction(null)
    }
  }, [pendingAction, activeOrder, activeDelivery])

  const handleCancelAction = useCallback(() => {
    setShowConfirmModal(false)
    setPendingAction(null)
    if (pendingAction === 'ACCEPT') setActiveOrder(null)
  }, [pendingAction])

  const handleNextOrder = useCallback(async () => {
    setActiveDelivery(null)
    setActiveOrder(null)
    setDeliveryStep(null)
    setDeliveredAt(null)
    setActionError('')
    setLoadingOrders(true)
    try {
      const orders = await getPendingOrders()
      setPendingOrders(orders)
    } catch { setPendingOrders([]) }
    finally { setLoadingOrders(false) }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('medigo_token')
    localStorage.removeItem('medigo_user')
    navigate('/')
  }

  // ── Textos del modal según la acción ─────────────────────────────
  const modalCfg = useMemo(() => {
    switch (pendingAction) {
      case 'ACCEPT': return {
        icon: 'electric_moped',
        title: '¿Tomar este pedido?',
        body: `Serás asignado al pedido ${activeOrder?.orderNumber ?? `#${activeOrder?.id}`} y deberás recogerlo en la sucursal.`,
        address: activeOrder ? `${activeOrder?.street ?? ''} — ${activeOrder?.city ?? ''}`.trim() : '',
        btnLabel: 'Tomar pedido',
        btnClass: 'delivery-confirm-btn--accept',
      }
      case 'PICKED_UP': return {
        icon: 'inventory_2',
        title: '¿Confirmar recogida?',
        body: `Confirma que ya tienes el pedido ${activeOrder?.orderNumber ?? `#${activeOrder?.id}`} y saldrás a entregarlo.`,
        address: orderAddress(activeOrder),
        btnLabel: 'Confirmar recogida',
        btnClass: 'delivery-confirm-btn--pickup',
      }
      case 'DELIVERED': return {
        icon: 'local_shipping',
        title: '¿Confirmar entrega?',
        body: `Estás por marcar el pedido como entregado. Esta acción no se puede deshacer.`,
        address: orderAddress(activeOrder),
        btnLabel: 'Confirmar entrega',
        btnClass: 'delivery-confirm-btn--confirm',
      }
      default: return { icon: 'help', title: '', body: '', address: '', btnLabel: '', btnClass: '' }
    }
  }, [pendingAction, activeOrder])

  // ── Ítems del pedido (para mostrar en la tarjeta) ───────────────
  const orderItems = activeOrder?.items ?? []

  return (
    <div className="driver-map-page">
      <PageLoadingOverlay visible={showLoader} message="Cargando entregas..." />

      {/* ── Modal de confirmación ──────────────────────────────── */}
      {showConfirmModal && (
        <div className="delivery-confirm-overlay" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
          <div className="delivery-confirm-modal">
            <div className={`delivery-confirm-icon delivery-confirm-icon--${pendingAction?.toLowerCase()}`}>
              <span className="material-symbols-outlined">{modalCfg.icon}</span>
            </div>
            <h2 id="confirm-title">{modalCfg.title}</h2>
            <p>{modalCfg.body}</p>
            {modalCfg.address && (
              <div className="delivery-confirm-address">
                <span className="material-symbols-outlined">location_on</span>
                {modalCfg.address}
              </div>
            )}
            <div className="delivery-confirm-actions">
              <button type="button" className="delivery-confirm-btn--cancel" onClick={handleCancelAction}>
                Cancelar
              </button>
              <button type="button" className={modalCfg.btnClass} onClick={handleConfirmAction} disabled={loading}>
                <span className="material-symbols-outlined">{modalCfg.icon}</span>
                {modalCfg.btnLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="driver-layout">
        {/* ── Sidebar ─────────────────────────────────────────── */}
        <aside className="driver-sidenav" aria-label="Navegación de repartidor">
          <div className="driver-side-head">
            <MedigoSidebarBrand
              containerClassName="driver-side-brand"
              logoContainerClassName="driver-side-logo"
              textContainerClassName="driver-side-brand-text"
              title="Driver Portal"
              subtitle="Clinical Logistics Unit"
            />
          </div>
          <nav>
            <button type="button" className="driver-nav-btn active">
              <span className="material-symbols-outlined">map</span>
              Mapa de Entregas
            </button>
            <button type="button" className="driver-nav-btn" onClick={() => navigate('/repartidor/historial')}>
              <span className="material-symbols-outlined">history</span>
              Historial de Viajes
            </button>
            <button type="button" className="driver-nav-btn" onClick={() => navigate('/repartidor/perfil')}>
              <span className="material-symbols-outlined">person</span>
              Mi Perfil
            </button>
          </nav>
          <div className="driver-sidenav-footer">
            <button type="button" className="start-shift-btn" onClick={startDriverShift} disabled={loading}>
              Iniciar Turno
            </button>
            <button type="button" className="driver-footer-link">
              <span className="material-symbols-outlined">help</span>
              Ayuda
            </button>
            <button type="button" className="driver-footer-link danger" onClick={handleLogout}>
              <span className="material-symbols-outlined">logout</span>
              Cerrar sesión
            </button>
          </div>
        </aside>

        {/* ── Contenido principal ──────────────────────────────── */}
        <main className="driver-main" aria-label="Mapa de entregas">
          <header className="driver-topbar">
            <h2 className="driver-top-title">MediGo Clinical Logistics</h2>
            <div className="driver-topbar-right">
              <div className="driver-top-online"><span /><span>Online</span></div>
              <button type="button" className="driver-icon-btn" aria-label="Notificaciones">
                <span className="material-symbols-outlined">notifications</span>
              </button>
              <div className="driver-top-avatar">
                <span className="material-symbols-outlined">electric_moped</span>
              </div>
            </div>
          </header>

          <div className="driver-main-stage">

            {/* ── Mapa Leaflet ──────────────────────────────────── */}
            <MapContainer
              center={mapCenter}
              zoom={INITIAL_ZOOM}
              className="driver-leaflet-map"
              aria-label="Mapa de entregas en tiempo real"
              zoomControl={false}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />
              <MapCenter center={mapCenter} />

              {/* Posición del repartidor */}
              {driverPos && (
                <Marker position={driverPos} icon={driverIcon}>
                  <Popup><div className="driver-popup"><strong>Tu ubicación</strong></div></Popup>
                </Marker>
              )}

              {/* Sucursal de recogida — visible mientras no esté entregado */}
              {activeOrder?.pickupLat && deliveryStep !== 'DELIVERED' && (
                <Marker position={[activeOrder.pickupLat, activeOrder.pickupLng]} icon={pickupIcon}>
                  <Popup>
                    <div className="driver-popup">
                      <p className="driver-popup__label">Recoger en</p>
                      <p className="driver-popup__address">{activeOrder.pickupAddress ?? 'Sucursal'}</p>
                    </div>
                  </Popup>
                </Marker>
              )}

              {/* Destino — visible desde PICKED_UP */}
              {activeOrder?.destinationLat && (deliveryStep === 'PICKED_UP' || deliveryStep === 'DELIVERED') && (
                <Marker position={[activeOrder.destinationLat, activeOrder.destinationLng]} icon={destinationIcon}>
                  <Popup>
                    <div className="driver-popup">
                      <p className="driver-popup__label">Entregar en</p>
                      <p className="driver-popup__address">{orderAddress(activeOrder)}</p>
                    </div>
                  </Popup>
                </Marker>
              )}
            </MapContainer>

            {/* Leyenda */}
            <div className="driver-legend" aria-label="Leyenda del mapa">
              <div className="driver-legend-row"><span className="driver-legend-dot pickup" />Sucursal</div>
              <div className="driver-legend-row"><span className="driver-legend-dot destination" />Destino</div>
              <div className="driver-legend-row"><span className="driver-legend-dot self" />Tú</div>
            </div>

            {/* Controles de zoom */}
            <div className="driver-map-controls" aria-label="Controles de mapa">
              <button type="button" aria-label="Acercar" onClick={() => document.querySelector('.leaflet-control-zoom-in')?.click()}>
                <span className="material-symbols-outlined">add</span>
              </button>
              <button type="button" aria-label="Alejar" onClick={() => document.querySelector('.leaflet-control-zoom-out')?.click()}>
                <span className="material-symbols-outlined">remove</span>
              </button>
            </div>

            {/* ── Tarjeta principal ─────────────────────────────── */}
            <article className="driver-order-card" aria-label="Detalle de pedido">

              {/* ── Sin pedido — lista de disponibles ─────────── */}
              {!activeDelivery && deliveryStep !== 'DELIVERED' && (
                <div className="pending-orders-panel">
                  <div className="pending-orders-header">
                    <span className="material-symbols-outlined">list_alt</span>
                    <h3>Pedidos disponibles</h3>
                    {pendingOrders.length > 0 && (
                      <span className="pending-orders-count">{pendingOrders.length}</span>
                    )}
                  </div>

                  {loadingOrders ? (
                    <p className="pending-orders-empty">Buscando pedidos...</p>
                  ) : pendingOrders.length === 0 ? (
                    <div className="pending-orders-empty">
                      <span className="material-symbols-outlined">inbox</span>
                      <p>No hay pedidos disponibles en este momento</p>
                      <small>Los pedidos confirmados por clientes aparecerán aquí</small>
                    </div>
                  ) : (
                    <ul className="pending-orders-list">
                      {pendingOrders.map((order) => (
                        <li key={order.id} className="pending-order-item">
                          <div className="pending-order-item__info">
                            <span className="pending-order-item__number">
                              {order.orderNumber ?? `#${order.id}`}
                            </span>
                            <span className="pending-order-item__address">
                              {orderAddress(order)}
                            </span>
                            <span className="pending-order-item__price">
                              {fmtPrice(order.totalPrice)}
                            </span>
                          </div>
                          <button
                            type="button"
                            className="pending-order-item__btn"
                            onClick={() => handleSelectOrder(order)}
                            disabled={loading}
                          >
                            Tomar
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* ── Pedido activo ──────────────────────────────── */}
              {activeDelivery && deliveryStep !== 'DELIVERED' && (
                <>
                  {/* Stepper */}
                  <div className="order-stepper" aria-label="Progreso del pedido">
                    {[
                      { key: 'ASSIGNED',  label: 'Asignado',  icon: 'electric_moped' },
                      { key: 'PICKED_UP', label: 'Recogido',  icon: 'inventory_2' },
                    ].map((step, idx, arr) => {
                      const stepOrder = { ASSIGNED: 0, PICKED_UP: 1 }
                      const current   = stepOrder[deliveryStep] ?? 0
                      const done      = idx < current
                      const active    = idx === current
                      return (
                        <div key={step.key} className={`order-stepper__step${done ? ' order-stepper__step--done' : ''}${active ? ' order-stepper__step--active' : ''}`}>
                          <div className="order-stepper__dot">
                            {done
                              ? <span className="material-symbols-outlined">check</span>
                              : <span className="material-symbols-outlined">{step.icon}</span>
                            }
                          </div>
                          <span className="order-stepper__label">{step.label}</span>
                          {idx < arr.length - 1 && (
                            <div className={`order-stepper__line${done ? ' order-stepper__line--done' : ''}`} />
                          )}
                        </div>
                      )
                    })}
                  </div>

                  <div className="card-top">
                    <div>
                      <span className="card-badge">
                        {deliveryStep === 'PICKED_UP' ? 'Recogido' : 'Asignado'}
                      </span>
                      <h2 className="card-title">{activeOrder?.orderNumber ?? `#${activeOrder?.id}`}</h2>
                    </div>
                  </div>

                  {/* Ítems del pedido */}
                  {orderItems.length > 0 && (
                    <ul className="delivery-items-list">
                      {orderItems.slice(0, 3).map((item, i) => (
                        <li key={i} className="delivery-item">
                          <span className="material-symbols-outlined">medication</span>
                          <span>{item.medicationName ?? item.name ?? `Ítem ${i + 1}`}</span>
                          <span className="delivery-item__qty">×{item.quantity}</span>
                        </li>
                      ))}
                      {orderItems.length > 3 && (
                        <li className="delivery-item delivery-item--more">
                          +{orderItems.length - 3} más
                        </li>
                      )}
                    </ul>
                  )}

                  <div className="route-flow">
                    <div className="route-axis" aria-hidden="true">
                      <span className="route-point start" />
                      <span className="route-line" />
                      <span className="route-point end" />
                    </div>
                    <div className="route-text">
                      <small>Recoger en</small>
                      <p>{activeOrder?.pickupAddress ?? `Sucursal #${activeOrder?.branchId ?? ''}`}</p>
                      <small>Entregar en</small>
                      <p>{orderAddress(activeOrder)}</p>
                    </div>
                  </div>

                  {/* Botón de acción según paso */}
                  {deliveryStep === 'ASSIGNED' && (
                    <button
                      type="button"
                      className="pickup-confirm-btn"
                      onClick={() => { setPendingAction('PICKED_UP'); setShowConfirmModal(true) }}
                      disabled={loading}
                    >
                      <span className="material-symbols-outlined">inventory_2</span>
                      Confirmar recogida en sucursal
                    </button>
                  )}

                  {deliveryStep === 'PICKED_UP' && (
                    <button
                      type="button"
                      className="finalize-delivery-btn"
                      onClick={() => { setPendingAction('DELIVERED'); setShowConfirmModal(true) }}
                      disabled={loading}
                    >
                      <span className="material-symbols-outlined">task_alt</span>
                      Confirmar entrega al cliente
                    </button>
                  )}

                  {actionError && <p className="order-action-error">{actionError}</p>}
                </>
              )}

              {/* ── Entrega completada ─────────────────────────── */}
              {deliveryStep === 'DELIVERED' && (
                <div className="delivery-success-panel" aria-live="polite">
                  <div className="delivery-success-icon">
                    <span className="material-symbols-outlined">task_alt</span>
                  </div>
                  <h2 className="delivery-success-title">¡Entrega completada!</h2>
                  <p className="delivery-success-sub">
                    Pedido <strong>{activeOrder?.orderNumber ?? `#${activeOrder?.id}`}</strong> entregado exitosamente
                  </p>
                  {deliveredAt && (
                    <div className="delivery-success-time">
                      <span className="material-symbols-outlined">schedule</span>
                      Entregado a las {fmtTime(deliveredAt)}
                    </div>
                  )}
                  <button type="button" className="accept-order-btn" onClick={handleNextOrder}>
                    <span className="material-symbols-outlined">arrow_forward</span>
                    Ver siguiente pedido
                  </button>
                </div>
              )}
            </article>
          </div>

          <footer className="driver-mobile-footer" aria-label="Navegación móvil repartidor">
            <button type="button" onClick={() => navigate('/repartidor/historial')}>
              <span className="material-symbols-outlined">history</span>
              Historial
            </button>
            <span className="driver-mobile-center" aria-hidden="true">
              <span className="material-symbols-outlined">map</span>
            </span>
            <button type="button" onClick={() => navigate('/repartidor/perfil')}>
              <span className="material-symbols-outlined">person</span>
              Perfil
            </button>
          </footer>
        </main>
      </div>
    </div>
  )
}
