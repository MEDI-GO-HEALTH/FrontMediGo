import { useEffect, useState } from 'react'
import { getAffiliateLogisticsDashboard } from '../../api/affiliateLogisticsService'
import PageLoadingOverlay from '../../components/common/PageLoadingOverlay'
import AffiliateShell from '../../components/layout/AffiliateShell'
import useCappedLoading from '../../hooks/useCappedLoading'
import '../../styles/affiliate/perfil-afiliado.css'
import '../../styles/affiliate/mapa-pedidos.css'

// Temporary mock data until API endpoints are connected.
const INITIAL_ROUTE = {
  origin: 'Almacen Central Norte',
  destination: 'EPS Sanitas Teusaquillo',
  status: 'En Camino',
}

export default function MapaPedidos() {
  const [routeData, setRouteData] = useState(INITIAL_ROUTE)
  const [loading, setLoading] = useState(true)
  const showLoader = useCappedLoading(loading, 3000)

  useEffect(() => {
    let mounted = true

    const loadDashboard = async () => {
      try {
        const data = await getAffiliateLogisticsDashboard()
        if (!mounted) return

        if (data?.route?.origin && data?.route?.destination && data?.route?.status) {
          setRouteData(data.route)
        }
      } catch (_error) {
        // Keep local fallback while backend endpoint is not yet available.
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadDashboard()
    return () => {
      mounted = false
    }
  }, [])

  return (
    <AffiliateShell active="map" contentMode="fluid">
      <PageLoadingOverlay visible={showLoader} message="Sincronizando mapa logistico..." />
      <div className="affiliate-map-workspace">
        <section className="map-viewport">
          <div className="map-surface" role="img" aria-label="Mapa logistico temporal">
            {/* Placeholder map prepared for future real-time map integration. */}
            <div className="map-grid" />
            <div className="map-gradient-overlay" />

            <div className="map-marker eps-marker" title="EPS">
              <span className="material-symbols-outlined">local_hospital</span>
            </div>
            <div className="map-marker courier-busy" title="Mensajero ocupado">
              <span className="material-symbols-outlined">electric_moped</span>
            </div>
            <div className="map-marker courier-free" title="Mensajero disponible">
              <span className="material-symbols-outlined">directions_run</span>
            </div>

            <svg className="map-route" viewBox="0 0 1000 700" preserveAspectRatio="none" aria-hidden="true">
              <path d="M 260 360 Q 460 420 640 300" />
              <circle cx="260" cy="360" r="7" />
              <circle cx="640" cy="300" r="7" />
            </svg>

            <div className="map-controls">
              <button type="button"><span className="material-symbols-outlined">add</span></button>
              <button type="button"><span className="material-symbols-outlined">remove</span></button>
              <button type="button" className="locate-btn"><span className="material-symbols-outlined">my_location</span></button>
            </div>
          </div>
        </section>

        <aside className="logistics-panel">
          <div className="panel-header">
            <h3>Logistica de Pedido</h3>
            <p>Gestion de despacho clinico</p>
          </div>

          <div className="panel-body">
            <section>
              <label className="panel-label">Medicamento & Cantidad</label>
              <div className="panel-field-group">
                <div className="panel-field">
                  <span>Nombre del Farmaco</span>
                  <input type="text" placeholder="Ej: Acetaminofen 500mg" />
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
                      <option>Critico</option>
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
                  <small>Subasta rapida al mejor postor</small>
                </div>
              </div>
              <div className="delivery-option">
                <div className="option-icon"><span className="material-symbols-outlined">person_search</span></div>
                <div>
                  <p>Asignar Mensajero Especifico</p>
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
          </div>

          <div className="panel-footer">
            <button type="button">Confirmar Logistica</button>
          </div>
        </aside>
      </div>
    </AffiliateShell>
  )
}
