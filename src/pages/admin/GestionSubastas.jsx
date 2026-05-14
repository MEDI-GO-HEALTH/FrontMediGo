import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { getInventario } from '../../api/inventarioService'
import { createSubasta, getAuctions, getActiveAuctions, getAuctionErrorMessage } from '../../api/subastaService'
import { getSedes } from '../../api/sedesService'
import AuctionAdminActions from '../../components/admin/AuctionAdminActions'
import MedigoSidebarBrand from '../../components/common/MedigoSidebarBrand'
import PageLoadingOverlay from '../../components/common/PageLoadingOverlay'
import { ROUTES } from '../../constants/routes'
import useCappedLoading from '../../hooks/useCappedLoading'
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
  name: item?.medicationName || item?.nombre || item?.medicamento || `Medicamento #${item?.medicationId ?? index + 1}`,
  batch: item?.lote || item?.batch || `SEDE-${item?.branchId ?? index + 1}`,
  status: String(item?.status || item?.estado || (item?.activa ? 'EN VIVO' : 'PENDIENTE')).toUpperCase(),
  startPrice: Number(item?.precioInicial ?? item?.montoActual ?? item?.precioBase ?? item?.basePrice ?? 0),
  reserveNote: item?.reservaNota || `Tipo cierre: ${item?.closureType || 'N/A'}`,
  remaining:
    item?.remainingSeconds === null || item?.remainingSeconds === undefined
      ? 'Sin dato'
      : `${Math.max(0, Math.floor(Number(item.remainingSeconds) / 60))} min`,
  icon: index % 2 === 0 ? 'pill' : 'vaccines',
  active: Boolean(item?.activa ?? String(item?.status || item?.estado || '').toUpperCase().includes('ACTIVE')),
})

const formatApiLocalDateTime = (dateValue) => {
  const date = dateValue instanceof Date ? dateValue : new Date(dateValue)
  if (Number.isNaN(date.getTime())) {
    return null
  }

  const offset = date.getTimezoneOffset() * 60 * 1000
  const localDate = new Date(date.getTime() - offset)
  return `${localDate.toISOString().slice(0, 19)}`
}

