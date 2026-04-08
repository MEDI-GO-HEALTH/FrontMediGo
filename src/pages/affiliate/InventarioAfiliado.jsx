import { useEffect, useMemo, useState } from 'react'
import { getBranchStock, getBranchesWithMedications } from '../../api/inventarioService'
import PageLoadingOverlay from '../../components/common/PageLoadingOverlay'
import AffiliateShell from '../../components/layout/AffiliateShell'
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
  isAvailable: Boolean(item?.isAvailable ?? Number(item?.quantity ?? 0) > 0),
})

export default function InventarioAfiliado() {
  const [branches, setBranches] = useState([])
  const [selectedBranchId, setSelectedBranchId] = useState('')
  const [rows, setRows] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const showLoader = useCappedLoading(loading, 3000)

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

  return (
    <AffiliateShell active="inventory">
      <PageLoadingOverlay visible={showLoader} message="Cargando inventario por sede..." />
      <header className="affiliate-inventory-header">
        <h2>Inventario por Sucursal</h2>
        <p>
          Vista de consulta para afiliados. Solo se muestran medicamentos disponibles y no criticos (stock mayor a
          {` ${CRITICAL_STOCK_THRESHOLD} `}
          unidades).
        </p>
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
          <div className="affiliate-inventory-state">No hay medicamentos no criticos para la sede seleccionada.</div>
        ) : (
          <table className="affiliate-inventory-table">
            <thead>
              <tr>
                <th>Medicamento</th>
                <th>Unidad</th>
                <th>Stock</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr key={`${row.medicationId}-${row.name}`}>
                  <td>{row.name}</td>
                  <td>{row.unit}</td>
                  <td>{row.quantity}</td>
                  <td>
                    <span className="affiliate-inventory-ok">Disponible</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </AffiliateShell>
  )
}