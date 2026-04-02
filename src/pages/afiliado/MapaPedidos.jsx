/**
 * MapaPedidos.jsx — Mapa de Pedidos en Tiempo Real (Afiliado)
 *
 * 🔗 CONEXIONES AL BACKEND:
 *   src/api/repartidorService.js
 *   - getPedidosMapaAfiliado() → GET /afiliado/mapa
 *     Respuesta esperada: Array de pedidos con { id, repartidor, estado, ubicacion: { lat, lng }, eta }
 *
 *   Para el mapa real: integrar Google Maps o Leaflet.js y pasar
 *   las coordenadas de cada pedido como markers.
 */

import { useState } from 'react'
import { MapPin, Navigation, Package, Clock, CheckCircle, Truck, RefreshCw } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'

const MOCK_PEDIDOS = [
  { id: 'PED-001', repartidor: 'Carlos Méndez', medicamento: 'Amoxicilina 500mg', estado: 'En camino',  eta: '12 min', direccion: 'Cra 15 #120-45', progreso: 65 },
  { id: 'PED-002', repartidor: 'Mónica Salcedo', medicamento: 'Insulina Glargina', estado: 'Recolectando', eta: '28 min', direccion: 'Av. 68 #45-20', progreso: 20 },
  { id: 'PED-003', repartidor: 'Juan Peñaloza',  medicamento: 'Metformina 850mg', estado: 'Entregado',  eta: 'Listo',  direccion: 'Calle 80 #12-33', progreso: 100 },
]

const ESTADO_CFG = {
  'En camino':    { color: 'var(--primary)',         bg: 'rgba(124,58,237,0.12)' },
  'Recolectando': { color: 'var(--tertiary)',         bg: 'rgba(123,208,255,0.12)' },
  'Entregado':    { color: 'var(--secondary-fixed)',  bg: 'rgba(0,254,102,0.12)' },
}

