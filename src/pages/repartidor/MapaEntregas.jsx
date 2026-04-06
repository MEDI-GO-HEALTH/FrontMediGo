/**
 * MapaEntregas.jsx — Mapa de Entregas del Repartidor
 *
 * 🔗 CONEXIONES AL BACKEND:
 *   src/api/repartidorService.js
 *   - getPedidosMapa()             → GET /repartidor/mapa
 *   - updateEstadoPedido(id, estado) → PUT /pedidos/:id/estado { estado }
 *     estados válidos: 'RECOLECTANDO' | 'EN_CAMINO' | 'ENTREGADO'
 */

import { useState } from 'react'
import { MapPin, Navigation, Package, CheckCircle, Truck, Phone, Clock } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'

const MOCK_PEDIDOS = [
  { id: 'PED-201', cliente: 'Clínica Norte', telefono: '601-234-5678', medicamento: 'Amoxicilina 500mg', direccion: 'Cra 15 #120-45, Bogotá', estado: 'EN_CAMINO',    distancia: '1.2 km', eta: '5 min' },
  { id: 'PED-202', cliente: 'Farmacia Sur',  telefono: '601-876-5432', medicamento: 'Metformina 850mg',  direccion: 'Av. 68 #45-20, Bogotá',  estado: 'RECOLECTANDO', distancia: '3.8 km', eta: '18 min' },
]

const ESTADO_CFG = {
  RECOLECTANDO: { color: '#7bd0ff', label: 'Recolectando', next: 'EN_CAMINO',    nextLabel: 'Iniciar entrega' },
  EN_CAMINO:    { color: 'var(--primary)', label: 'En camino',  next: 'ENTREGADO',   nextLabel: 'Confirmar entrega' },
  ENTREGADO:    { color: '#00e55b', label: 'Entregado',    next: null,           nextLabel: null },
}

