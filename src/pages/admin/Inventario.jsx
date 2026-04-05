/**
 * Inventario.jsx — Gestión de Inventario de Medicamentos (Admin)
 *
 * 🔗 CONEXIONES AL BACKEND:
 *   src/api/inventarioService.js
 *   - getInventarioStats()  → GET /inventario/stats
 *   - getInventario(params) → GET /inventario
 *   - deleteMedicamento(id) → DELETE /inventario/:id
 *   - createMedicamento(data) [modal] → POST /inventario  (por implementar con modal)
 *   - updateMedicamento(id, data)    → PUT /inventario/:id (por implementar con modal)
 */

import { useState, useEffect } from 'react'
import { Search, Plus, Trash2, Edit2, Package, AlertTriangle, TrendingUp, ChevronDown } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import { getInventario, getInventarioStats, deleteMedicamento } from '../../api/inventarioService'

// ── Datos de demostración (reemplazar cuando el backend esté listo) ──
const MOCK_STATS = [
  { label: 'Total Medicamentos', value: '1,248', icon: Package, color: 'var(--primary)' },
  { label: 'Stock Bajo',         value: '34',    icon: AlertTriangle, color: '#ffb4ab' },
  { label: 'Valor Inventario',   value: '$4.2M', icon: TrendingUp, color: 'var(--secondary-fixed)' },
]
const MOCK_ITEMS = [
  { id: 1, nombre: 'Amoxicilina 500mg', categoria: 'Antibiótico', stock: 320, precio: '$12.500', estado: 'Disponible',  lote: 'LOT-2024-001' },
  { id: 2, nombre: 'Ibuprofeno 400mg',  categoria: 'Analgésico',  stock: 85,  precio: '$8.200',  estado: 'Bajo Stock',  lote: 'LOT-2024-002' },
  { id: 3, nombre: 'Metformina 850mg',  categoria: 'Antidiabético', stock: 512, precio: '$22.000', estado: 'Disponible', lote: 'LOT-2024-003' },
  { id: 4, nombre: 'Losartán 50mg',     categoria: 'Antihipertensivo', stock: 198, precio: '$18.500', estado: 'Disponible', lote: 'LOT-2024-004' },
  { id: 5, nombre: 'Omeprazol 20mg',    categoria: 'Gastroprotector', stock: 12,  precio: '$9.800',  estado: 'Crítico',   lote: 'LOT-2024-005' },
  { id: 6, nombre: 'Atorvastatina 20mg',categoria: 'Hipolipemiante', stock: 245, precio: '$35.000', estado: 'Disponible', lote: 'LOT-2024-006' },
]

const ESTADO_STYLES = {
  'Disponible': { background: 'rgba(0,254,102,0.12)', color: '#00e55b' },
  'Bajo Stock':  { background: 'rgba(255,180,171,0.12)', color: '#ffb4ab' },
  'Crítico':     { background: 'rgba(147,0,10,0.2)',  color: '#ffb4ab' },
}

