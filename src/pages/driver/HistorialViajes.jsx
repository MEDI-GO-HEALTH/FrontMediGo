import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import {
  getDriverHistorySummary,
  getDriverTrips,
  requestDriverEmergencySupport,
} from '../../api/driverHistoryService'
import MedigoSidebarBrand from '../../components/common/MedigoSidebarBrand'
import PageLoadingOverlay from '../../components/common/PageLoadingOverlay'
import useCappedLoading from '../../hooks/useCappedLoading'
import '../../styles/driver/historial-viajes.css'

const FALLBACK_SUMMARY = {
  totalTrips: 128,
  tripsGrowthPct: 12,
  averageRating: 4.9,
  monthlyEarnings: 2450,
  currency: 'MXN',
}

const FALLBACK_TRIPS = [
  {
    id: '#MG-82910',
    date: '12 Oct 2023',
    time: '08:45 AM',
    originName: 'Hospital Angeles',
    originSub: 'Sede Pedregal',
    destinationMain: 'Av. Insurgentes Sur 1202',
    destinationSub: 'Col. Guadalupe Inn',
    distanceKm: 12.4,
    status: 'completed',
  },
  {
    id: '#MG-82908',
    date: '11 Oct 2023',
    time: '03:20 PM',
    originName: 'Farmacias del Ahorro',
    originSub: 'Centro Distribucion',
    destinationMain: 'Calle 10 #245',
    destinationSub: 'Col. San Pedro',
    distanceKm: 4.8,
    status: 'completed',
  },
  {
    id: '#MG-82894',
    date: '11 Oct 2023',
    time: '11:15 AM',
    originName: 'Clinica Medica Sur',
    originSub: 'Laboratorio Central',
    destinationMain: 'Periferico Sur 452',
    destinationSub: 'Col. Tlalpan',
    distanceKm: 0,
    status: 'cancelled',
  },
  {
    id: '#MG-82881',
    date: '10 Oct 2023',
    time: '09:30 AM',
    originName: 'Salud Digna',
    originSub: 'Sucursal Reforma',
    destinationMain: 'Paseo de la Reforma 300',
    destinationSub: 'Col. Juarez',
    distanceKm: 18.2,
    status: 'completed',
  },
]

const DATE_RANGE_OPTIONS = ['Ultimos 30 dias', 'Esta semana', 'Mes anterior', 'Personalizado']

