import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { getInventario, getInventarioStats } from '../../api/inventarioService'
import { ROUTES } from '../../constants/routes'
import '../../styles/admin/inventario.css'

const FALLBACK_ITEMS = [
  {
    id: 'SKU-29384-CH',
    name: 'Atorvastatin 20mg',
    category: 'CARDIOVASCULAR',
    stock: 2400,
    unitPrice: 42,
    minStock: 250,
    icon: 'medication',
  },
  {
    id: 'SKU-10293-AB',
    name: 'Amoxicillin 500mg',
    category: 'ANTIBIOTICO',
    stock: 12,
    unitPrice: 18.5,
    minStock: 100,
    icon: 'medication',
  },
  {
    id: 'SKU-55421-VC',
    name: 'Influenza Vaccine',
    category: 'INMUNIZACION',
    stock: 450,
    unitPrice: 125,
    minStock: 300,
    icon: 'vaccines',
  },
]

const FALLBACK_ADMIN = {
  adminName: 'Dr. Aris Thorne',
  roleLabel: 'ADMINISTRATOR',
  totalInventoryValue: 1248390.42,
  valueDeltaPct: 4.2,
  activeLots: 1482,
  allVerified: true,
}

const formatMoney = (value, currency = 'USD') =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0)

const formatUnits = (value) => `${new Intl.NumberFormat('en-US').format(Number(value) || 0)} Unidades`

const getStockTone = (row) => {
  const min = Number(row.minStock || 1)
  const current = Number(row.stock || 0)
  const ratio = min > 0 ? current / min : current

  if (ratio < 0.35) {
    return { label: 'Critico Bajo', tone: 'critical', percent: Math.max(6, Math.round(ratio * 100)) }
  }

  if (ratio < 1) {
    return { label: 'Adecuado', tone: 'medium', percent: Math.max(20, Math.round(ratio * 100)) }
  }

  return { label: 'Optimo', tone: 'good', percent: Math.min(100, Math.round(ratio * 100)) }
}

const mapInventoryFromApi = (item, index) => ({
  id: item?.id || item?.sku || `SKU-${String(index + 1).padStart(5, '0')}`,
  name: item?.nombre || item?.medicamento || item?.name || 'Medicamento',
  category: String(item?.categoria || item?.category || 'GENERAL').toUpperCase(),
  stock: Number(item?.stock ?? item?.existencias ?? item?.cantidad ?? 0),
  unitPrice: Number(item?.precioUnitario ?? item?.precio ?? item?.unitPrice ?? 0),
  minStock: Number(item?.stockMinimo ?? item?.minStock ?? 100),
  icon: item?.icon || 'medication',
})