export default function MapaPedidos() {
  const [pedidos, setPedidos] = useState(MOCK_PEDIDOS)
  const [selected, setSelected] = useState(null)

  // ─────────────────────────────────────────────────────────────────
  // 📡 LLAMADA AL BACKEND — getPedidosMapaAfiliado()
  //    GET /afiliado/mapa → Array<{ id, repartidor, estado, ubicacion, eta }>
  //    Descomentar y conectar al mapa real (Google Maps / Leaflet):
  // ─────────────────────────────────────────────────────────────────
  // useEffect(() => {
  //   const fetch = () => getPedidosMapaAfiliado().then(setPedidos).catch(console.error)
  //   fetch()
  //   const interval = setInterval(fetch, 15000) // polling cada 15s
  //   return () => clearInterval(interval)
  // }, [])

  return (
    <DashboardLayout
      title="Mapa de Pedidos"
      subtitle="Seguimiento en tiempo real de tus entregas activas"
      actions={
        <button id="mapa-refresh-btn" style={styles.refreshBtn}><RefreshCw size={15} /> Actualizar</button>
      }
    >
      <div style={styles.layout}>
        {/* Mapa placeholder */}
        <div style={styles.mapContainer}>
          <div style={styles.mapPlaceholder}>
            <div style={styles.mapGrid} />
            {/* Markers simulados */}
            {[
              { top: '35%', left: '40%', color: '#7c3aed', label: 'PED-001' },
              { top: '60%', left: '65%', color: '#7bd0ff', label: 'PED-002' },
              { top: '25%', left: '70%', color: '#00fe66', label: 'PED-003' },
            ].map((m, i) => (
              <div key={i} style={{ position: 'absolute', top: m.top, left: m.left, transform: 'translate(-50%, -50%)' }}>
                <div style={{ ...styles.marker, background: m.color }}>
                  <MapPin size={14} style={{ color: '#fff' }} />
                </div>
                <div style={styles.markerLabel}>{m.label}</div>
              </div>
            ))}
            {/* Tu ubicación */}
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
              <div style={styles.youMarker}><Navigation size={14} style={{ color: '#fff' }} /></div>
              <div style={{ ...styles.markerLabel, color: 'var(--on-surface)' }}>Tú</div>
            </div>
            <div style={styles.mapBadge}>🗺️ Integrar con Google Maps / Leaflet</div>
          </div>
        </div>

        {/* Lista de pedidos */}
        <div style={styles.sidebar}>
          <h3 style={styles.sidebarTitle}>Pedidos Activos</h3>
          <div style={styles.pedidosList}>
            {pedidos.map(p => {
              const ec = ESTADO_CFG[p.estado]
              return (
                <div
                  key={p.id}
                  id={`pedido-${p.id}`}
                  onClick={() => setSelected(p.id === selected ? null : p.id)}
                  style={{ ...styles.pedidoCard, ...(selected === p.id ? { borderColor: 'rgba(124,58,237,0.5)', background: 'var(--surface-container-high)' } : {}) }}
                >
                  <div style={styles.pedidoHeader}>
                    <span style={styles.pedidoId}>{p.id}</span>
                    <span style={{ ...styles.estadoBadge, background: ec.bg, color: ec.color }}>{p.estado}</span>
                  </div>
                  <div style={styles.pedidoMed}><Package size={13} style={{ color: 'var(--outline)' }} />{p.medicamento}</div>
                  <div style={styles.pedidoRep}><Truck size={13} style={{ color: 'var(--outline)' }} />{p.repartidor}</div>

                  <div style={styles.progressBar}>
                    <div style={{ ...styles.progressFill, width: `${p.progreso}%`, background: p.progreso === 100 ? '#00fe66' : 'linear-gradient(90deg, #7c3aed, #a855f7)' }} />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                    <div style={styles.etaBox}><Clock size={12} /><span>ETA: {p.eta}</span></div>
                    <div style={styles.dirBox}><MapPin size={12} /><span style={{ fontSize: '0.75rem', color: 'var(--outline)' }}>{p.direccion}</span></div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

const styles = {
  layout:        { display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.25rem', height: 'calc(100vh - 200px)' },
  mapContainer:  { borderRadius: 'var(--radius-2xl)', overflow: 'hidden', border: '1px solid rgba(74,68,85,0.25)' },
  mapPlaceholder:{ width: '100%', height: '100%', background: 'var(--surface-container)', position: 'relative', overflow: 'hidden', minHeight: 400 },
  mapGrid:       { position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(74,68,85,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(74,68,85,0.15) 1px, transparent 1px)', backgroundSize: '40px 40px' },
  marker:        { width: 32, height: 32, borderRadius: 'var(--radius-full)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.5)', cursor: 'pointer' },
  youMarker:     { width: 36, height: 36, borderRadius: 'var(--radius-full)', background: 'linear-gradient(135deg, #7c3aed, #00fe66)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px rgba(124,58,237,0.5)' },
  markerLabel:   { textAlign: 'center', fontSize: '0.7rem', fontWeight: 700, color: 'var(--on-surface)', marginTop: 3, textShadow: '0 1px 4px rgba(0,0,0,0.8)' },
  mapBadge:      { position: 'absolute', bottom: 16, left: 16, background: 'rgba(53,53,52,0.85)', backdropFilter: 'blur(8px)', borderRadius: 'var(--radius-lg)', padding: '0.4rem 0.85rem', fontSize: '0.78rem', color: 'var(--on-surface-variant)', border: '1px solid rgba(74,68,85,0.4)' },
  sidebar:       { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  sidebarTitle:  { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: 'var(--on-surface)' },
  pedidosList:   { display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto' },
  pedidoCard:    { background: 'var(--surface-container)', border: '1px solid rgba(74,68,85,0.25)', borderRadius: 'var(--radius-xl)', padding: '1rem', cursor: 'pointer', transition: 'all var(--transition-fast)', display: 'flex', flexDirection: 'column', gap: '0.45rem' },
  pedidoHeader:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  pedidoId:      { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.875rem', color: 'var(--on-surface)' },
  estadoBadge:   { fontSize: '0.72rem', fontWeight: 600, padding: '2px 8px', borderRadius: 'var(--radius-full)' },
  pedidoMed:     { display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', color: 'var(--on-surface-variant)' },
  pedidoRep:     { display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--outline)' },
  progressBar:   { height: 5, background: 'var(--surface-container-highest)', borderRadius: 'var(--radius-full)', overflow: 'hidden' },
  progressFill:  { height: '100%', borderRadius: 'var(--radius-full)', transition: 'width 0.5s ease' },
  etaBox:        { display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', color: 'var(--primary)' },
  dirBox:        { display: 'flex', alignItems: 'center', gap: '0.3rem' },
  refreshBtn:    { background: 'var(--surface-container-high)', border: '1px solid rgba(74,68,85,0.4)', borderRadius: 'var(--radius-full)', color: 'var(--on-surface-variant)', padding: '0.5rem 1rem', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' },
}