export default function GestionSubastas() {
  const navigate = useNavigate()
  const START_PAST_TOLERANCE_SECONDS = 15
  const SAFE_START_BUFFER_SECONDS = 60

  const toDateTimeLocal = (dateValue) => {
    const value = new Date(dateValue)
    const offset = value.getTimezoneOffset() * 60 * 1000
    const local = new Date(value.getTime() - offset)
    return local.toISOString().slice(0, 16)
  }

  const toApiLocalDateTime = (dateTimeLocalValue) => {
    if (!dateTimeLocalValue) {
      return null
    }

    const formatted = formatApiLocalDateTime(dateTimeLocalValue)
    if (formatted) {
      return formatted
    }

    const localValue = String(dateTimeLocalValue).trim()
    return localValue.length === 16 ? `${localValue}:00` : localValue
  }

  const getDefaultStartDate = () => new Date(Date.now() + SAFE_START_BUFFER_SECONDS * 1000)

  const initialCreateForm = {
    medicationId: 0,
    branchId: 0,
    basePrice: 0,
    startTime: toDateTimeLocal(getDefaultStartDate()),
    endTime: toDateTimeLocal(new Date(Date.now() + (61 * 60 * 1000))),
    closureType: 'FIXED_TIME',
    maxPrice: 0,
    inactivityMinutes: 0,
  }

  const [search, setSearch] = useState('')
  const [auctions, setAuctions] = useState([])
  const [overview, setOverview] = useState(FALLBACK_OVERVIEW)
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createError, setCreateError] = useState('')
  const [createForm, setCreateForm] = useState(initialCreateForm)
  const [selectedAuctionId, setSelectedAuctionId] = useState('')
  const [medications, setMedications] = useState([])
  const [sedes, setSedes] = useState([])
  const [loadingOptions, setLoadingOptions] = useState(false)
  const showLoader = useCappedLoading(loading, 3000)

  useEffect(() => {
    let mounted = true

    const loadAuctions = async () => {
      try {
        const response = await getAuctions()
        if (!mounted) {
          return
        }

        const source = response?.data || response
        if (Array.isArray(source)) {
          const mapped = source.map((item, index) => mapAuctionFromApi(item, index))
          const active = mapped.filter((item) => item.active)
          const totalValue = mapped.reduce((acc, item) => acc + item.startPrice, 0)
          const topBid = mapped.length > 0 
            ? Math.max(...mapped.map((item) => item.startPrice))
            : FALLBACK_OVERVIEW.topBid

          setAuctions(mapped)
          setOverview((previous) => ({
            ...previous,
            activeAuctions: active.length,
            totalValue,
            topBid,
          }))
        }
      } catch (error) {
        if (mounted) {
          const message = getAuctionErrorMessage(
            error,
            'No fue posible sincronizar subastas con backend. Se muestran datos de respaldo.'
          )
          setNotice(message)
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

  const handleOpenCreateModal = async () => {
    const freshMinStart = getDefaultStartDate()
    const freshPlusOneHour = new Date(freshMinStart.getTime() + 60 * 60 * 1000)
    setCreateError('')
    setCreateForm({
      ...initialCreateForm,
      startTime: toDateTimeLocal(freshMinStart),
      endTime: toDateTimeLocal(freshPlusOneHour),
    })
    setShowCreateModal(true)

    setLoadingOptions(true)
    try {
      const [medsResult, sedesResult] = await Promise.all([getInventario(), getSedes()])
      setMedications(Array.isArray(medsResult) ? medsResult : [])
      const sedesItems = sedesResult?.data?.data?.items ?? sedesResult?.data?.items
      setSedes(Array.isArray(sedesItems) ? sedesItems : [])
    } catch {
      // Si falla la carga de opciones, el usuario puede escribir el ID manualmente
    } finally {
      setLoadingOptions(false)
    }
  }

  const handleCloseCreateModal = () => {
    setShowCreateModal(false)
    setCreateError('')
  }

  const handleCreateInputChange = (event) => {
    const { name, value, type } = event.target
    const isNumeric = type === 'number' || event.target.dataset.numeric === 'true'

    setCreateForm((previous) => ({
      ...previous,
      [name]: isNumeric ? Number(value) : value,
    }))
  }

  const handleCreateAuction = async (event) => {
    event.preventDefault()
    setCreating(true)
    setNotice('')
    setCreateError('')

    const now = new Date()
    const minAcceptedStart = new Date(now.getTime() - START_PAST_TOLERANCE_SECONDS * 1000)
    const safeStartDate = new Date(now.getTime() + SAFE_START_BUFFER_SECONDS * 1000)
    const startDate = new Date(createForm.startTime)
    const endDate = new Date(createForm.endTime)
    const normalizedStartDate = startDate < safeStartDate ? safeStartDate : startDate

    if (startDate < minAcceptedStart) {
      setCreateError('La fecha/hora de inicio no puede estar en el pasado.')
      setCreating(false)
      return
    }

    if (endDate <= normalizedStartDate) {
      setCreateError('La fecha/hora de fin debe ser posterior a la fecha/hora de inicio.')
      setCreating(false)
      return
    }

    if (createForm.medicationId <= 0 || createForm.branchId <= 0 || createForm.basePrice <= 0) {
      setCreateError('Medication ID, Branch ID y Base Price deben ser mayores a 0.')
      setCreating(false)
      return
    }

    if (createForm.closureType === 'MAX_PRICE' && createForm.maxPrice <= 0) {
      setCreateError('Para cierre MAX_PRICE debes indicar Max Price mayor a 0.')
      setCreating(false)
      return
    }

    const payload = {
      medicationId: Number(createForm.medicationId),
      branchId: Number(createForm.branchId),
      basePrice: Number(createForm.basePrice),
      startTime: toApiLocalDateTime(normalizedStartDate),
      endTime: toApiLocalDateTime(createForm.endTime),
      closureType: String(createForm.closureType),
      ...(createForm.maxPrice > 0 ? { maxPrice: Number(createForm.maxPrice) } : {}),
      ...(createForm.inactivityMinutes > 0 ? { inactivityMinutes: Number(createForm.inactivityMinutes) } : {}),
    }

    try {
      const created = await createSubasta(payload)
      const item = mapAuctionFromApi(created, 0)
      setAuctions((previous) => [item, ...previous])
      setNotice('Subasta creada en backend correctamente.')
      setCreateError('')
      setShowCreateModal(false)
    } catch (error) {
      const message = getAuctionErrorMessage(error, 'No se pudo crear la subasta.')
      setCreateError(message)
      setNotice(message)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="admin-auctions-shell">
      <PageLoadingOverlay visible={showLoader} message="Cargando subastas del administrador..." />
      <aside className="auctions-side">
        <MedigoSidebarBrand
          containerClassName="auctions-brand"
          logoContainerClassName="auctions-brand-icon"
          title="MediGo Admin"
          subtitle="CLINICAL PRECISION"
        />

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
                <span className="material-symbols-outlined">account_circle</span>
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

            <button type="button" className="create-auction-btn" onClick={handleOpenCreateModal} disabled={creating}>
              Crear subasta
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
                {' '}Todos los Nodos Operativos
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
                          {' '}{auction.remaining}
                        </div>
                      </td>
                      <td className="right">
                        <button
                          type="button"
                          className="row-action-btn"
                          aria-label={`Cargar ${auction.name} en panel de endpoints`}
                          onClick={() => setSelectedAuctionId(String(auction.id))}
                        >
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

          <AuctionAdminActions
            initialAuctionId={selectedAuctionId}
            onNotice={(message) => {
              setNotice(message)
            }}
          />
        </section>
      </main>

      {loading ? <div className="auctions-loading">Sincronizando subastas...</div> : null}

      {showCreateModal ? (
        <div className="auction-modal-backdrop">
          <dialog className="auction-modal" open aria-labelledby="create-auction-title">
            <header className="auction-modal-header">
              <h3 id="create-auction-title">Crear Nueva Subasta</h3>
              <button type="button" className="auction-modal-close" onClick={handleCloseCreateModal} aria-label="Cerrar">
                <span className="material-symbols-outlined">close</span>
              </button>
            </header>

            <form className="auction-modal-form" onSubmit={handleCreateAuction}>
              <label>
                <span>Medicamento</span>
                <select
                  name="medicationId"
                  value={createForm.medicationId}
                  onChange={handleCreateInputChange}
                  data-numeric="true"
                  required
                  disabled={loadingOptions}
                >
                  <option value="0">
                    {loadingOptions ? 'Cargando medicamentos...' : '— Selecciona un medicamento —'}
                  </option>
                  {medications.map((med) => (
                    <option key={med.medicationId} value={med.medicationId}>
                      {med.medicationName || `Medicamento ${med.medicationId}`} (ID: {med.medicationId})
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Sede</span>
                <select
                  name="branchId"
                  value={createForm.branchId}
                  onChange={handleCreateInputChange}
                  data-numeric="true"
                  required
                  disabled={loadingOptions}
                >
                  <option value="0">
                    {loadingOptions ? 'Cargando sedes...' : '— Selecciona una sede —'}
                  </option>
                  {sedes.map((sede) => (
                    <option key={sede.id} value={sede.id}>
                      {sede.name || sede.nombre || `Sede ${sede.id}`} (ID: {sede.id})
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Base Price</span>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  name="basePrice"
                  value={createForm.basePrice}
                  onChange={handleCreateInputChange}
                  required
                />
              </label>

              <label>
                <span>Start Time</span>
                <input
                  type="datetime-local"
                  name="startTime"
                  value={createForm.startTime}
                  min={toDateTimeLocal(new Date())}
                  onChange={handleCreateInputChange}
                  required
                />
              </label>

              <label>
                <span>End Time</span>
                <input
                  type="datetime-local"
                  name="endTime"
                  value={createForm.endTime}
                  onChange={handleCreateInputChange}
                  required
                />
              </label>

              <label>
                <span>Closure Type</span>
                <select name="closureType" value={createForm.closureType} onChange={handleCreateInputChange}>
                  <option value="FIXED_TIME">FIXED_TIME</option>
                  <option value="INACTIVITY">INACTIVITY</option>
                  <option value="MAX_PRICE">MAX_PRICE</option>
                </select>
              </label>

              <label>
                <span>Max Price</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  name="maxPrice"
                  value={createForm.maxPrice}
                  onChange={handleCreateInputChange}
                />
              </label>

              <label>
                <span>Inactivity Minutes</span>
                <input
                  type="number"
                  min="0"
                  name="inactivityMinutes"
                  value={createForm.inactivityMinutes}
                  onChange={handleCreateInputChange}
                />
              </label>

              {createError ? <p className="auction-modal-error">{createError}</p> : null}

              <footer className="auction-modal-actions">
                <button type="button" className="secondary" onClick={handleCloseCreateModal}>
                  Cancelar
                </button>
                <button type="submit" className="primary" disabled={creating}>
                  {creating ? 'Creando...' : 'Crear Subasta'}
                </button>
              </footer>
            </form>
          </dialog>
        </div>
      ) : null}
    </div>
  )
}
