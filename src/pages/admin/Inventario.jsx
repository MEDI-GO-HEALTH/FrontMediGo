import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import {
  createMedicamento,
  getBranchesWithMedications,
  getInventario,
  getInventarioStats,
  getMedicationAvailabilityByBranch,
  updateMedicamentoStock,
} from '../../api/inventarioService'
import MedigoSidebarBrand from '../../components/common/MedigoSidebarBrand'
import PageLoadingOverlay from '../../components/common/PageLoadingOverlay'
import { ROUTES } from '../../constants/routes'
import useCappedLoading from '../../hooks/useCappedLoading'
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
  medicationId: Number(item?.medicationId ?? item?.id ?? 0),
  id: item?.id || item?.medicationId || item?.sku || `SKU-${String(index + 1).padStart(5, '0')}`,
  name: item?.medicationName || item?.nombre || item?.medicamento || item?.name || 'Medicamento',
  category: String(item?.categoria || item?.category || 'GENERAL').toUpperCase(),
  stock: Number(item?.stock ?? item?.quantity ?? item?.existencias ?? item?.cantidad ?? 0),
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
  const [branches, setBranches] = useState([])
  const [selectedBranchId, setSelectedBranchId] = useState('')
  const showLoader = useCappedLoading(loading, 3000)

  const applyInventoryStats = (stats) => {
    const source = stats || {}
    setAdminData((previous) => ({
      ...previous,
      totalInventoryValue: Number(source.totalInventoryValue ?? source.valorTotal ?? previous.totalInventoryValue),
      valueDeltaPct: Number(source.deltaPct ?? source.porcentajeCambio ?? previous.valueDeltaPct),
      activeLots: Number(source.activeLots ?? source.lotesActivos ?? previous.activeLots),
      allVerified: Boolean(source.allVerified ?? previous.allVerified),
    }))
  }

  useEffect(() => {
    let mounted = true

    const loadInventory = async () => {
      try {
        const branchesRes = await getBranchesWithMedications()

        const normalizedBranches = (Array.isArray(branchesRes) ? branchesRes : [])
          .map((branch) => ({
            id: Number(branch?.branchId || 0),
            name: branch?.branchName || `Sede ${branch?.branchId || ''}`,
          }))
          .filter((branch) => branch.id > 0)

        if (mounted) {
          setBranches(normalizedBranches)
        }

        const resolvedBranchId = Number(selectedBranchId || normalizedBranches[0]?.id || 0)

        if (mounted && !selectedBranchId && resolvedBranchId > 0) {
          setSelectedBranchId(String(resolvedBranchId))
        }

        const [statsRes, listRes] = await Promise.allSettled([
          getInventarioStats({
            branchId: resolvedBranchId > 0 ? resolvedBranchId : undefined,
          }),
          getInventario({
            branchId: resolvedBranchId > 0 ? resolvedBranchId : undefined,
            name: search,
          }),
        ])

        if (!mounted) {
          return
        }

        if (listRes.status === 'fulfilled') {
          const source = Array.isArray(listRes.value) ? listRes.value : []

          let rows = source
          if (search.trim() && resolvedBranchId > 0) {
            rows = await Promise.all(
              source.map(async (item) => {
                const medicationId = Number(item?.id || item?.medicationId || 0)
                if (!medicationId) {
                  return item
                }

                try {
                  const availability = await getMedicationAvailabilityByBranch(medicationId, resolvedBranchId)
                  return {
                    ...item,
                    medicationId,
                    quantity: Number(availability?.quantity ?? item?.quantity ?? 0),
                  }
                } catch {
                  return item
                }
              })
            )
          }

          if (rows.length > 0) {
            setItems(rows.map((item, index) => mapInventoryFromApi(item, index)))
          }
        }

        if (statsRes.status === 'fulfilled') {
          applyInventoryStats(statsRes.value)
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

  useEffect(() => {
    if (!selectedBranchId) {
      return
    }

    let mounted = true

    const refreshStock = async () => {
      try {
        const source = await getInventario({
          branchId: Number(selectedBranchId),
          name: search,
        })

        if (!mounted) {
          return
        }

        if (Array.isArray(source) && source.length > 0) {
          setItems(source.map((item, index) => mapInventoryFromApi(item, index)))
          return
        }

        if (!search.trim()) {
          setItems(FALLBACK_ITEMS)
        }
      } catch {
        if (mounted && !search.trim()) {
          setItems(FALLBACK_ITEMS)
        }
      }
    }

    refreshStock()

    return () => {
      mounted = false
    }
  }, [selectedBranchId, search])

  useEffect(() => {
    if (!selectedBranchId) {
      return
    }

    let mounted = true

    const refreshStatsByBranch = async () => {
      try {
        const stats = await getInventarioStats({ branchId: Number(selectedBranchId) })
        if (!mounted) {
          return
        }
        applyInventoryStats(stats)
      } catch {
        // Mantener las métricas previas si falla el backend.
      }
    }

    refreshStatsByBranch()

    return () => {
      mounted = false
    }
  }, [selectedBranchId])

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

  const refreshCurrentBranch = async () => {
    const branchId = Number(selectedBranchId || 0)
    if (!branchId) {
      return
    }

    const [inventoryRes, statsRes] = await Promise.allSettled([
      getInventario({ branchId, name: search }),
      getInventarioStats({ branchId }),
    ])

    if (inventoryRes.status === 'fulfilled') {
      const source = inventoryRes.value
      if (Array.isArray(source) && source.length > 0) {
        setItems(source.map((item, index) => mapInventoryFromApi(item, index)))
      }
    }

    if (statsRes.status === 'fulfilled') {
      applyInventoryStats(statsRes.value)
    }
  }

  const handleCreateMedication = async () => {
    const branchId = Number(selectedBranchId || 0)
    if (!branchId) {
      setBackendNotice('Seleccione una sede antes de crear un medicamento.')
      return
    }

    const name = globalThis.prompt('Nombre del medicamento:')?.trim() || ''
    if (!name) {
      return
    }

    const unit = globalThis.prompt('Unidad/presentacion (ej. tableta):')?.trim() || ''
    if (!unit) {
      return
    }

    const priceValue = Number(globalThis.prompt('Precio unitario (ej. 5000):') || 0)
    const initialStockValue = Number(globalThis.prompt('Stock inicial (ej. 100):') || 0)

    try {
      await createMedicamento({
        name,
        description: 'Creado desde panel MVP',
        unit,
        price: priceValue,
        branchId,
        initialStock: initialStockValue,
      })

      setBackendNotice('Medicamento creado correctamente.')
      await refreshCurrentBranch()
    } catch {
      setBackendNotice('No fue posible crear el medicamento. Verifique los datos requeridos por backend.')
    }
  }

  const handleUpdateStock = async (row) => {
    const branchId = Number(selectedBranchId || 0)
    const medicationId = Number(row?.medicationId || row?.id || 0)

    if (!branchId || !medicationId) {
      setBackendNotice('No se pudo identificar sede o medicamento para actualizar stock.')
      return
    }

    const requestedQuantity = Number(globalThis.prompt(`Nuevo stock para ${row.name}:`, String(row.stock || 0)))
    if (!Number.isFinite(requestedQuantity) || requestedQuantity < 0) {
      setBackendNotice('El stock debe ser un numero mayor o igual a 0.')
      return
    }

    try {
      await updateMedicamentoStock({ medicationId, branchId, quantity: requestedQuantity })
      setBackendNotice('Stock actualizado correctamente.')
      await refreshCurrentBranch()
    } catch {
      setBackendNotice('No fue posible actualizar stock en backend.')
    }
  }

  const totalRows = new Intl.NumberFormat('en-US').format(items.length)

  return (
    <div className="admin-inventory-shell">
      <PageLoadingOverlay visible={showLoader} message="Cargando inventario..." />
      <aside className="admin-side">
        <MedigoSidebarBrand
          containerClassName="admin-side-brand"
          logoContainerClassName="admin-side-logo-icon"
          title="MediGo Admin"
          subtitle="CLINICAL PRECISION"
        />

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
                <span className="material-symbols-outlined">account_circle</span>
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
            <div className="inventory-table-actions">
              <select
                value={selectedBranchId}
                onChange={(event) => setSelectedBranchId(event.target.value)}
                aria-label="Seleccionar sede para inventario"
              >
                {branches.length === 0 ? <option value="">Sedes no disponibles</option> : null}
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
              <button type="button" className="new-entry-btn" onClick={handleCreateMedication}>
                <span className="material-symbols-outlined">add</span>
                Nueva Entrada
              </button>
            </div>
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
                            <button type="button" aria-label={`Editar ${row.name}`} onClick={() => handleUpdateStock(row)}>
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
