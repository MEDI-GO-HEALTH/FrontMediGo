import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { createSubasta, getSubastas } from '../../api/subastaService'
import { ROUTES } from '../../constants/routes'
import '../../styles/admin/gestion-subastas.css'

const FALLBACK_AUCTIONS = [
  {
    id: 'SUB-001',
    name: 'Amoxicillin 500mg',
    batch: 'AMX-2024-001',
    status: 'EN VIVO',
    startPrice: 12400,
    reserveNote: 'Reserva Alcanzada',
    remaining: '04h 12m 31s',
    icon: 'pill',
    active: true,
  },
  {
    id: 'SUB-002',
    name: 'Insulin Glargine',
    batch: 'INS-992-B',
    status: 'EN VIVO',
    startPrice: 85200,
    reserveNote: 'Reserva Alcanzada',
    remaining: '01h 45m 08s',
    icon: 'vaccines',
    active: true,
  },
  {
    id: 'SUB-003',
    name: 'Atorvastatin Calcium',
    batch: 'ATR-V34-X',
    status: 'PENDIENTE',
    startPrice: 4150,
    reserveNote: 'Puja Min. Requerida',
    remaining: 'Empieza en 2d',
    icon: 'vital_signs',
    active: false,
  },
]

const FALLBACK_OVERVIEW = {
  growthPct: 12,
  activeAuctions: 142,
  totalValue: 2481200,
  topBid: 450000,
  multiplier: 1.4,
  pendingApprovals: 4,
  scheduledStarts: 12,
}

const formatMoney = (value, compact = false) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: compact ? 'compact' : 'standard',
    maximumFractionDigits: compact ? 1 : 0,
  }).format(Number(value) || 0)

const mapAuctionFromApi = (item, index) => ({
  id: item?.id || item?.codigo || `SUB-${String(index + 1).padStart(3, '0')}`,
  name: item?.nombre || item?.medicamento || 'Subasta',
  batch: item?.lote || item?.batch || `BATCH-${index + 1}`,
  status: String(item?.estado || (item?.activa ? 'EN VIVO' : 'PENDIENTE')).toUpperCase(),
  startPrice: Number(item?.precioInicial ?? item?.montoActual ?? item?.precioBase ?? 0),
  reserveNote: item?.reservaNota || 'Reserva Alcanzada',
  remaining: item?.tiempoRestante || item?.cierre || '01h 00m 00s',
  icon: index % 2 === 0 ? 'pill' : 'vaccines',
  active: Boolean(item?.activa ?? String(item?.estado || '').toUpperCase().includes('VIVO')),
})

