/**
 * CentroSubastas.jsx — Centro de Subastas del Afiliado
 *
 * 🔗 CONEXIONES AL BACKEND:
 *   src/api/subastaService.js
 *   - getSubastas()        → GET /subastas
 *   - aceptarSubasta(id)   → POST /subastas/:id/aceptar
 *   - cancelarSubasta(id)  → DELETE /subastas/:id
 */

import { useState } from 'react'
import { Gavel, Clock, Package, TrendingDown, Plus, CheckCircle, XCircle, Filter } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'

const MOCK_SUBASTAS = [
  { id: 1, medicamento: 'Amoxicilina 500mg', cantidad: 200, ofertaBase: 2500000, mejorOferta: 1850000, ofertas: 4, tiempoRestante: '02:34:11', estado: 'Activa',   repartidor: 'Carlos M.' },
  { id: 2, medicamento: 'Insulina Glargina', cantidad: 50,  ofertaBase: 4200000, mejorOferta: 3950000, ofertas: 2, tiempoRestante: '00:45:30', estado: 'Activa',   repartidor: 'Mónica S.' },
  { id: 3, medicamento: 'Metformina 850mg',  cantidad: 300, ofertaBase: 1800000, mejorOferta: 1680000, ofertas: 6, tiempoRestante: '00:12:05', estado: 'Urgente',  repartidor: 'Juan P.' },
  { id: 4, medicamento: 'Atorvastatina 20mg',cantidad: 150, ofertaBase: 3500000, mejorOferta: 3100000, ofertas: 3, tiempoRestante: 'Finalizada', estado: 'Cerrada', repartidor: 'Carlos M.' },
]

const ESTADO_CFG = {
  'Activa':  { color: 'var(--secondary-fixed)',  bg: 'rgba(0,254,102,0.1)' },
  'Urgente': { color: '#ffb4ab', bg: 'rgba(255,180,171,0.1)' },
  'Cerrada': { color: 'var(--outline)', bg: 'rgba(74,68,85,0.2)' },
}

const fmt = (n) => `$${n.toLocaleString('es-CO')}`