export default function Inventario() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [items, setItems] = useState(FALLBACK_ITEMS)
  const [adminData, setAdminData] = useState(FALLBACK_ADMIN)
  const [loading, setLoading] = useState(true)
  const [backendNotice, setBackendNotice] = useState('')

  useEffect(() => {
    let mounted = true

    const loadInventory = async () => {
      try {
        const [statsRes, listRes] = await Promise.allSettled([
          getInventarioStats(),
          getInventario({ page: 1, limit: 12 }),
        ])

        if (!mounted) {
          return
        }

        if (listRes.status === 'fulfilled') {
          const source = listRes.value?.data || listRes.value
          if (Array.isArray(source) && source.length > 0) {
            setItems(source.map((item, index) => mapInventoryFromApi(item, index)))
          }
        }

        if (statsRes.status === 'fulfilled') {
          const stats = statsRes.value || {}
          setAdminData((previous) => ({
            ...previous,
            totalInventoryValue: Number(stats.totalInventoryValue ?? stats.valorTotal ?? previous.totalInventoryValue),
            valueDeltaPct: Number(stats.deltaPct ?? stats.porcentajeCambio ?? previous.valueDeltaPct),
            activeLots: Number(stats.activeLots ?? stats.lotesActivos ?? previous.activeLots),
            allVerified: Boolean(stats.allVerified ?? previous.allVerified),
          }))
        }

        if (statsRes.status === 'rejected' || listRes.status === 'rejected') {
          setBackendNotice('No fue posible sincronizar todos los datos del backend. Se muestra informacion de respaldo.')
        }
      } catch {
        if (mounted) {
          setBackendNotice('Backend no disponible por ahora. Se muestra informacion de respaldo.')
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadInventory()

    return () => {
      mounted = false
    }
  }, [])

  const criticalItems = useMemo(() => items.filter((row) => getStockTone(row).tone === 'critical').slice(0, 2), [items])

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) {
      return items
    }

    return items.filter((row) => `${row.id} ${row.name} ${row.category}`.toLowerCase().includes(query))
  }, [items, search])

  const handleLogout = () => {
    localStorage.removeItem('medigo_token')
    localStorage.removeItem('medigo_user')
    navigate(ROUTES.AUTH.LOGIN, { replace: true })
  }

  const totalRows = new Intl.NumberFormat('en-US').format(items.length)

  return (
    <div className="admin-inventory-shell">
      <aside className="admin-side">
        <div className="admin-side-brand">
          <div className="admin-side-logo-icon">
            <span className="material-symbols-outlined">clinical_notes</span>
          </div>
          <div>
            <h1>MediGo Admin</h1>
            <p>CLINICAL PRECISION</p>
          </div>
        </div>

        <nav className="admin-side-nav" aria-label="Navegacion de administrador">
          <button type="button" onClick={() => navigate(ROUTES.ADMIN.AUCTIONS)}>
            <span className="material-symbols-outlined">gavel</span>
            Subastas
          </button>
          <button type="button" className="active" onClick={() => navigate(ROUTES.ADMIN.INVENTORY)}>
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
              inventory_2
            </span>
            Inventario
          </button>
          <button type="button" onClick={() => navigate(ROUTES.ADMIN.BRANCHES)}>
            <span className="material-symbols-outlined">account_tree</span>
            Sedes/Sucursales
          </button>
          <button type="button" onClick={() => navigate(ROUTES.ADMIN.USERS)}>
            <span className="material-symbols-outlined">group</span>
            Usuarios
          </button>
        </nav>

        <div className="admin-side-footer">
          <button type="button">
            <span className="material-symbols-outlined">help</span>
            Soporte
          </button>
          <button type="button" className="danger" onClick={handleLogout}>
            <span className="material-symbols-outlined">logout</span>
            Cerrar Sesion
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <label className="admin-top-search" aria-label="Buscar en inventario">
            <span className="material-symbols-outlined">search</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar en inventario, SKU o composicion quimica..."
            />
          </label>

          <div className="admin-top-right">
            <button type="button" className="admin-top-icon" aria-label="Notificaciones">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <button type="button" className="admin-top-icon" aria-label="Configuracion">
              <span className="material-symbols-outlined">settings</span>
            </button>
            <div className="admin-top-separator" />
            <div className="admin-profile-wrap">
              <div>
                <strong>{adminData.adminName}</strong>
                <small>{adminData.roleLabel}</small>
              </div>
              <div className="admin-avatar-placeholder" aria-label="Placeholder de imagen de perfil">
                IMG
              </div>
            </div>
          </div>
        </header>

        <div className="admin-content">
          <section className="inventory-hero">
            <div>
              <h2>Gestion de Inventario</h2>
              <p>
                Seguimiento de precision para suministros clinicos. Mantenga niveles optimos de stock con analisis en
                tiempo real y disparadores de adquisicion automatizados.
              </p>
            </div>

            <button type="button" className="new-entry-btn">
              <span className="material-symbols-outlined">add</span>
              Nueva Entrada
            </button>
          </section>

          {backendNotice ? <p className="inventory-notice">{backendNotice}</p> : null}

          <section className="inventory-stat-grid" aria-label="Indicadores de inventario">
            <article className="critical-card">
              <div className="critical-head">
                <strong>
                  <span className="material-symbols-outlined">warning</span>
                  Alertas de Stock Bajo
                </strong>
                <span>ACCION REQUERIDA</span>
              </div>

              <div className="critical-list">
                {(criticalItems.length > 0 ? criticalItems : FALLBACK_ITEMS.slice(1, 3)).map((item) => (
                  <div key={item.id} className="critical-item">
                    <div>
                      <p>{item.name}</p>
                      <small>
                        {item.category} - {item.stock} unidades restantes
                      </small>
                    </div>
                    <span className="material-symbols-outlined">trending_down</span>
                  </div>
                ))}
              </div>

              <button type="button" className="critical-link">
                Revisar todo el stock critico
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </article>

            <div className="health-grid">
              <article className="health-card">
                <div>
                  <p>Valor Total del Inventario</p>
                  <strong>{formatMoney(adminData.totalInventoryValue)}</strong>
                  <small>
                    <span className="material-symbols-outlined">trending_up</span>
                    +{adminData.valueDeltaPct}% desde el mes pasado
                  </small>
                </div>
                <span className="material-symbols-outlined bg-symbol">payments</span>
              </article>

              <article className="health-card">
                <div>
                  <p>Lotes Activos</p>
                  <strong>{new Intl.NumberFormat('en-US').format(adminData.activeLots)}</strong>
                  <small>
                    <span className="material-symbols-outlined">check_circle</span>
                    {adminData.allVerified ? 'Todas las unidades verificadas' : 'Revision pendiente'}
                  </small>
                </div>
                <span className="material-symbols-outlined bg-symbol">inventory_2</span>
              </article>
            </div>
          </section>

          <section className="inventory-table-card" aria-label="Repositorio de medicamentos">
            <div className="inventory-table-head">
              <h3>Repositorio de Medicamentos</h3>
              <div className="inventory-table-actions">
                <button type="button">
                  <span className="material-symbols-outlined">filter_list</span>
                  Filtrar Categoria
                </button>
                <button type="button">
                  <span className="material-symbols-outlined">download</span>
                  Exportar CSV
                </button>
              </div>
            </div>

            <div className="inventory-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>NOMBRE DEL MEDICAMENTO</th>
                    <th>CATEGORIA</th>
                    <th>NIVEL DE STOCK</th>
                    <th>PRECIO UNITARIO</th>
                    <th>ESTADO</th>
                    <th className="actions">ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row) => {
                    const stockMeta = getStockTone(row)
                    return (
                      <tr key={row.id}>
                        <td>
                          <div className="medicine-cell">
                            <div className="medicine-icon">
                              <span className="material-symbols-outlined">{row.icon}</span>
                            </div>
                            <div>
                              <p>{row.name}</p>
                              <small>{row.id}</small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="category-chip">{row.category}</span>
                        </td>
                        <td>
                          <div className="stock-cell">
                            <strong className={stockMeta.tone === 'critical' ? 'critical' : ''}>{formatUnits(row.stock)}</strong>
                            <div className="stock-bar">
                              <span className={stockMeta.tone} style={{ width: `${stockMeta.percent}%` }} />
                            </div>
                          </div>
                        </td>
                        <td>
                          <strong className="price-cell">{formatMoney(row.unitPrice)}</strong>
                        </td>
                        <td>
                          <span className={`status-pill ${stockMeta.tone}`}>{stockMeta.label}</span>
                        </td>
                        <td>
                          <div className="action-btns">
                            <button type="button" aria-label={`Editar ${row.name}`}>
                              <span className="material-symbols-outlined">edit</span>
                            </button>
                            <button type="button" aria-label={`Mas opciones ${row.name}`}>
                              <span className="material-symbols-outlined">more_vert</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {filteredRows.length === 0 ? (
              <div className="empty-table">No hay resultados para "{search}".</div>
            ) : null}

            <div className="inventory-footer-row">
              <p>Mostrando 1-{filteredRows.length} de {totalRows} entradas</p>
              <div className="pager">
                <button type="button" className="active">1</button>
                <button type="button">2</button>
                <button type="button">3</button>
                <span>...</span>
                <button type="button">124</button>
              </div>
            </div>
          </section>

          <footer className="inventory-legal">Arquitectura del Sistema MediGo - v4.2.0 - Asegurado con encriptacion de 256 bits</footer>
        </div>
      </main>

      {loading ? <div className="inventory-loading">Sincronizando inventario...</div> : null}
    </div>
  )
}