export default function GestionSubastas() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [auctions, setAuctions] = useState(FALLBACK_AUCTIONS)
  const [overview, setOverview] = useState(FALLBACK_OVERVIEW)
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    let mounted = true

    const loadAuctions = async () => {
      try {
        const response = await getSubastas({ limit: 30 })
        if (!mounted) {
          return
        }

        const source = response?.data || response
        if (Array.isArray(source) && source.length > 0) {
          const mapped = source.map((item, index) => mapAuctionFromApi(item, index))
          const active = mapped.filter((item) => item.active)
          const totalValue = mapped.reduce((acc, item) => acc + item.startPrice, 0)
          const topBid = Math.max(...mapped.map((item) => item.startPrice), FALLBACK_OVERVIEW.topBid)

          setAuctions(mapped)
          setOverview((previous) => ({
            ...previous,
            activeAuctions: active.length,
            totalValue,
            topBid,
          }))
        }
      } catch {
        if (mounted) {
          setNotice('No fue posible sincronizar subastas con backend. Se muestran datos de respaldo.')
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadAuctions()

    return () => {
      mounted = false
    }
  }, [])

  const filteredAuctions = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) {
      return auctions
    }

    return auctions.filter((item) => `${item.name} ${item.batch} ${item.status}`.toLowerCase().includes(query))
  }, [auctions, search])

  const handleLogout = () => {
    localStorage.removeItem('medigo_token')
    localStorage.removeItem('medigo_user')
    navigate(ROUTES.AUTH.LOGIN, { replace: true })
  }

  const handleCreateAuction = async () => {
    setCreating(true)
    setNotice('')

    const payload = {
      nombre: 'Nueva Subasta Clinica',
      precioBase: 10000,
      estado: 'PENDIENTE',
    }

    try {
      const created = await createSubasta(payload)
      const item = mapAuctionFromApi(created, 0)
      setAuctions((previous) => [item, ...previous])
      setNotice('Subasta creada en backend correctamente.')
    } catch {
      const local = {
        id: `SUB-LOCAL-${Date.now()}`,
        name: 'Nueva Subasta Clinica',
        batch: 'BATCH-LOCAL',
        status: 'PENDIENTE',
        startPrice: 10000,
        reserveNote: 'Puja Min. Requerida',
        remaining: 'Empieza en 3d',
        icon: 'medication',
        active: false,
      }
      setAuctions((previous) => [local, ...previous])
      setNotice('Subasta creada en modo local. Lista para endpoint real cuando este disponible.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="admin-auctions-shell">
      <aside className="auctions-side">
        <div className="auctions-brand">
          <div className="auctions-brand-icon">
            <span className="material-symbols-outlined">medical_services</span>
          </div>
          <div>
            <h1>MediGo Admin</h1>
            <p>CLINICAL PRECISION</p>
          </div>
        </div>

        <nav className="auctions-nav" aria-label="Navegacion administrador">
          <button type="button" className="active" onClick={() => navigate(ROUTES.ADMIN.AUCTIONS)}>
            <span className="material-symbols-outlined">gavel</span>
            {' '}Subastas
          </button>
          <button type="button" onClick={() => navigate(ROUTES.ADMIN.INVENTORY)}>
            <span className="material-symbols-outlined">inventory_2</span>
            {' '}Inventario
          </button>
          <button type="button" onClick={() => navigate(ROUTES.ADMIN.BRANCHES)}>
            <span className="material-symbols-outlined">account_tree</span>
            {' '}Sedes
          </button>
          <button type="button" onClick={() => navigate(ROUTES.ADMIN.USERS)}>
            <span className="material-symbols-outlined">person</span>
            {' '}Usuarios
          </button>
        </nav>

        <div className="auctions-side-footer">
          <button type="button" className="new-entry-btn" onClick={handleCreateAuction} disabled={creating}>
            <span className="material-symbols-outlined">add</span>
            {' '}{creating ? 'Creando...' : 'Nueva Entrada'}
          </button>
          <button type="button" className="side-link">
            <span className="material-symbols-outlined">help</span>
            {' '}Soporte
          </button>
          <button type="button" className="side-link" onClick={handleLogout}>
            <span className="material-symbols-outlined">logout</span>
            {' '}Cerrar Sesion
          </button>
        </div>
      </aside>

      <main className="auctions-main">
        <header className="auctions-topbar">
          <label className="auctions-search" aria-label="Buscar subastas">
            <span className="material-symbols-outlined">search</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search auctions, batches, or medicines..."
            />
          </label>

          <div className="auctions-top-right">
            <button type="button" className="icon-btn" aria-label="Notificaciones">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <button type="button" className="icon-btn" aria-label="Configuracion">
              <span className="material-symbols-outlined">settings</span>
            </button>
            <div className="top-separator" />
            <div className="top-profile">
              <div>
                <strong>Admin User</strong>
                <small>Administrator</small>
              </div>
              <div className="profile-image-placeholder" aria-label="Placeholder de perfil administrativo">
                IMG
              </div>
            </div>
          </div>
        </header>

        <section className="auctions-content">
          <div className="auctions-header-row">
            <div>
              <h2>Subastas</h2>
              <p>Gestione y supervise los eventos de adquisicion en vivo para suministros farmaceuticos.</p>
            </div>

            <button type="button" className="create-auction-btn" onClick={handleCreateAuction} disabled={creating}>
              <span className="material-symbols-outlined">add_circle</span>
              Crear Nueva Subasta
            </button>
          </div>

          {notice ? <p className="auctions-notice">{notice}</p> : null}

          <section className="auctions-overview-grid" aria-label="Resumen de subastas">
            <article className="metric-card">
              <div className="metric-head">
                <span className="material-symbols-outlined">group</span>
                <small>+{overview.growthPct}% vs el mes pasado</small>
              </div>
              <p>Subastas Activas</p>
              <strong>{new Intl.NumberFormat('es-CO').format(overview.activeAuctions)}</strong>
              <div className="bar-track">
                <span />
                <span />
                <span className="dim" />
                <span className="faint" />
              </div>
            </article>

            <article className="value-card">
              <p>Valor Total de Subastas</p>
              <strong>{formatMoney(overview.totalValue)}</strong>
              <div className="value-sub-grid">
                <div>
                  <small>Puja Mas Alta</small>
                  <strong>{formatMoney(overview.topBid, true)}</strong>
                </div>
                <div>
                  <small>Multiplicador Promedio</small>
                  <strong>{overview.multiplier}x</strong>
                </div>
              </div>
              <span className="material-symbols-outlined bg-icon">analytics</span>
            </article>

            <article className="system-card">
              <h3>Estado del Sistema</h3>
              <div className="live-indicator">
                <i />
                Todos los Nodos Operativos
              </div>
              <div className="system-row">
                <span>Aprobaciones Pendientes</span>
                <strong>{String(overview.pendingApprovals).padStart(2, '0')}</strong>
              </div>
              <div className="system-row">
                <span>Inicios Programados</span>
                <strong>{overview.scheduledStarts}</strong>
              </div>
            </article>
          </section>

          <section className="auctions-table-card" aria-label="Subastas activas">
            <div className="table-head">
              <h3>Subastas Activas</h3>
              <div>
                <button type="button">Export CSV</button>
                <button type="button" className="active">Filters</button>
              </div>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>MEDICAMENTO Y LOTE</th>
                    <th className="center">ESTADO</th>
                    <th>PRECIO INICIAL</th>
                    <th>TIEMPO RESTANTE</th>
                    <th className="right">ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAuctions.map((auction) => (
                    <tr key={auction.id}>
                      <td>
                        <div className="medicine-cell">
                          <div className="medicine-icon">
                            <span className="material-symbols-outlined">{auction.icon}</span>
                          </div>
                          <div>
                            <p>{auction.name}</p>
                            <small>Batch #{auction.batch}</small>
                          </div>
                        </div>
                      </td>
                      <td className="center">
                        <span className={`status-pill ${auction.active ? 'live' : 'pending'}`}>{auction.status}</span>
                      </td>
                      <td>
                        <strong>{formatMoney(auction.startPrice)}</strong>
                        <small>{auction.reserveNote}</small>
                      </td>
                      <td>
                        <div className={`time-cell ${auction.active ? 'live' : 'pending'}`}>
                          <span className="material-symbols-outlined">schedule</span>
                          {auction.remaining}
                        </div>
                      </td>
                      <td className="right">
                        <button type="button" className="row-action-btn" aria-label={`Opciones ${auction.name}`}>
                          <span className="material-symbols-outlined">more_vert</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="table-footer">
              <p>Mostrando {filteredAuctions.length} de {auctions.length} subastas activas</p>
              <div className="pager">
                <button type="button">
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
                <button type="button" className="active">1</button>
                <button type="button">2</button>
                <button type="button">
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
            </div>
          </section>
        </section>
      </main>

      {loading ? <div className="auctions-loading">Sincronizando subastas...</div> : null}
    </div>
  )
}