export default function MapaEntregas() {
  const [pedidos, setPedidos] = useState(MOCK_PEDIDOS)

  // ─────────────────────────────────────────────────────────────────
  // 📡 LLAMADA AL BACKEND — updateEstadoPedido(id, nextEstado)
  //    PUT /pedidos/:id/estado → { estado: 'RECOLECTANDO'|'EN_CAMINO'|'ENTREGADO' }
  // ─────────────────────────────────────────────────────────────────
  const handleNextEstado = async (id, nextEstado) => {
    try {
      // await updateEstadoPedido(id, nextEstado)
      setPedidos(prev => prev.map(p => p.id === id ? { ...p, estado: nextEstado } : p))
    } catch (err) { console.error(err) }
  }

  return (
    <DashboardLayout
      title="Mapa de Entregas"
      subtitle="Gestiona tus entregas activas y actualiza su estado"
    >
      <div style={styles.layout}>
        {/* Mapa */}
        <div style={styles.mapWrap}>
          <div style={styles.mapPlaceholder}>
            <div style={styles.mapGrid} />
            {/* Ruta animada simulada */}
            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M 20,80 Q 40,20 70,40 T 90,20" stroke="rgba(124,58,237,0.6)" strokeWidth="0.5" fill="none" strokeDasharray="3 2" />
            </svg>
            {[
              { x: '20%', y: '78%', icon: '📦', label: 'Recolección' },
              { x: '68%', y: '38%', icon: '🏥', label: 'Destino' },
            ].map((m, i) => (
              <div key={i} style={{ position: 'absolute', left: m.x, top: m.y, transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                <div style={styles.mapIcon}>{m.icon}</div>
                <div style={styles.markerLabel}>{m.label}</div>
              </div>
            ))}
            <div style={{ position: 'absolute', left: '45%', top: '55%', transform: 'translate(-50%, -50%)' }}>
              <div style={styles.youMarker}><Navigation size={16} style={{ color: '#fff' }} /></div>
              <div style={{ ...styles.markerLabel, color: 'var(--on-surface)' }}>Tú</div>
            </div>
            <div style={styles.mapBadge}>🗺️ Integrar con Google Maps / Leaflet</div>
          </div>
        </div>

        {/* Panel de pedidos */}
        <div style={styles.sidebar}>
          <h3 style={styles.panelTitle}>Mis Entregas</h3>
          {pedidos.map(p => {
            const ec = ESTADO_CFG[p.estado]
            return (
              <div key={p.id} style={styles.pedidoCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <span style={styles.pedidoId}>{p.id}</span>
                    <h4 style={styles.clienteName}>{p.cliente}</h4>
                  </div>
                  <span style={{ ...styles.estadoBadge, color: ec.color, background: `${ec.color}18` }}>{ec.label}</span>
                </div>

                <div style={styles.infoList}>
                  <div style={styles.infoRow}><Package size={13} style={{ color: 'var(--outline)' }} /><span>{p.medicamento}</span></div>
                  <div style={styles.infoRow}><MapPin   size={13} style={{ color: 'var(--outline)' }} /><span>{p.direccion}</span></div>
                  <div style={styles.infoRow}><Phone    size={13} style={{ color: 'var(--outline)' }} /><span>{p.telefono}</span></div>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={styles.infoRow}><Navigation size={13} style={{ color: 'var(--outline)' }} /><span>{p.distancia}</span></div>
                    <div style={styles.infoRow}><Clock size={13} style={{ color: 'var(--outline)' }} /><span>~{p.eta}</span></div>
                  </div>
                </div>

                {ec.next && (
                  <button
                    id={`pedido-next-${p.id}`}
                    onClick={() => handleNextEstado(p.id, ec.next)}
                    style={{ ...styles.nextBtn, background: ec.next === 'ENTREGADO' ? 'linear-gradient(135deg, #006e95, #7bd0ff)' : 'linear-gradient(135deg, #7c3aed, #a855f7)' }}
                  >
                    <CheckCircle size={14} /> {ec.nextLabel}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </DashboardLayout>
  )
}

const styles = {
  layout:       { display: 'grid', gridTemplateColumns: '1fr 360px', gap: '1.25rem', height: 'calc(100vh - 200px)' },
  mapWrap:      { borderRadius: 'var(--radius-2xl)', overflow: 'hidden', border: '1px solid rgba(74,68,85,0.25)' },
  mapPlaceholder:{ width: '100%', height: '100%', background: 'var(--surface-container)', position: 'relative', minHeight: 400 },
  mapGrid:      { position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(74,68,85,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(74,68,85,0.15) 1px, transparent 1px)', backgroundSize: '40px 40px' },
  mapIcon:      { width: 36, height: 36, borderRadius: 'var(--radius-full)', background: 'var(--surface-container-highest)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, boxShadow: '0 2px 8px rgba(0,0,0,0.5)' },
  youMarker:    { width: 36, height: 36, borderRadius: 'var(--radius-full)', background: 'linear-gradient(135deg, #7c3aed, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px rgba(124,58,237,0.5)' },
  markerLabel:  { fontSize: '0.7rem', fontWeight: 700, color: 'var(--on-surface-variant)', textAlign: 'center', marginTop: 3, textShadow: '0 1px 4px rgba(0,0,0,0.8)' },
  mapBadge:     { position: 'absolute', bottom: 16, left: 16, background: 'rgba(53,53,52,0.85)', backdropFilter: 'blur(8px)', borderRadius: 'var(--radius-lg)', padding: '0.4rem 0.85rem', fontSize: '0.78rem', color: 'var(--on-surface-variant)', border: '1px solid rgba(74,68,85,0.4)' },
  sidebar:      { display: 'flex', flexDirection: 'column', gap: '0.85rem', overflowY: 'auto' },
  panelTitle:   { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: 'var(--on-surface)' },
  pedidoCard:   { background: 'var(--surface-container)', border: '1px solid rgba(74,68,85,0.25)', borderRadius: 'var(--radius-xl)', padding: '1.1rem' },
  pedidoId:     { fontSize: '0.72rem', color: 'var(--outline)', fontFamily: 'monospace', marginBottom: 2, display: 'block' },
  clienteName:  { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9rem', color: 'var(--on-surface)' },
  estadoBadge:  { fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: 'var(--radius-full)', flexShrink: 0 },
  infoList:     { display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '0.85rem' },
  infoRow:      { display: 'flex', alignItems: 'flex-start', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--on-surface-variant)' },
  nextBtn:      { width: '100%', color: '#fff', border: 'none', borderRadius: 'var(--radius-full)', padding: '0.6rem', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontFamily: 'var(--font-display)' },
}