export default function Inventario() {
  const [items,  setItems]  = useState(MOCK_ITEMS)
  const [stats,  setStats]  = useState(MOCK_STATS)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)

  // ─────────────────────────────────────────────────────────────────
  // 📡 LLAMADA AL BACKEND — getInventarioStats() + getInventario()
  //    Descomentar cuando el backend esté disponible:
  // ─────────────────────────────────────────────────────────────────
  // useEffect(() => {
  //   setLoading(true)
  //   Promise.all([getInventarioStats(), getInventario()])
  //     .then(([statsData, itemsData]) => {
  //       setStats(statsData)
  //       setItems(itemsData)
  //     })
  //     .catch(console.error)
  //     .finally(() => setLoading(false))
  // }, [])

  // ─────────────────────────────────────────────────────────────────
  // 📡 LLAMADA AL BACKEND — deleteMedicamento(id)
  //    DELETE /inventario/:id
  // ─────────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este medicamento?')) return
    try {
      // await deleteMedicamento(id)
      setItems(prev => prev.filter(i => i.id !== id))
    } catch (err) {
      alert('Error al eliminar: ' + (err?.response?.data?.message || err.message))
    }
  }

  const filtered = items.filter(i =>
    i.nombre.toLowerCase().includes(search.toLowerCase()) ||
    i.categoria.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <DashboardLayout
      title="Inventario"
      subtitle="Gestiona el stock de medicamentos de todas las sedes"
      actions={
        <button id="inventario-add-btn" className="btn-primary">
          <Plus size={16} /> Nuevo Medicamento
        </button>
      }
    >
      {/* Stats */}
      <div style={styles.statsGrid}>
        {stats.map((s, i) => (
          <div key={i} style={styles.statCard}>
            <div style={{ ...styles.statIcon, background: `${s.color}20` }}>
              <s.icon size={20} style={{ color: s.color }} />
            </div>
            <div>
              <p style={styles.statLabel}>{s.label}</p>
              <p style={{ ...styles.statValue, color: s.color }}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Buscador */}
      <div style={styles.tableCard}>
        <div style={styles.tableToolbar}>
          <div style={styles.searchBox}>
            <Search size={16} style={{ color: 'var(--outline)', flexShrink: 0 }} />
            <input
              id="inventario-search"
              type="text"
              placeholder="Buscar por nombre o categoría..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={styles.searchInput}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn-tertiary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}>Categoría <ChevronDown size={14} /></button>
            <button className="btn-tertiary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}>Estado <ChevronDown size={14} /></button>
          </div>
        </div>

        {/* Tabla */}
        <div style={{ overflowX: 'auto' }}>
          <table style={styles.table}>
            <thead>
              <tr>
                {['Medicamento', 'Categoría', 'Lote', 'Stock', 'Precio', 'Estado', 'Acciones'].map(h => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, idx) => (
                <tr key={item.id} style={{ ...styles.tr, background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                  <td style={styles.td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <div style={styles.pillIcon}><Package size={14} style={{ color: 'var(--primary)' }} /></div>
                      <span style={{ fontWeight: 600, color: 'var(--on-surface)', fontSize: '0.88rem' }}>{item.nombre}</span>
                    </div>
                  </td>
                  <td style={styles.td}><span style={styles.chip}>{item.categoria}</span></td>
                  <td style={{ ...styles.td, fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--outline)' }}>{item.lote}</td>
                  <td style={{ ...styles.td, fontWeight: 700, color: item.stock < 50 ? '#ffb4ab' : 'var(--on-surface)' }}>{item.stock}</td>
                  <td style={styles.td}>{item.precio}</td>
                  <td style={styles.td}>
                    <span style={{ ...styles.estadoBadge, ...ESTADO_STYLES[item.estado] }}>{item.estado}</span>
                  </td>
                  <td style={styles.td}>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button id={`inventario-edit-${item.id}`} className="btn-tertiary" style={{ padding: '0.4rem', minHeight: 'auto', minWidth: 'auto' }} title="Editar"><Edit2 size={14} /></button>
                      <button id={`inventario-delete-${item.id}`} className="btn-tertiary" style={{ padding: '0.4rem', minHeight: 'auto', minWidth: 'auto', color: '#ffb4ab' }} title="Eliminar" onClick={() => handleDelete(item.id)}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--on-surface-variant)' }}>
            No se encontraron medicamentos con "{search}"
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

const styles = {
  primaryBtn: { background: 'linear-gradient(135deg, #7c3aed, #a855f7)', color: '#fff', border: 'none', borderRadius: 'var(--radius-full)', padding: '0.55rem 1.25rem', fontWeight: 700, fontSize: '0.875rem', fontFamily: 'var(--font-display)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' },
  statsGrid:  { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.75rem' },
  statCard:   { background: 'var(--surface-container)', border: '1px solid rgba(74,68,85,0.25)', borderRadius: 'var(--radius-xl)', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' },
  statIcon:   { width: 44, height: 44, borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  statLabel:  { fontSize: '0.8rem', color: 'var(--on-surface-variant)', marginBottom: '0.2rem' },
  statValue:  { fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-display)' },
  tableCard:  { background: 'var(--surface-container)', border: '1px solid rgba(74,68,85,0.25)', borderRadius: 'var(--radius-xl)', overflow: 'hidden' },
  tableToolbar: { display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 1.25rem', borderBottom: '1px solid rgba(74,68,85,0.2)', flexWrap: 'wrap' },
  searchBox:  { display: 'flex', alignItems: 'center', gap: '0.6rem', background: 'var(--surface-container-high)', borderRadius: 'var(--radius-full)', padding: '0.45rem 1rem', flex: 1, minWidth: 220 },
  searchInput:{ border: 'none', background: 'none', color: 'var(--on-surface)', fontSize: '0.875rem', outline: 'none', width: '100%', padding: 0 },
  filterBtn:  { background: 'var(--surface-container-high)', border: '1px solid rgba(74,68,85,0.4)', borderRadius: 'var(--radius-full)', color: 'var(--on-surface-variant)', padding: '0.4rem 0.85rem', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' },
  table:      { width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' },
  th:         { padding: '0.85rem 1.25rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.06em', background: 'var(--surface-container-high)' },
  tr:         { borderBottom: '1px solid rgba(74,68,85,0.15)', transition: 'background var(--transition-fast)' },
  td:         { padding: '0.9rem 1.25rem', color: 'var(--on-surface-variant)' },
  pillIcon:   { width: 30, height: 30, borderRadius: 8, background: 'rgba(124,58,237,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  chip:       { background: 'var(--surface-container-high)', borderRadius: 'var(--radius-full)', padding: '3px 10px', fontSize: '0.75rem', color: 'var(--on-surface-variant)' },
  estadoBadge:{ borderRadius: 'var(--radius-full)', padding: '3px 10px', fontSize: '0.75rem', fontWeight: 600 },
  iconBtn:    { background: 'var(--surface-container-high)', border: 'none', borderRadius: 'var(--radius-md)', padding: '0.4rem', cursor: 'pointer', color: 'var(--on-surface-variant)', display: 'flex', alignItems: 'center', transition: 'background var(--transition-fast)' },
}
