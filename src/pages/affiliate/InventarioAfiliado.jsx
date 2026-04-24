import { useEffect, useMemo, useState } from 'react'
import { getBranchStock, getBranchesWithMedications } from '../../api/inventarioService'
import CarritoPanel from '../../components/affiliate/CarritoPanel'
import DisponibilidadModal from '../../components/affiliate/DisponibilidadModal'
import PageLoadingOverlay from '../../components/common/PageLoadingOverlay'
import AffiliateShell from '../../components/layout/AffiliateShell'
import { useCart } from '../../context/CartContext'
import useCappedLoading from '../../hooks/useCappedLoading'
import '../../styles/affiliate/inventario-afiliado.css'

const CRITICAL_STOCK_THRESHOLD = 20

const mapBranch = (branch) => ({
  id: Number(branch?.branchId ?? branch?.id ?? 0),
  name: branch?.branchName || branch?.name || `Sede ${branch?.branchId ?? branch?.id ?? ''}`,
})

const mapStock = (item, index) => ({
  medicationId: Number(item?.medicationId ?? item?.id ?? 0),
  name: item?.medicationName || item?.name || `Medicamento ${index + 1}`,
  unit: item?.unit || 'unidad',
  quantity: Number(item?.quantity ?? 0),
  unitPrice: Number(item?.unitPrice ?? 0),
  isAvailable: Boolean(item?.isAvailable ?? Number(item?.quantity ?? 0) > 0),
})

