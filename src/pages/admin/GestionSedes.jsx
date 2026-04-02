/**
 * GestionSedes.jsx — Gestión de Sedes Farmacéuticas (Admin)
 *
 * 🔗 CONEXIONES AL BACKEND:
 *   src/api/sedesService.js
 *   - getSedes()       → GET /sedes
 *   - createSede(data) → POST /sedes
 *   - updateSede(id)   → PUT /sedes/:id
 *   - deleteSede(id)   → DELETE /sedes/:id
 */

import { useState } from 'react'
import { Building2, MapPin, Phone, Plus, Edit2, Trash2, Search } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'

const MOCK_SEDES = [
  { id: 1, nombre: 'Sede Norte',      ciudad: 'Bogotá',     direccion: 'Cra 15 #120-45',     telefono: '601-234-5678', estado: 'Activa',   usuarios: 12, medicamentos: 340 },
  { id: 2, nombre: 'Sede Sur',        ciudad: 'Bogotá',     direccion: 'Av. 68 #45-20',      telefono: '601-876-5432', estado: 'Activa',   usuarios: 8,  medicamentos: 218 },
  { id: 3, nombre: 'Sede El Poblado', ciudad: 'Medellín',   direccion: 'Cra 43a #10-50',     telefono: '604-223-4567', estado: 'Activa',   usuarios: 15, medicamentos: 512 },
  { id: 4, nombre: 'Sede Centro',     ciudad: 'Cali',       direccion: 'Calle 15 #6-54',     telefono: '602-445-6789', estado: 'Inactiva', usuarios: 3,  medicamentos: 87 },
  { id: 5, nombre: 'Sede Laureles',   ciudad: 'Medellín',   direccion: 'Cra 80 #34-15',      telefono: '604-789-1234', estado: 'Activa',   usuarios: 9,  medicamentos: 265 },
]

