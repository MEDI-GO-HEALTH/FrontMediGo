/**
 * MapaPedidos.jsx — Mapa en vivo con ubicación de repartidores (HU-09/HU-10)
 *
 * HU-09: Muestra un mapa Leaflet con todos los repartidores activos en la zona.
 * HU-10: Cuando el pedido está en estado DELIVERED:
 *   - Oculta el mapa en vivo
 *   - Muestra el panel de confirmación de entrega con hora
 *   - Emite notificación mock al cliente
 */

import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import { getOrderStatus } from '../../api/affiliateOrderService'
import PageLoadingOverlay from '../../components/common/PageLoadingOverlay'
import AffiliateShell from '../../components/layout/AffiliateShell'
import useDriverLocations from '../../hooks/useDriverLocations'
import useCappedLoading from '../../hooks/useCappedLoading'
import '../../styles/affiliate/perfil-afiliado.css'
import '../../styles/affiliate/mapa-pedidos.css'

// ── Configuración del mapa ────────────────────────────────────────────
const BOGOTA_CENTER = [4.711, -74.0721]
const INITIAL_ZOOM = 14
const ORDER_POLL_INTERVAL_MS = 8_000   // HU-10: revisión de estado cada 8 s

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

/** Crea un icono Leaflet personalizado (divIcon) para cada estado. */
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

/** Formatea fecha de última actualización. */
const fmtTime = (date) =>
  date ? date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'

/** Formatea hora de entrega (HH:MM). */
const fmtDeliveredAt = (isoStr) => {
  if (!isoStr) return '—'
  try {
    return new Date(isoStr).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return isoStr
  }
}

