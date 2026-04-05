/**
 * PerfilRepartidor.jsx — Perfil del Repartidor
 *
 * 🔗 CONEXIONES AL BACKEND:
 *   src/api/repartidorService.js
 *   - getPerfil()        → GET /repartidor/perfil
 *   - updatePerfil(data) → PUT /repartidor/perfil
 */
import { useState } from 'react'
import { User, Mail, Phone, MapPin, Star, Save, Edit2, Truck, TrendingUp } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'

const MOCK = {
  nombre: 'Carlos Méndez', email: 'carlos@raps.co', telefono: '+57 315 678 9012',
  ciudad: 'Bogotá, Colombia', vehiculo: 'Moto — AKT 150', licencia: 'C1-2023-4567',
  joinedAt: 'Febrero 2024',
  stats: [
    { label: 'Entregas', value: 128, color: 'var(--primary)' },
    { label: 'Ganado',   value: '$3.2M', color: 'var(--secondary-fixed)' },
    { label: 'Rating',   value: '4.8 ⭐', color: '#ffd700' },
  ]
}

export default function PerfilRepartidor() {
  const [perfil, setPerfil] = useState(MOCK)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ ...MOCK })

  // 📡 BACKEND — updatePerfil(form) → PUT /repartidor/perfil
  const handleSave = async () => {
    try {
      // await updatePerfil({ nombre: form.nombre, telefono: form.telefono, ciudad: form.ciudad, vehiculo: form.vehiculo })
      setPerfil(form)
      setEditing(false)
    } catch (err) { console.error(err) }
  }

  const fields = [
    { label: 'Nombre', key: 'nombre', icon: User, editable: true },
    { label: 'Correo', key: 'email',  icon: Mail,  editable: false },
    { label: 'Teléfono', key: 'telefono', icon: Phone, editable: true },
    { label: 'Ciudad', key: 'ciudad',  icon: MapPin, editable: true },
    { label: 'Vehículo', key: 'vehiculo', icon: Truck, editable: true },
    { label: 'Licencia', key: 'licencia', icon: TrendingUp, editable: false },
  ]

  return (
    <DashboardLayout title="Mi Perfil" subtitle="Información de tu cuenta de repartidor">
      <div style={s.layout}>
        <div style={s.profileCard}>
          <div style={s.avatarWrap}>
            <div style={s.avatar}>{perfil.nombre[0]}</div>
            <div style={s.avatarGlow} />
          </div>
          <h2 style={s.name}>{perfil.nombre}</h2>
          <span style={s.roleBadge}>Repartidor</span>
          <p style={s.since}>Desde {perfil.joinedAt}</p>
          <div style={s.statsGrid}>
            {perfil.stats.map((st, i) => (
              <div key={i} style={s.statItem}>
                <p style={{ ...s.statValue, color: st.color }}>{st.value}</p>
                <p style={s.statLabel}>{st.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <div style={s.infoCard}>
            <div style={s.infoHeader}>
              <h3 style={s.sectionTitle}>Información Personal</h3>
              {!editing
                ? <button id="perfil-rep-edit" onClick={() => setEditing(true)} style={s.editBtn}><Edit2 size={14} /> Editar</button>
                : <button id="perfil-rep-save" onClick={handleSave} style={s.saveBtn}><Save size={14} /> Guardar</button>
              }
            </div>
            <div style={s.infoGrid}>
              {fields.map(f => (
                <div key={f.key} style={s.infoItem}>
                  <div style={s.infoLabel}><f.icon size={13} style={{ color: 'var(--outline)' }} /><span>{f.label}</span></div>
                  {editing && f.editable
                    ? <input id={`perfil-rep-${f.key}`} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} style={s.infoInput} />
                    : <p style={s.infoValue}>{perfil[f.key]}</p>
                  }
                </div>
              ))}
            </div>
          </div>

          <div style={s.actCard}>
            <h3 style={s.sectionTitle}>Últimas Entregas</h3>
            {[
              { desc: 'Amoxicilina 500mg → Clínica Los Andes',    fecha: 'Hace 2 horas', cal: 5 },
              { desc: 'Insulina Glargina → Hospital Simón Bolívar',fecha: 'Hace 1 día',   cal: 4 },
              { desc: 'Metformina 850mg → Farmacia Colsubsidio',   fecha: 'Hace 3 días',  cal: 5 },
            ].map((a, i) => (
              <div key={i} style={s.actItem}>
                <div style={s.actDot} />
                <div style={{ flex: 1 }}>
                  <p style={s.actDesc}>{a.desc}</p>
                  <p style={s.actFecha}>{a.fecha}</p>
                </div>
                <span style={{ color: '#ffd700', fontSize: '0.8rem' }}>{'★'.repeat(a.cal)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

const s = {
  layout:      { display:'flex', gap:'1.5rem', alignItems:'flex-start', flexWrap:'wrap' },
  profileCard: { width:280, background:'var(--surface-container)', border:'1px solid rgba(74,68,85,0.25)', borderRadius:'var(--radius-2xl)', padding:'2rem 1.5rem', display:'flex', flexDirection:'column', alignItems:'center', gap:'0.75rem', flexShrink:0 },
  avatarWrap:  { position:'relative' },
  avatar:      { width:80, height:80, borderRadius:'var(--radius-full)', background:'linear-gradient(135deg, #006e95, #7bd0ff)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-display)', fontWeight:800, fontSize:'2rem', color:'#fff', position:'relative', zIndex:1 },
  avatarGlow:  { position:'absolute', inset:-6, borderRadius:'var(--radius-full)', background:'radial-gradient(circle, rgba(123,208,255,0.3) 0%, transparent 70%)', zIndex:0 },
  name:        { fontFamily:'var(--font-display)', fontWeight:700, fontSize:'1.15rem', color:'var(--on-surface)', textAlign:'center' },
  roleBadge:   { background:'rgba(123,208,255,0.12)', color:'#7bd0ff', fontSize:'0.75rem', fontWeight:700, padding:'3px 12px', borderRadius:'var(--radius-full)' },
  since:       { fontSize:'0.78rem', color:'var(--outline)' },
  statsGrid:   { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'0.5rem', width:'100%', marginTop:'0.5rem' },
  statItem:    { background:'var(--surface-container-high)', borderRadius:'var(--radius-lg)', padding:'0.65rem 0.5rem', textAlign:'center' },
  statValue:   { fontFamily:'var(--font-display)', fontWeight:800, fontSize:'1rem' },
  statLabel:   { fontSize:'0.63rem', color:'var(--outline)', marginTop:2 },
  infoCard:    { background:'var(--surface-container)', border:'1px solid rgba(74,68,85,0.25)', borderRadius:'var(--radius-2xl)', padding:'1.5rem', marginBottom:'1rem' },
  infoHeader:  { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.25rem' },
  sectionTitle:{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:'1rem', color:'var(--on-surface)' },
  editBtn:     { background:'var(--surface-container-high)', border:'1px solid rgba(74,68,85,0.4)', borderRadius:'var(--radius-full)', padding:'0.35rem 0.85rem', color:'var(--on-surface-variant)', fontSize:'0.82rem', cursor:'pointer', display:'flex', alignItems:'center', gap:'0.35rem' },
  saveBtn:     { background:'linear-gradient(135deg, #7c3aed, #a855f7)', border:'none', borderRadius:'var(--radius-full)', padding:'0.35rem 0.85rem', color:'#fff', fontSize:'0.82rem', fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:'0.35rem' },
  infoGrid:    { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' },
  infoItem:    { display:'flex', flexDirection:'column', gap:'0.35rem' },
  infoLabel:   { display:'flex', alignItems:'center', gap:'0.4rem', fontSize:'0.75rem', color:'var(--on-surface-variant)', textTransform:'uppercase', letterSpacing:'0.05em', fontWeight:600 },
  infoValue:   { fontSize:'0.9rem', color:'var(--on-surface)', fontWeight:500, margin:0 },
  infoInput:   { fontSize:'0.9rem', padding:'0.4rem 0.75rem' },
  actCard:     { background:'var(--surface-container)', border:'1px solid rgba(74,68,85,0.25)', borderRadius:'var(--radius-2xl)', padding:'1.5rem' },
  actItem:     { display:'flex', alignItems:'center', gap:'0.85rem', paddingBottom:'0.85rem', borderBottom:'1px solid rgba(74,68,85,0.15)', marginBottom:'0.85rem' },
  actDot:      { width:10, height:10, borderRadius:'var(--radius-full)', background:'var(--tertiary)', flexShrink:0 },
  actDesc:     { fontSize:'0.875rem', color:'var(--on-surface)', fontWeight:600, margin:0 },
  actFecha:    { fontSize:'0.75rem', color:'var(--outline)', margin:'0.2rem 0 0' },
}
