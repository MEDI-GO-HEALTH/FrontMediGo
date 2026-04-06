/**
 * GestionSubastas.jsx — Gestión de Subastas para Repartidor
 *
 * 🔗 CONEXIONES AL BACKEND:
 *   src/api/subastaService.js
 *   - getSubastasDisponibles() → GET /subastas/disponibles
 *   - pujarSubasta(id, monto)  → POST /subastas/:id/pujar  { monto }
 */

import { useState } from 'react'
import { Gavel, Package, Clock, MapPin, DollarSign, TrendingUp, Send } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'

const MOCK_SUBASTAS_DISP = [
  { id: 1, medicamento: 'Amoxicilina 500mg', cantidad: 200, ofertaActual: 1850000, miOferta: null, distancia: '3.2 km', sector: 'Chapinero', vence: '02:34:11', estado: 'Abierta' },
  { id: 2, medicamento: 'Insulina Glargina', cantidad: 50,  ofertaActual: 3950000, miOferta: 3900000, distancia: '1.8 km', sector: 'Suba', vence: '00:45:30', estado: 'Pujando' },
  { id: 3, medicamento: 'Metformina 850mg',  cantidad: 300, ofertaActual: 1680000, miOferta: null, distancia: '5.7 km', sector: 'Usaquén', vence: '00:12:05', estado: 'Urgente' },
]

const fmt = (n) => `$${n.toLocaleString('es-CO')}`