export default function HistorialViajes() {
  const navigate = useNavigate()
  const [summary, setSummary] = useState(FALLBACK_SUMMARY)
  const [trips, setTrips] = useState(FALLBACK_TRIPS)
  const [searchTerm, setSearchTerm] = useState('')
  const [dateRange, setDateRange] = useState(DATE_RANGE_OPTIONS[0])
  const [actionError, setActionError] = useState('')
  const [loading, setLoading] = useState(true)
  const showLoader = useCappedLoading(loading, 3000)

  useEffect(() => {
    let mounted = true

    const loadHistory = async () => {
      setLoading(true)
      try {
        const [summaryResponse, tripsResponse] = await Promise.all([
          getDriverHistorySummary({ range: dateRange }),
          getDriverTrips({ range: dateRange }),
        ])

        if (!mounted) {
          return
        }

        setSummary((prev) => ({
          ...prev,
          ...(summaryResponse ?? {}),
        }))

        const incomingTrips = Array.isArray(tripsResponse?.items)
          ? tripsResponse.items
          : Array.isArray(tripsResponse)
            ? tripsResponse
            : FALLBACK_TRIPS

        setTrips(incomingTrips)
      } catch {
        if (!mounted) {
          return
        }

        setSummary(FALLBACK_SUMMARY)
        setTrips(FALLBACK_TRIPS)
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadHistory()

    return () => {
      mounted = false
    }
  }, [dateRange])

  const filteredTrips = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    if (!query) {
      return trips
    }

    return trips.filter((trip) => {
      const searchable = `${trip.id} ${trip.originName} ${trip.destinationMain}`.toLowerCase()
      return searchable.includes(query)
    })
  }, [searchTerm, trips])

  const handleEmergency = async () => {
    setActionError('')
    try {
      await requestDriverEmergencySupport({ source: 'history', timestamp: new Date().toISOString() })
    } catch {
      setActionError('No fue posible reportar soporte de emergencia al backend. Se conserva modo local.')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('medigo_token')
    localStorage.removeItem('medigo_user')
    navigate('/')
  }

  return (
    <div className="driver-history-page">
      <PageLoadingOverlay visible={showLoader} message="Cargando historial de viajes..." />
      <div className="driver-history-shell">
        <aside className="driver-history-sidebar" aria-label="Navegacion repartidor">
          <div className="driver-history-side-head">
            <MedigoSidebarBrand
              containerClassName="driver-history-side-brand"
              logoContainerClassName="driver-history-side-logo"
              textContainerClassName="driver-history-side-brand-text"
              title="Driver Portal"
              subtitle="Clinical Logistics Unit"
            />
          </div>

          <nav className="driver-history-nav">
            <button type="button" onClick={() => navigate('/repartidor/mapa')}>
              <span className="material-symbols-outlined">map</span>
              Mapa de Entregas
            </button>

            <button type="button" className="active">
              <span className="material-symbols-outlined">history</span>
              Historial de Viajes
            </button>

            <button type="button" onClick={() => navigate('/repartidor/perfil')}>
              <span className="material-symbols-outlined">person</span>
              Configuracion de Perfil
            </button>
          </nav>

          <div className="driver-history-side-footer">
            <button type="button" className="driver-emergency-btn" onClick={handleEmergency}>
              <span className="material-symbols-outlined">emergency</span>
              Emergency Support
            </button>

            <button type="button" className="driver-side-link">
              <span className="material-symbols-outlined">help</span>
              Help
            </button>

            <button type="button" className="driver-side-link danger" onClick={handleLogout}>
              <span className="material-symbols-outlined">logout</span>
              Sign Out
            </button>

            {actionError ? <p className="driver-history-error">{actionError}</p> : null}
          </div>
        </aside>

        <main className="driver-history-main">
          <header className="driver-history-topbar">
            <h2>MediGo Clinical Logistics</h2>

            <div className="driver-history-topbar-right">
              <div className="driver-online">
                <span />
                <span>Online</span>
              </div>

              <button type="button" className="driver-top-icon" aria-label="Notificaciones">
                <span className="material-symbols-outlined">notifications</span>
              </button>

              <div className="driver-avatar" aria-label="Avatar por defecto del repartidor">
                <span className="material-symbols-outlined">local_shipping</span>
              </div>
            </div>
          </header>

          <div className="driver-history-content">
            <section>
              <h3 className="driver-history-title">Historial de Actividad</h3>
              <p className="driver-history-subtitle">
                Visualiza el rendimiento de tus entregas y el resumen de ingresos acumulados durante el periodo actual.
              </p>

              <div className="driver-summary-grid">
                <article className="driver-summary-card">
                  <span className="material-symbols-outlined icon">local_shipping</span>
                  <small>Viajes Totales</small>
                  <div className="driver-summary-value">
                    <strong>{summary.totalTrips}</strong>
                    <span>
                      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                        trending_up
                      </span>
                      +{summary.tripsGrowthPct}%
                    </span>
                  </div>
                </article>

                <article className="driver-summary-card">
                  <span className="material-symbols-outlined icon">star</span>
                  <small>Calificacion Promedio</small>
                  <div className="driver-summary-value">
                    <strong>{summary.averageRating}</strong>
                    <span>
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1", fontSize: '14px' }}>
                        star
                      </span>
                      5.0
                    </span>
                  </div>
                </article>

                <article className="driver-summary-card income">
                  <span className="material-symbols-outlined icon">payments</span>
                  <small>Ganancias del Mes</small>
                  <div className="driver-summary-value">
                    <strong>${Number(summary.monthlyEarnings || 0).toLocaleString()}</strong>
                    <span className="currency">{summary.currency || 'MXN'}</span>
                  </div>
                </article>
              </div>
            </section>

            <section>
              <div className="driver-history-actions">
                <h3>Viajes Realizados</h3>

                <div className="driver-history-filters">
                  <label className="driver-search" aria-label="Buscar viajes">
                    <span className="material-symbols-outlined">search</span>
                    <input
                      type="text"
                      placeholder="Buscar por ID de pedido..."
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                    />
                  </label>

                  <label className="driver-date-filter" aria-label="Filtrar por periodo">
                    <span className="material-symbols-outlined">calendar_today</span>
                    <select value={dateRange} onChange={(event) => setDateRange(event.target.value)}>
                      {DATE_RANGE_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>

              <div className="driver-history-table">
                <div className="driver-history-head" role="row">
                  <div>Pedido ID</div>
                  <div>Fecha & Hora</div>
                  <div>Origen (EPS)</div>
                  <div>Destino</div>
                  <div style={{ textAlign: 'center' }}>Distancia</div>
                  <div style={{ textAlign: 'right' }}>Estado</div>
                </div>

                <div className="driver-history-list">
                  {filteredTrips.map((trip) => {
                    const isCancelled = trip.status === 'cancelled'

                    return (
                      <article key={trip.id} className="driver-history-row" role="row">
                        <div className="id">{trip.id}</div>

                        <div>
                          <p className="main">{trip.date}</p>
                          <p className="sub">{trip.time}</p>
                        </div>

                        <div>
                          <p className="main">{trip.originName}</p>
                          <p className="sub">{trip.originSub}</p>
                        </div>

                        <div>
                          <p className="main">{trip.destinationMain}</p>
                          <p className="sub">{trip.destinationSub}</p>
                        </div>

                        <div className="distance">
                          <span className={`driver-distance-pill ${isCancelled ? 'muted' : ''}`}>
                            {Number(trip.distanceKm).toFixed(1)} km
                          </span>
                        </div>

                        <div className="status">
                          <span className={`driver-status ${isCancelled ? 'cancelled' : 'done'}`}>
                            <span className="material-symbols-outlined" style={{ fontSize: '14px', fontVariationSettings: "'FILL' 1" }}>
                              {isCancelled ? 'cancel' : 'check_circle'}
                            </span>
                            {isCancelled ? 'Cancelado' : 'Completado'}
                          </span>
                        </div>
                      </article>
                    )
                  })}
                </div>

                <div className="driver-history-bottom">
                  <p>
                    Mostrando {Math.min(filteredTrips.length, 4)} de {summary.totalTrips} viajes realizados
                  </p>

                  <div className="driver-pagination" aria-label="Paginacion">
                    <button type="button" className="arrow" disabled>
                      <span className="material-symbols-outlined">chevron_left</span>
                    </button>
                    <button type="button" className="active">1</button>
                    <button type="button">2</button>
                    <button type="button">3</button>
                    <button type="button" className="arrow">
                      <span className="material-symbols-outlined">chevron_right</span>
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <footer className="driver-page-footer">
              <p>© 2026 MediGo Logistics. Sistema de gestion clinica autorizada.</p>
              <div className="driver-page-links">
                <a href="#">Terminos de Servicio</a>
                <a href="#">Politica de Privacidad</a>
                <a href="#">Soporte Tecnico</a>
              </div>
            </footer>
          </div>
        </main>
      </div>
    </div>
  )
}