// ── Componente de marcador individual ────────────────────────────────
function DriverMarker({ driver }) {
  const icon = useMemo(() => createDriverIcon(driver.status), [driver.status])
  const popupText = STATUS_POPUP[driver.status]?.(driver.name) ?? driver.name
  const statusCfg = STATUS_CONFIG[driver.status] ?? STATUS_CONFIG.BUSY

  return (
    <Marker
      key={driver.id}
      position={[driver.lat, driver.lng]}
      icon={icon}
      aria-label={popupText}
    >
      <Popup>
        <div className="driver-popup">
          <div className="driver-popup__dot" style={{ background: statusCfg.color }} />
          <div className="driver-popup__body">
            <p className="driver-popup__name">{driver.name}</p>
            <p className="driver-popup__status">{popupText}</p>
            {driver.estimatedTime && driver.status === 'ASSIGNED_TO_ME' ? (
              <p className="driver-popup__eta">
                <span className="material-symbols-outlined">schedule</span>
                Tiempo estimado: {driver.estimatedTime}
              </p>
            ) : null}
            <p className="driver-popup__update">
              Actualizado: {fmtTime(driver.lastUpdate)}
            </p>
          </div>
        </div>
      </Popup>
    </Marker>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────
const getAffiliateId = () => {
  try {
    const user = JSON.parse(localStorage.getItem('medigo_user') || '{}')
    return user?.currentOrderId ?? user?.activeOrderId ?? null
  } catch {
    return null
  }
}

// ── Componente principal ──────────────────────────────────────────────
export default function MapaPedidos() {
  const { drivers, assignedDriver, isLoading, lastUpdated, noDrivers } = useDriverLocations()
  const showLoader = useCappedLoading(isLoading, 1500)
  const [routeData] = useState({ origin: 'Almacen Central Norte', destination: 'EPS Sanitas Teusaquillo', status: 'En Camino' })

  // HU-10: estado de entrega
  const [orderDelivered, setOrderDelivered] = useState(false)
  const [deliveredAt, setDeliveredAt] = useState(null)
  const [showToast, setShowToast] = useState(false)
  const toastTimerRef = useRef(null)
  const pollRef = useRef(null)

  /** HU-10: muestra el toast de notificación por 5 segundos */
  const triggerToast = useCallback(() => {
    setShowToast(true)
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    toastTimerRef.current = setTimeout(() => setShowToast(false), 5000)
  }, [])

  /** HU-10: polling para detectar si el pedido fue entregado */
  useEffect(() => {
    const orderId = getAffiliateId()
    if (!orderId) return

    const checkOrderStatus = async () => {
      try {
        const result = await getOrderStatus(orderId)
        if (result?.status === 'DELIVERED' && !orderDelivered) {
          setOrderDelivered(true)
          setDeliveredAt(result.deliveredAt || null)
          triggerToast()
        }
      } catch {
        // API no disponible - mantener estado actual
      }
    }

    checkOrderStatus()
    pollRef.current = setInterval(checkOrderStatus, ORDER_POLL_INTERVAL_MS)

    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    }
  }, [orderDelivered, triggerToast])

  return (
    <AffiliateShell active="map" contentMode="fluid">
      <PageLoadingOverlay visible={showLoader} message="Sincronizando mapa de repartidores..." />

      {/* HU-10: Toast de notificación "Tu pedido ha sido entregado" */}
      {showToast && (
        <div
          className="delivery-toast"
          role="status"
          aria-live="polite"
          aria-label="Notificación de entrega"
        >
          <span className="material-symbols-outlined delivery-toast__icon">task_alt</span>
          <div>
            <p className="delivery-toast__title">¡Tu pedido ha sido entregado!</p>
            <p className="delivery-toast__sub">Revisa los detalles en tu panel de seguimiento.</p>
          </div>
          <button
            type="button"
            className="delivery-toast__close"
            aria-label="Cerrar notificación"
            onClick={() => setShowToast(false)}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
      )}

      <div className="affiliate-map-workspace">

        {/* ── HU-10: Panel de entrega completada (reemplaza el mapa) ─── */}
        {orderDelivered ? (
          <section
            className="order-delivered-panel"
            aria-label="Pedido entregado"
            role="status"
          >
            <div className="order-delivered-animation">
              <span className="material-symbols-outlined order-delivered-icon">
                task_alt
              </span>
              <div className="order-delivered-pulse" />
            </div>
            <h2 className="order-delivered-title">¡Pedido Entregado!</h2>
            <p className="order-delivered-sub">Tu medicamento ha llegado a su destino.</p>

            {deliveredAt && (
              <div className="order-delivered-time">
                <span className="material-symbols-outlined">schedule</span>
                <span>
                  Entregado a las <strong>{fmtDeliveredAt(deliveredAt)}</strong>
                </span>
              </div>
            )}

            <div className="order-delivered-details">
              <div className="order-delivered-detail-row">
                <span className="material-symbols-outlined">location_on</span>
                <span>{routeData.destination}</span>
              </div>
              <div className="order-delivered-detail-row">
                <span className="material-symbols-outlined">electric_moped</span>
                <span>{assignedDriver?.name ?? 'Repartidor'}</span>
              </div>
            </div>

            <p className="order-delivered-history-hint">
              Este pedido aparecerá en tu historial de pedidos.
            </p>
          </section>
        ) : (
          /* ── HU-09: Mapa Leaflet en vivo ─────────────────────────────── */
          <section className="map-viewport" aria-label="Mapa de repartidores en tiempo real">
            {/* Indicador de actualización en vivo */}
            <div className="map-live-bar" aria-live="polite" aria-label="Estado de actualización del mapa">
              <span className="map-live-dot" aria-hidden="true" />
              <span>En vivo · {fmtTime(lastUpdated)}</span>
            </div>

            {/* Leyenda de colores */}
            <div className="map-legend" role="complementary" aria-label="Leyenda de repartidores">
              <div className="map-legend__item">
                <span className="map-legend__dot map-legend__dot--assigned" />
                Mi repartidor
              </div>
              <div className="map-legend__item">
                <span className="map-legend__dot map-legend__dot--available" />
                Disponible
              </div>
              <div className="map-legend__item">
                <span className="map-legend__dot map-legend__dot--busy" />
                Ocupado
              </div>
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

              {drivers.map((driver) => (
                <DriverMarker key={driver.id} driver={driver} />
              ))}
            </MapContainer>

            {/* Mensaje cuando no hay repartidores (Escenario 8) */}
            {noDrivers && !showLoader ? (
              <div className="map-no-drivers" role="status">
                <span className="material-symbols-outlined">electric_moped</span>
                <p>No hay repartidores disponibles en tu zona en este momento</p>
              </div>
            ) : null}
          </section>
        )}

        {/* ── Panel de logística ────────────────────────────────────── */}
        <aside className="logistics-panel">
          <div className="panel-header">
            <h3>Logística de Pedido</h3>
            <p>Gestión de despacho clínico</p>
          </div>

          <div className="panel-body">
            {/* Tarjeta del repartidor asignado */}
            {assignedDriver && !orderDelivered ? (
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
            ) : null}

            {/* HU-10: cuando está entregado, mostrar resumen */}
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

            <section>
              <label className="panel-label">Medicamento &amp; Cantidad</label>
              <div className="panel-field-group">
                <div className="panel-field">
                  <span>Nombre del Fármaco</span>
                  <input type="text" placeholder="Ej: Acetaminofén 500mg" />
                </div>
                <div className="double-fields">
                  <div className="panel-field">
                    <span>Unidades</span>
                    <input type="number" defaultValue="100" />
                  </div>
                  <div className="panel-field">
                    <span>Prioridad</span>
                    <select defaultValue="Normal">
                      <option>Normal</option>
                      <option>Urgente</option>
                      <option>Crítico</option>
                    </select>
                  </div>
                </div>
              </div>
            </section>

            {!orderDelivered && (
              <section>
                <label className="panel-label">Canal de Entrega</label>
                <div className="delivery-option active">
                  <div className="option-icon"><span className="material-symbols-outlined">campaign</span></div>
                  <div>
                    <p>Publicar Pedido Abierto</p>
                    <small>Subasta rápida al mejor postor</small>
                  </div>
                </div>
                <div className="delivery-option">
                  <div className="option-icon"><span className="material-symbols-outlined">person_search</span></div>
                  <div>
                    <p>Asignar Mensajero Específico</p>
                    <small>Seleccionar desde el mapa</small>
                  </div>
                </div>
              </section>
            )}

            <section className="route-card">
              <div className="route-card-head">
                <h4>Ruta en curso</h4>
                <span className={orderDelivered ? 'route-status--delivered' : ''}>
                  {orderDelivered ? 'Entregado' : routeData.status}
                </span>
              </div>
              <div className="route-points">
                <div>
                  <small>ORIGEN</small>
                  <p>{routeData.origin}</p>
                </div>
                <div>
                  <small>DESTINO</small>
                  <p>{routeData.destination}</p>
                </div>
              </div>
            </section>

            {/* Contador de repartidores activos (solo si aún no entregado) */}
            {!isLoading && !orderDelivered ? (
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
            ) : null}
          </div>

          <div className="panel-footer">
            <button type="button">Confirmar Logística</button>
          </div>
        </aside>
      </div>
    </AffiliateShell>
  )
}