export default function GestionSubastas() {
  const [subastas, setSubastas] = useState(MOCK_SUBASTAS_DISP)
  const [monto,    setMonto]    = useState({})

  // ─────────────────────────────────────────────────────────────────
  // 📡 LLAMADA AL BACKEND — pujarSubasta(id, monto)
  //    POST /subastas/:id/pujar → { monto: number }
  // ─────────────────────────────────────────────────────────────────
  const handlePujar = async (id) => {
    const m = parseInt(monto[id], 10)
    if (!m || isNaN(m)) return alert('Ingresa un monto válido')
    const s = subastas.find(x => x.id === id)
    if (m >= s.ofertaActual) return alert('Tu oferta debe ser MENOR a la oferta actual')
    try {
      // await pujarSubasta(id, m)
      setSubastas(prev => prev.map(s => s.id === id ? { ...s, ofertaActual: m, miOferta: m, estado: 'Pujando' } : s))
      setMonto(prev => ({ ...prev, [id]: '' }))
    } catch (err) { console.error(err) }
  }

  return (
    <DashboardLayout
      title="Subastas Disponibles"
      subtitle="Haz ofertas por pedidos de medicamentos cerca de ti"
    >
      <div style={styles.statsRow}>
        {[
          { label: 'Subastas Abiertas', value: subastas.filter(s => s.estado !== 'Cerrada').length, color: 'var(--primary)' },
          { label: 'Mis Pujas Activas', value: subastas.filter(s => s.miOferta).length, color: 'var(--secondary-fixed)' },
        ].map((s, i) => (
          <div key={i} style={styles.statCard}>
            <p style={styles.statLabel}>{s.label}</p>
            <p style={{ ...styles.statValue, color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div style={styles.grid}>
        {subastas.map(s => (
          <div key={s.id} style={{ ...styles.card, ...(s.estado === 'Urgente' ? { borderColor: 'rgba(255,180,171,0.4)' } : s.estado === 'Pujando' ? { borderColor: 'rgba(0,254,102,0.3)' } : {}) }}>
            <div style={styles.cardHeader}>
              <div style={styles.medIcon}><Package size={18} style={{ color: 'var(--primary)' }} /></div>
              <div style={{ flex: 1 }}>
                <h3 style={styles.medName}>{s.medicamento}</h3>
                <p style={styles.medQty}>{s.cantidad} unidades</p>
              </div>
              <span style={{ ...styles.estadoBadge, ...(s.estado === 'Urgente' ? { background: 'rgba(255,180,171,0.1)', color: '#ffb4ab' } : s.estado === 'Pujando' ? { background: 'rgba(0,254,102,0.1)', color: '#00e55b' } : { background: 'rgba(124,58,237,0.1)', color: 'var(--primary)' }) }}>
                {s.estado}
              </span>
            </div>

            <div style={styles.infoRow}>
              <div style={styles.infoItem}><MapPin size={13} style={{ color: 'var(--outline)' }} /><span>{s.distancia} · {s.sector}</span></div>
              <div style={styles.infoItem}><Clock size={13} style={{ color: 'var(--outline)' }} /><span>{s.vence}</span></div>
            </div>

            <div style={styles.ofertaSection}>
              <div>
                <p style={styles.ofertaLabel}>Oferta actual más baja</p>
                <p style={styles.ofertaVal}>{fmt(s.ofertaActual)}</p>
              </div>
              {s.miOferta && (
                <div style={{ textAlign: 'right' }}>
                  <p style={styles.ofertaLabel}>Mi oferta</p>
                  <p style={{ ...styles.ofertaVal, color: '#00e55b' }}>{fmt(s.miOferta)}</p>
                </div>
              )}
            </div>

            {s.estado !== 'Cerrada' && (
              <div style={styles.pujaRow}>
                <div style={styles.montoInput}>
                  <DollarSign size={14} style={{ color: 'var(--outline)', flexShrink: 0 }} />
                  <input
                    id={`puja-monto-${s.id}`}
                    type="number"
                    placeholder="Tu oferta"
                    value={monto[s.id] || ''}
                    onChange={e => setMonto(p => ({ ...p, [s.id]: e.target.value }))}
                    style={{ border: 'none', background: 'none', color: 'var(--on-surface)', fontSize: '0.9rem', outline: 'none', width: '100%', padding: 0 }}
                  />
                </div>
                <button id={`puja-submit-${s.id}`} onClick={() => handlePujar(s.id)} style={styles.pujaBtn}>
                  <Send size={14} /> Pujar
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </DashboardLayout>
  )
}

const styles = {
  statsRow:     { display: 'flex', gap: '1rem', marginBottom: '1.5rem' },
  statCard:     { flex: 1, background: 'var(--surface-container)', border: '1px solid rgba(74,68,85,0.25)', borderRadius: 'var(--radius-xl)', padding: '1rem 1.25rem' },
  statLabel:    { fontSize: '0.78rem', color: 'var(--on-surface-variant)', marginBottom: 4 },
  statValue:    { fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-display)' },
  grid:         { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' },
  card:         { background: 'var(--surface-container)', border: '1px solid rgba(74,68,85,0.25)', borderRadius: 'var(--radius-2xl)', padding: '1.4rem', display: 'flex', flexDirection: 'column', gap: '1rem' },
  cardHeader:   { display: 'flex', alignItems: 'flex-start', gap: '0.85rem' },
  medIcon:      { width: 40, height: 40, borderRadius: 10, background: 'rgba(124,58,237,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  medName:      { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9rem', color: 'var(--on-surface)', marginBottom: 2 },
  medQty:       { fontSize: '0.78rem', color: 'var(--outline)' },
  estadoBadge:  { fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: 'var(--radius-full)', flexShrink: 0 },
  infoRow:      { display: 'flex', gap: '1rem', flexWrap: 'wrap' },
  infoItem:     { display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--on-surface-variant)' },
  ofertaSection:{ display: 'flex', justifyContent: 'space-between' },
  ofertaLabel:  { fontSize: '0.72rem', color: 'var(--outline)', marginBottom: 2 },
  ofertaVal:    { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.2rem', color: 'var(--on-surface)' },
  pujaRow:      { display: 'flex', gap: '0.65rem', alignItems: 'center' },
  montoInput:   { flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--surface-container-high)', borderRadius: 'var(--radius-full)', padding: '0.5rem 1rem', border: '1px solid rgba(74,68,85,0.3)' },
  pujaBtn:      { background: 'linear-gradient(135deg, #7c3aed, #a855f7)', color: '#fff', border: 'none', borderRadius: 'var(--radius-full)', padding: '0.55rem 1.1rem', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontFamily: 'var(--font-display)', flexShrink: 0 },
}
