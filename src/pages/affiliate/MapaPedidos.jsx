/**
 * MapaPedidos.jsx — Mapa en vivo con ubicación de repartidores (HU-09)
 *
 * Muestra un mapa Leaflet con todos los repartidores activos en la zona:
 *   🟢 Verde   — repartidor asignado al cliente actual (marcador pulsante)
 *   🟡 Amarillo — repartidores disponibles sin pedido
 *   ⚫ Gris    — repartidores ocupados con pedido de otro cliente
 *
 * Se actualiza automáticamente cada 7 segundos sin recargar la página.
 */

import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useMemo, useState } from 'react'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import PageLoadingOverlay from '../../components/common/PageLoadingOverlay'
import AffiliateShell from '../../components/layout/AffiliateShell'
import useDriverLocations from '../../hooks/useDriverLocations'
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

// ── Componente principal ──────────────────────────────────────────────
export default function MapaPedidos() {
  const { drivers, assignedDriver, isLoading, lastUpdated, noDrivers } = useDriverLocations()
  const showLoader = useCappedLoading(isLoading, 1500)
  const [routeData] = useState({ origin: 'Almacen Central Norte', destination: 'EPS Sanitas Teusaquillo', status: 'En Camino' })

  return (
    <AffiliateShell active="map" contentMode="fluid">
      <PageLoadingOverlay visible={showLoader} message="Sincronizando mapa de repartidores..." />

      <div className="affiliate-map-workspace">
        {/* ── Mapa Leaflet ──────────────────────────────────────────── */}
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

        {/* ── Panel de logística ────────────────────────────────────── */}
        <aside className="logistics-panel">
          <div className="panel-header">
            <h3>Logística de Pedido</h3>
            <p>Gestión de despacho clínico</p>
          </div>

          <div className="panel-body">
            {/* Tarjeta del repartidor asignado (Escenario 1) */}
            {assignedDriver ? (
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

            <section className="route-card">
              <div className="route-card-head">
                <h4>Ruta en curso</h4>
                <span>{routeData.status}</span>
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

            {/* Contador de repartidores activos */}
            {!isLoading ? (
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