export default function CentroSubastas() {
  const [subastas, setSubastas] = useState(MOCK_SUBASTAS)
  const [filter,   setFilter]   = useState('Todas')

  // ─────────────────────────────────────────────────────────────────
  // 📡 LLAMADA AL BACKEND — aceptarSubasta(id)
  //    POST /subastas/:id/aceptar
  // ─────────────────────────────────────────────────────────────────
  const handleAceptar = async (id) => {
    try {
      // await aceptarSubasta(id)
      setSubastas(prev => prev.map(s => s.id === id ? { ...s, estado: 'Cerrada' } : s))
    } catch (err) { console.error(err) }
  }

  // ─────────────────────────────────────────────────────────────────
  // 📡 LLAMADA AL BACKEND — cancelarSubasta(id)
  //    DELETE /subastas/:id
  // ─────────────────────────────────────────────────────────────────
  const handleCancelar = async (id) => {
    if (!window.confirm('¿Cancelar esta subasta?')) return
    try {
      // await cancelarSubasta(id)
      setSubastas(prev => prev.filter(s => s.id !== id))
    } catch (err) { console.error(err) }
  }

  const filters = ['Todas', 'Activa', 'Urgente', 'Cerrada']
  const filtered = filter === 'Todas' ? subastas : subastas.filter(s => s.estado === filter)

  return (
    <DashboardLayout
      title="Centro de Subastas"
      subtitle="Gestiona las subastas de medicamentos en tiempo real"
      actions={
        <button id="subasta-new-btn" style={styles.primaryBtn}><Plus size={16} /> Nueva Subasta</button>
      }
    >
      {/* Filtros */}
      <div style={styles.filterBar}>
        <Filter size={15} style={{ color: 'var(--outline)' }} />
        {filters.map(f => (
          <button key={f} id={`filter-${f.toLowerCase()}`} onClick={() => setFilter(f)} style={{ ...styles.filterChip, ...(filter === f ? styles.filterChipActive : {}) }}>{f}</button>
        ))}
      </div>

      {/* Tarjetas de subasta */}
      <div style={styles.grid}>
        {filtered.map(s => {
          const ec = ESTADO_CFG[s.estado]
          const pct = Math.round((s.mejorOferta / s.ofertaBase) * 100)
          return (
            <div key={s.id} style={{ ...styles.card, ...(s.estado === 'Urgente' ? { borderColor: 'rgba(255,180,171,0.4)', boxShadow: '0 0 12px rgba(255,180,171,0.08)' } : {}) }}>
              <div style={styles.cardHeader}>
                <div style={styles.medIcon}><Package size={18} style={{ color: 'var(--primary)' }} /></div>
                <div style={{ flex: 1 }}>
                  <h3 style={styles.medName}>{s.medicamento}</h3>
                  <p style={styles.medQty}>Cantidad: <strong>{s.cantidad} unidades</strong></p>
                </div>
                <span style={{ ...styles.estadoBadge, background: ec.bg, color: ec.color }}>{s.estado}</span>
              </div>

              <div style={styles.ofertaSection}>
                <div>
                  <p style={styles.ofertaLabel}>Oferta base</p>
                  <p style={styles.ofertaBase}>{fmt(s.ofertaBase)}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={styles.ofertaLabel}>Mejor oferta</p>
                  <p style={{ ...styles.mejorOferta, color: s.estado === 'Cerrada' ? 'var(--outline)' : 'var(--secondary-fixed)' }}>{fmt(s.mejorOferta)}</p>
                </div>
              </div>

              {/* Barra de progreso */}
              <div style={styles.progressBar}>
                <div style={{ ...styles.progressFill, width: `${100 - pct + 60}%`, background: s.estado === 'Urgente' ? 'linear-gradient(90deg, #ff6b6b, #ffb4ab)' : 'linear-gradient(90deg, #7c3aed, #00fe66)' }} />
              </div>
              <p style={styles.progressLabel}><TrendingDown size={12} /> Ahorro del {100 - pct}% sobre precio base · <strong>{s.ofertas} ofertas</strong></p>

              <div style={styles.cardFooter}>
                <div style={styles.timerBox}>
                  <Clock size={13} style={{ color: s.estado === 'Urgente' ? '#ffb4ab' : 'var(--outline)' }} />
                  <span style={{ color: s.estado === 'Urgente' ? '#ffb4ab' : 'var(--on-surface-variant)', fontSize: '0.8rem' }}>{s.tiempoRestante}</span>
                </div>
                {s.estado !== 'Cerrada' && (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button id={`subasta-cancel-${s.id}`} onClick={() => handleCancelar(s.id)} style={styles.cancelBtn}><XCircle size={14} /></button>
                    <button id={`subasta-accept-${s.id}`} onClick={() => handleAceptar(s.id)} style={styles.acceptBtn}><CheckCircle size={14} /> Aceptar</button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </DashboardLayout>
  )
}

const styles = {
  primaryBtn:   { background: 'linear-gradient(135deg, #7c3aed, #a855f7)', color: '#fff', border: 'none', borderRadius: 'var(--radius-full)', padding: '0.55rem 1.25rem', fontWeight: 700, fontSize: '0.875rem', fontFamily: 'var(--font-display)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' },
  filterBar:    { display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' },
  filterChip:   { border: '1px solid rgba(74,68,85,0.4)', background: 'var(--surface-container)', borderRadius: 'var(--radius-full)', padding: '0.35rem 1rem', fontSize: '0.82rem', color: 'var(--on-surface-variant)', cursor: 'pointer' },
  filterChipActive: { background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.4)', color: 'var(--primary)', fontWeight: 600 },
  grid:         { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' },
  card:         { background: 'var(--surface-container)', border: '1px solid rgba(74,68,85,0.25)', borderRadius: 'var(--radius-2xl)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' },
  cardHeader:   { display: 'flex', alignItems: 'flex-start', gap: '0.85rem' },
  medIcon:      { width: 42, height: 42, borderRadius: 12, background: 'rgba(124,58,237,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  medName:      { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', color: 'var(--on-surface)', marginBottom: '0.2rem' },
  medQty:       { fontSize: '0.8rem', color: 'var(--on-surface-variant)' },
  estadoBadge:  { fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: 'var(--radius-full)', flexShrink: 0 },
  ofertaSection:{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' },
  ofertaLabel:  { fontSize: '0.72rem', color: 'var(--outline)', marginBottom: 2 },
  ofertaBase:   { fontSize: '1rem', fontFamily: 'var(--font-display)', color: 'var(--on-surface-variant)', textDecoration: 'line-through' },
  mejorOferta:  { fontSize: '1.4rem', fontFamily: 'var(--font-display)', fontWeight: 800 },
  progressBar:  { height: 6, background: 'var(--surface-container-highest)', borderRadius: 'var(--radius-full)', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 'var(--radius-full)', transition: 'width 0.5s ease' },
  progressLabel:{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', display: 'flex', alignItems: 'center', gap: '0.3rem' },
  cardFooter:   { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' },
  timerBox:     { display: 'flex', alignItems: 'center', gap: '0.35rem' },
  cancelBtn:    { background: 'rgba(255,180,171,0.1)', border: 'none', borderRadius: 'var(--radius-full)', padding: '0.4rem', cursor: 'pointer', color: '#ffb4ab', display: 'flex', alignItems: 'center' },
  acceptBtn:    { background: 'rgba(0,254,102,0.15)', border: 'none', borderRadius: 'var(--radius-full)', padding: '0.4rem 1rem', cursor: 'pointer', color: '#00e55b', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem', fontWeight: 700 },
}