export default function InventarioAfiliado() {
  const [branches, setBranches] = useState([])
  const [selectedBranchId, setSelectedBranchId] = useState('')
  const [rows, setRows] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedMedication, setSelectedMedication] = useState(null)
  const showLoader = useCappedLoading(loading, 3000)

  const { cartCount, addItem, notification, isOpen, setIsOpen, syncBranch } = useCart()

  // Sincronizar el carrito cuando cambia la sucursal
  useEffect(() => {
    if (selectedBranchId) {
      syncBranch(Number(selectedBranchId))
    }
  }, [selectedBranchId, syncBranch])

  useEffect(() => {
    let mounted = true

    const loadBranches = async () => {
      setLoading(true)
      setError('')

      try {
        const result = await getBranchesWithMedications()
        if (!mounted) {
          return
        }

        const parsed = (Array.isArray(result) ? result : []).map(mapBranch).filter((branch) => branch.id > 0)
        setBranches(parsed)
        setSelectedBranchId((current) => current || String(parsed[0]?.id || ''))
      } catch {
        if (mounted) {
          setError('No se pudo consultar las sedes disponibles para inventario.')
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadBranches()
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (!selectedBranchId) {
      return
    }

    let mounted = true

    const loadBranchInventory = async () => {
      setLoading(true)
      setError('')

      try {
        const result = await getBranchStock(Number(selectedBranchId))
        if (!mounted) {
          return
        }

        const parsed = (Array.isArray(result) ? result : [])
          .map((item, index) => mapStock(item, index))
          .filter((item) => item.isAvailable && item.quantity > CRITICAL_STOCK_THRESHOLD)

        setRows(parsed)
      } catch {
        if (mounted) {
          setRows([])
          setError('No se pudo cargar el inventario de la sede seleccionada.')
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadBranchInventory()

    return () => {
      mounted = false
    }
  }, [selectedBranchId])

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) {
      return rows
    }

    return rows.filter((row) => row.name.toLowerCase().includes(term))
  }, [rows, search])

  const handleAddToCart = (medication) => {
    addItem(medication, selectedBranchId)
  }

  const handleVerDisponibilidad = (row) => {
    setSelectedMedication(row)
  }

  const formatPrice = (value) => {
    const num = Number(value)
    if (!num) {
      return '—'
    }
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(num)
  }

  return (
    <AffiliateShell active="inventory">
      <PageLoadingOverlay visible={showLoader} message="Cargando inventario por sede..." />

      {/* Notificación toast */}
      {notification ? (
        <div
          className={`cart-notification cart-notification--${notification.type}`}
          role="status"
          aria-live="polite"
        >
          <span className="material-symbols-outlined">
            {notification.type === 'success' ? 'check_circle' : 'error'}
          </span>
          {notification.message}
        </div>
      ) : null}

      <header className="affiliate-inventory-header">
        <div className="affiliate-inventory-header-row">
          <div>
            <h2>Inventario por Sucursal</h2>
            <p>
              Vista de consulta para afiliados. Solo se muestran medicamentos disponibles y no críticos (stock mayor a
              {` ${CRITICAL_STOCK_THRESHOLD} `}
              unidades).
            </p>
          </div>

          {/* Botón del carrito con badge de cantidad */}
          <button
            type="button"
            className="cart-toggle-btn"
            aria-label={`Abrir carrito. ${cartCount} producto(s) en el carrito`}
            onClick={() => setIsOpen(!isOpen)}
          >
            <span className="material-symbols-outlined">shopping_cart</span>
            {cartCount > 0 ? (
              <span className="cart-badge" aria-hidden="true">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            ) : null}
          </button>
        </div>
      </header>

      <section className="affiliate-inventory-toolbar" aria-label="Filtros de inventario">
        <label>
          Sucursal
          <select
            value={selectedBranchId}
            onChange={(event) => setSelectedBranchId(event.target.value)}
            disabled={loading || branches.length === 0}
          >
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Buscar medicamento
          <input
            type="text"
            value={search}
            placeholder="Ej: Acetaminofen"
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
      </section>

      {error ? <p className="affiliate-inventory-error">{error}</p> : null}

      <section className="affiliate-inventory-table-wrap" aria-label="Resultados de inventario">
        {loading ? (
          <div className="affiliate-inventory-state">Cargando inventario...</div>
        ) : filteredRows.length === 0 ? (
          <div className="affiliate-inventory-state">No hay medicamentos no críticos para la sede seleccionada.</div>
        ) : (
          <table className="affiliate-inventory-table">
            <thead>
              <tr>
                <th>Medicamento</th>
                <th>Unidad</th>
                <th>Stock</th>
                <th>Precio</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => {
                const hasStock = row.quantity > 0
                return (
                  <tr key={`${row.medicationId}-${row.name}`}>
                    <td>{row.name}</td>
                    <td>{row.unit}</td>
                    <td>{row.quantity}</td>
                    <td>{formatPrice(row.unitPrice)}</td>
                    <td>
                      {/* Indicador visual: verde disponible / rojo sin stock (HU-03 + HU-04) */}
                      {hasStock ? (
                        <span className="affiliate-inventory-ok">
                          <span className="material-symbols-outlined" style={{ fontSize: '0.85rem' }}>check_circle</span>
                          Disponible
                        </span>
                      ) : (
                        <span className="affiliate-inventory-no-stock">
                          <span className="material-symbols-outlined" style={{ fontSize: '0.85rem' }}>cancel</span>
                          Sin stock
                        </span>
                      )}
                    </td>
                    <td className="affiliate-inventory-actions">
                      {/* Botón: Ver disponibilidad por sucursal (HU-04) */}
                      <button
                        type="button"
                        className="disp-open-btn"
                        aria-label={`Ver disponibilidad de ${row.name} en sucursales`}
                        onClick={() => handleVerDisponibilidad(row)}
                      >
                        <span className="material-symbols-outlined">store</span>
                        Sucursales
                      </button>
                      {/* Botón: Agregar al carrito (HU-03) */}
                      <button
                        type="button"
                        className="cart-add-btn"
                        disabled={!hasStock}
                        aria-label={`Agregar ${row.name} al carrito`}
                        onClick={() => handleAddToCart(row)}
                      >
                        <span className="material-symbols-outlined">add_shopping_cart</span>
                        Agregar
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </section>

      {/* Panel del carrito (HU-03) */}
      <CarritoPanel branchId={Number(selectedBranchId) || null} />

      {/* Modal de disponibilidad por sucursal (HU-04) */}
      {selectedMedication ? (
        <DisponibilidadModal
          medication={selectedMedication}
          branches={branches}
          selectedBranchId={selectedBranchId}
          onClose={() => setSelectedMedication(null)}
        />
      ) : null}
    </AffiliateShell>
  )
}