export default function GestionSedes() {
  const [sedes,  setSedes]  = useState(MOCK_SEDES)
  const [search, setSearch] = useState('')

  // ─────────────────────────────────────────────────────────────────
  // 📡 LLAMADA AL BACKEND — deleteSede(id)
  //    DELETE /sedes/:id
  // ─────────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar esta sede?')) return
    try {
      // await deleteSede(id)
      setSedes(prev => prev.filter(s => s.id !== id))
    } catch (err) { console.error(err) }
  }

  const filtered = sedes.filter(s =>
    s.nombre.toLowerCase().includes(search.toLowerCase()) ||
    s.ciudad.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <DashboardLayout
      title="Gestión de Sedes"
      subtitle="Administra las sedes y farmacias de la red MediGo"
      actions={
        <button id="sedes-add-btn" style={styles.primaryBtn}><Plus size={16} /> Nueva Sede</button>
      }
    >
      <div style={styles.statsRow}>
        {[
          { label: 'Total Sedes',    value: sedes.length,                             color: 'var(--primary)' },
          { label: 'Activas',        value: sedes.filter(s => s.estado === 'Activa').length, color: 'var(--secondary-fixed)' },
          { label: 'Medicamentos',   value: sedes.reduce((a, s) => a + s.medicamentos, 0),   color: 'var(--tertiary)' },
        ].map((s, i) => (
          <div key={i} style={styles.statCard}>
            <p style={styles.statLabel}>{s.label}</p>
            <p style={{ ...styles.statValue, color: s.color }}>{s.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div style={styles.tableCard}>
        <div style={styles.toolbar}>
          <div style={styles.searchBox}>
            <Search size={15} style={{ color: 'var(--outline)' }} />
            <input id="sedes-search" type="text" placeholder="Buscar sede o ciudad..." value={search} onChange={e => setSearch(e.target.value)} style={styles.searchInput} />
          </div>
        </div>

        <div style={styles.grid}>
          {filtered.map(s => (
            <div key={s.id} style={styles.sedeCard}>
              <div style={styles.sedeHeader}>
                <div style={styles.sedeIconWrap}><Building2 size={18} style={{ color: 'var(--primary)' }} /></div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <h3 style={styles.sedeName}>{s.nombre}</h3>
                  <span style={{ ...styles.estadoBadge, background: s.estado === 'Activa' ? 'rgba(0,254,102,0.1)' : 'rgba(255,180,171,0.1)', color: s.estado === 'Activa' ? '#00e55b' : '#ffb4ab' }}>{s.estado}</span>
                </div>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  <button id={`sede-edit-${s.id}`} style={styles.iconBtn}><Edit2 size={13} /></button>
                  <button id={`sede-delete-${s.id}`} style={{ ...styles.iconBtn, color: '#ffb4ab' }} onClick={() => handleDelete(s.id)}><Trash2 size={13} /></button>
                </div>
              </div>
              <div style={styles.sedeInfo}>
                <div style={styles.infoRow}><MapPin size={13} style={{ color: 'var(--outline)', flexShrink: 0 }} /><span>{s.direccion}, {s.ciudad}</span></div>
                <div style={styles.infoRow}><Phone size={13} style={{ color: 'var(--outline)', flexShrink: 0 }} /><span>{s.telefono}</span></div>
              </div>
              <div style={styles.sedeFooter}>
                <div style={styles.footerStat}><span style={styles.footerNum}>{s.usuarios}</span><span style={styles.footerLabel}>Usuarios</span></div>
                <div style={styles.footerDivider} />
                <div style={styles.footerStat}><span style={styles.footerNum}>{s.medicamentos}</span><span style={styles.footerLabel}>Medicamentos</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}

const styles = {
  primaryBtn:  { background: 'linear-gradient(135deg, #7c3aed, #a855f7)', color: '#fff', border: 'none', borderRadius: 'var(--radius-full)', padding: '0.55rem 1.25rem', fontWeight: 700, fontSize: '0.875rem', fontFamily: 'var(--font-display)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' },
  statsRow:    { display: 'flex', gap: '1rem', marginBottom: '1.75rem' },
  statCard:    { flex: 1, background: 'var(--surface-container)', border: '1px solid rgba(74,68,85,0.25)', borderRadius: 'var(--radius-xl)', padding: '1.1rem 1.5rem' },
  statLabel:   { fontSize: '0.8rem', color: 'var(--on-surface-variant)', marginBottom: 4 },
  statValue:   { fontSize: '1.6rem', fontWeight: 800, fontFamily: 'var(--font-display)' },
  tableCard:   { background: 'var(--surface-container)', border: '1px solid rgba(74,68,85,0.25)', borderRadius: 'var(--radius-xl)', overflow: 'hidden', padding: '1.25rem' },
  toolbar:     { marginBottom: '1.25rem' },
  searchBox:   { display: 'flex', alignItems: 'center', gap: '0.6rem', background: 'var(--surface-container-high)', borderRadius: 'var(--radius-full)', padding: '0.5rem 1rem', maxWidth: 360 },
  searchInput: { border: 'none', background: 'none', color: 'var(--on-surface)', fontSize: '0.875rem', outline: 'none', width: '100%', padding: 0 },
  grid:        { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' },
  sedeCard:    { background: 'var(--surface-container-high)', borderRadius: 'var(--radius-xl)', padding: '1.25rem', border: '1px solid rgba(74,68,85,0.2)', transition: 'border-color var(--transition-fast)' },
  sedeHeader:  { display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '1rem' },
  sedeIconWrap:{ width: 38, height: 38, borderRadius: 10, background: 'rgba(124,58,237,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  sedeName:    { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', color: 'var(--on-surface)', marginBottom: '0.3rem' },
  estadoBadge: { fontSize: '0.72rem', fontWeight: 600, padding: '2px 8px', borderRadius: 'var(--radius-full)' },
  sedeInfo:    { display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1rem' },
  infoRow:     { display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--on-surface-variant)' },
  sedeFooter:  { display: 'flex', borderTop: '1px solid rgba(74,68,85,0.2)', paddingTop: '0.85rem', alignItems: 'center', gap: '1rem' },
  footerStat:  { display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 },
  footerNum:   { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.2rem', color: 'var(--on-surface)' },
  footerLabel: { fontSize: '0.72rem', color: 'var(--outline)' },
  footerDivider:{ width: 1, height: 30, background: 'rgba(74,68,85,0.3)' },
  iconBtn:     { background: 'var(--surface-container)', border: 'none', borderRadius: 'var(--radius-md)', padding: '0.4rem', cursor: 'pointer', color: 'var(--on-surface-variant)', display: 'flex', alignItems: 'center' },
}
