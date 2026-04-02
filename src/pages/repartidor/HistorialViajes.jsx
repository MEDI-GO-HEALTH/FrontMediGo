/**
 * HistorialViajes.jsx — Historial de Viajes del Repartidor
 *
 * 🔗 CONEXIONES AL BACKEND:
 *   src/api/repartidorService.js
 *   - getHistorial(params) → GET /repartidor/historial
 */
import { useState } from 'react'
import { MapPin, Package, Clock, CheckCircle, XCircle } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'

const MOCK = [
  { id: 'PED-195', med: 'Amoxicilina 500mg', desde: 'Sede Norte', hasta: 'Clínica Los Andes',     fecha: '01 Abr 2026', dur: '22 min', dist: '4.2 km', ganancia: 28000, estado: 'Completado', cal: 5 },
  { id: 'PED-192', med: 'Insulina Glargina',  desde: 'Sede El Poblado', hasta: 'Hospital S. Bolívar', fecha: '31 Mar 2026', dur: '35 min', dist: '7.1 km', ganancia: 45000, estado: 'Completado', cal: 4 },
  { id: 'PED-188', med: 'Metformina 850mg',   desde: 'Sede Sur', hasta: 'Farmacia Colsubsidio',   fecha: '30 Mar 2026', dur: '18 min', dist: '2.8 km', ganancia: 20000, estado: 'Completado', cal: 5 },
  { id: 'PED-184', med: 'Atorvastatina 20mg', desde: 'Sede Norte', hasta: 'Clínica Shaio',       fecha: '29 Mar 2026', dur: '—',      dist: '—',      ganancia: 0,     estado: 'Cancelado',  cal: null },
  { id: 'PED-179', med: 'Omeprazol 20mg',     desde: 'Sede Laureles', hasta: 'Hospital San Vicente', fecha: '28 Mar 2026', dur: '28 min', dist: '5.5 km', ganancia: 35000, estado: 'Completado', cal: 4 },
]
const fmt = (n) => `$${n.toLocaleString('es-CO')}`

export default function HistorialViajes() {
  const [items] = useState(MOCK)

  // 📡 BACKEND — getHistorial({ page, limit }) → GET /repartidor/historial
  // useEffect(() => { getHistorial({ page: 1, limit: 20 }).then(setItems) }, [])

  const totalGanado = items.reduce((a, h) => a + h.ganancia, 0)
  const completados = items.filter(h => h.estado === 'Completado').length
  const cals = items.filter(h => h.cal).map(h => h.cal)
  const promCal = cals.length ? (cals.reduce((a, b) => a + b, 0) / cals.length).toFixed(1) : '—'

  return (
    <DashboardLayout title="Historial de Viajes" subtitle="Tus entregas y estadísticas de desempeño">
      <div style={s.statsRow}>
        {[
          { label: 'Total Ganado', value: fmt(totalGanado), color: 'var(--secondary-fixed)' },
          { label: 'Completados',  value: completados,        color: 'var(--primary)' },
          { label: 'Calificación', value: `⭐ ${promCal}`,   color: '#ffd700' },
        ].map((st, i) => (
          <div key={i} style={s.statCard}>
            <p style={s.statLabel}>{st.label}</p>
            <p style={{ ...s.statValue, color: st.color }}>{st.value}</p>
          </div>
        ))}
      </div>

      <div style={s.tableCard}>
        <table style={s.table}>
          <thead>
            <tr>{['ID','Medicamento','Ruta','Fecha','Dur.','Dist.','Ganancia','Cal.','Estado'].map(h=><th key={h} style={s.th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {items.map((h,idx)=>(
              <tr key={h.id} style={{ ...s.tr, background: idx%2===0?'transparent':'rgba(255,255,255,0.01)' }}>
                <td style={{ ...s.td, fontFamily:'monospace', fontSize:'0.78rem', color:'var(--outline)' }}>{h.id}</td>
                <td style={s.td}>
                  <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                    <div style={s.pillIcon}><Package size={12} style={{ color:'var(--primary)' }}/></div>
                    <span style={{ color:'var(--on-surface)', fontSize:'0.85rem', fontWeight:600 }}>{h.med}</span>
                  </div>
                </td>
                <td style={{ ...s.td, maxWidth:200 }}>
                  <div style={{ fontSize:'0.75rem', color:'var(--on-surface-variant)' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'0.3rem' }}><MapPin size={11} style={{ color:'var(--outline)' }}/>{h.desde}</div>
                    <div style={{ display:'flex', alignItems:'center', gap:'0.3rem', marginTop:2 }}><MapPin size={11} style={{ color:'var(--secondary-fixed)' }}/>{h.hasta}</div>
                  </div>
                </td>
                <td style={{ ...s.td, fontSize:'0.8rem' }}>{h.fecha}</td>
                <td style={{ ...s.td, fontSize:'0.8rem' }}>{h.dur}</td>
                <td style={{ ...s.td, fontSize:'0.8rem' }}>{h.dist}</td>
                <td style={{ ...s.td, fontWeight:700, color: h.ganancia>0?'var(--secondary-fixed)':'var(--outline)' }}>{h.ganancia>0?fmt(h.ganancia):'—'}</td>
                <td style={s.td}>{h.cal?<span style={{ color:'#ffd700' }}>{'★'.repeat(h.cal)}</span>:<span style={{ color:'var(--outline)' }}>—</span>}</td>
                <td style={s.td}>
                  <span style={{ ...s.badge, background: h.estado==='Completado'?'rgba(0,254,102,0.1)':'rgba(255,180,171,0.1)', color: h.estado==='Completado'?'#00e55b':'#ffb4ab' }}>
                    {h.estado==='Completado'?<CheckCircle size={11}/>:<XCircle size={11}/>} {h.estado}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  )
}

const s = {
  statsRow:  { display:'flex', gap:'1rem', marginBottom:'1.75rem' },
  statCard:  { flex:1, background:'var(--surface-container)', border:'1px solid rgba(74,68,85,0.25)', borderRadius:'var(--radius-xl)', padding:'1.1rem 1.5rem' },
  statLabel: { fontSize:'0.78rem', color:'var(--on-surface-variant)', marginBottom:4 },
  statValue: { fontSize:'1.5rem', fontWeight:800, fontFamily:'var(--font-display)' },
  tableCard: { background:'var(--surface-container)', border:'1px solid rgba(74,68,85,0.25)', borderRadius:'var(--radius-xl)', overflow:'auto' },
  table:     { width:'100%', borderCollapse:'collapse', fontSize:'0.875rem' },
  th:        { padding:'0.85rem 1rem', textAlign:'left', fontSize:'0.72rem', fontWeight:700, color:'var(--on-surface-variant)', textTransform:'uppercase', letterSpacing:'0.05em', background:'var(--surface-container-high)', whiteSpace:'nowrap' },
  tr:        { borderBottom:'1px solid rgba(74,68,85,0.15)' },
  td:        { padding:'0.85rem 1rem', color:'var(--on-surface-variant)', verticalAlign:'middle' },
  pillIcon:  { width:26, height:26, borderRadius:7, background:'rgba(124,58,237,0.12)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },
  badge:     { display:'inline-flex', alignItems:'center', gap:'0.3rem', borderRadius:'var(--radius-full)', padding:'3px 10px', fontSize:'0.72rem', fontWeight:600, whiteSpace:'nowrap' },
}
