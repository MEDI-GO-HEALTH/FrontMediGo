/**
 * PerfilAfiliado.jsx — Perfil del Afiliado
 *
 * 🔗 CONEXIONES AL BACKEND:
 *   src/api/repartidorService.js
 *   - getPerfilAfiliado()      → GET /afiliado/perfil
 *   - updatePerfilAfiliado(data) → PUT /afiliado/perfil
 */

import { useState } from 'react'
import { User, Mail, Phone, MapPin, Package, Gavel, Save, Edit2 } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'

const MOCK_PERFIL = {
  nombre:    'Andrea Ospina',
  email:     'andrea@clinica.co',
  telefono:  '+57 310 456 7890',
  ciudad:    'Bogotá, Colombia',
  sede:      'Sede Norte',
  joinedAt:  'Enero 2024',
  stats:     [
    { label: 'Pedidos Totales',    value: 45,   color: 'var(--primary)' },
    { label: 'Subastas Activas',   value: 3,    color: 'var(--secondary-fixed)' },
    { label: 'Medicamentos',       value: 128,  color: 'var(--tertiary)' },
  ]
}

export default function PerfilAfiliado() {
  const [perfil,   setPerfil]   = useState(MOCK_PERFIL)
  const [editing,  setEditing]  = useState(false)
  const [form,     setForm]     = useState({ ...MOCK_PERFIL })

  // ─────────────────────────────────────────────────────────────────
  // 📡 LLAMADA AL BACKEND — updatePerfilAfiliado(form)
  //    PUT /afiliado/perfil → { nombre, telefono, ciudad }
  // ─────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    try {
      // const updated = await updatePerfilAfiliado({ nombre: form.nombre, telefono: form.telefono, ciudad: form.ciudad })
      setPerfil(form)
      setEditing(false)
    } catch (err) { console.error(err) }
  }

  return (
    <DashboardLayout title="Mi Perfil" subtitle="Información de tu cuenta de afiliado">
      <div style={styles.layout}>
        {/* Card de perfil */}
        <div style={styles.profileCard}>
          <div style={styles.avatarWrap}>
            <div style={styles.avatar}>{perfil.nombre[0]}</div>
            <div style={styles.avatarGlow} />
          </div>
          <h2 style={styles.name}>{perfil.nombre}</h2>
          <span style={styles.roleBadge}>Afiliado</span>
          <p style={styles.since}>Miembro desde {perfil.joinedAt}</p>

          <div style={styles.statsGrid}>
            {perfil.stats.map((s, i) => (
              <div key={i} style={styles.statItem}>
                <p style={{ ...styles.statValue, color: s.color }}>{s.value}</p>
                <p style={styles.statLabel}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Información y edición */}
        <div style={{ flex: 1 }}>
          <div style={styles.infoCard}>
            <div style={styles.infoHeader}>
              <h3 style={styles.sectionTitle}>Información Personal</h3>
              {!editing
                ? <button id="perfil-edit-btn" onClick={() => setEditing(true)} style={styles.editBtn}><Edit2 size={14} /> Editar</button>
                : <button id="perfil-save-btn" onClick={handleSave} style={styles.saveBtn}><Save size={14} /> Guardar</button>
              }
            </div>

            <div style={styles.infoGrid}>
              {[
                { label: 'Nombre completo', key: 'nombre',   icon: User,   editable: true },
                { label: 'Correo electrónico', key: 'email', icon: Mail,   editable: false },
                { label: 'Teléfono',        key: 'telefono', icon: Phone,  editable: true },
                { label: 'Ciudad',          key: 'ciudad',   icon: MapPin, editable: true },
                { label: 'Sede asignada',   key: 'sede',     icon: Package, editable: false },
              ].map(f => (
                <div key={f.key} style={styles.infoItem}>
                  <div style={styles.infoLabel}>
                    <f.icon size={14} style={{ color: 'var(--outline)' }} />
                    <span>{f.label}</span>
                  </div>
                  {editing && f.editable
                    ? <input id={`perfil-${f.key}`} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} style={styles.infoInput} />
                    : <p style={styles.infoValue}>{perfil[f.key]}</p>
                  }
                </div>
              ))}
            </div>
          </div>

          <div style={styles.actividadCard}>
            <h3 style={styles.sectionTitle}>Actividad Reciente</h3>
            {[
              { tipo: 'Pedido',  desc: 'Amoxicilina 500mg — 200 unidades', fecha: 'Hace 2 horas',  color: 'var(--primary)' },
              { tipo: 'Subasta', desc: 'Ganaste: Metformina 850mg',        fecha: 'Hace 1 día',    color: 'var(--secondary-fixed)' },
              { tipo: 'Pedido',  desc: 'Insulina Glargina — 50 unidades',  fecha: 'Hace 3 días',   color: 'var(--tertiary)' },
            ].map((a, i) => (
              <div key={i} style={styles.actItem}>
                <div style={{ ...styles.actDot, background: a.color }} />
                <div>
                  <p style={styles.actDesc}>{a.desc}</p>
                  <p style={styles.actFecha}>{a.tipo} · {a.fecha}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

const styles = {
  layout:       { display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' },
  profileCard:  { width: 280, background: 'var(--surface-container)', border: '1px solid rgba(74,68,85,0.25)', borderRadius: 'var(--radius-2xl)', padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', flexShrink: 0 },
  avatarWrap:   { position: 'relative' },
  avatar:       { width: 80, height: 80, borderRadius: 'var(--radius-full)', background: 'linear-gradient(135deg, #7c3aed, #d2bbff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '2rem', color: '#fff', position: 'relative', zIndex: 1 },
  avatarGlow:   { position: 'absolute', inset: -6, borderRadius: 'var(--radius-full)', background: 'radial-gradient(circle, rgba(124,58,237,0.3) 0%, transparent 70%)', zIndex: 0 },
  name:         { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.15rem', color: 'var(--on-surface)', textAlign: 'center' },
  roleBadge:    { background: 'rgba(0,254,102,0.12)', color: '#00e55b', fontSize: '0.75rem', fontWeight: 700, padding: '3px 12px', borderRadius: 'var(--radius-full)' },
  since:        { fontSize: '0.78rem', color: 'var(--outline)' },
  statsGrid:    { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', width: '100%', marginTop: '0.5rem' },
  statItem:     { background: 'var(--surface-container-high)', borderRadius: 'var(--radius-lg)', padding: '0.65rem 0.5rem', textAlign: 'center' },
  statValue:    { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.2rem' },
  statLabel:    { fontSize: '0.65rem', color: 'var(--outline)', marginTop: 2 },
  infoCard:     { background: 'var(--surface-container)', border: '1px solid rgba(74,68,85,0.25)', borderRadius: 'var(--radius-2xl)', padding: '1.5rem', marginBottom: '1rem' },
  infoHeader:   { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' },
  sectionTitle: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: 'var(--on-surface)' },
  editBtn:      { background: 'var(--surface-container-high)', border: '1px solid rgba(74,68,85,0.4)', borderRadius: 'var(--radius-full)', padding: '0.35rem 0.85rem', color: 'var(--on-surface-variant)', fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' },
  saveBtn:      { background: 'linear-gradient(135deg, #7c3aed, #a855f7)', border: 'none', borderRadius: 'var(--radius-full)', padding: '0.35rem 0.85rem', color: '#fff', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' },
  infoGrid:     { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
  infoItem:     { display: 'flex', flexDirection: 'column', gap: '0.35rem' },
  infoLabel:    { display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 },
  infoValue:    { fontSize: '0.9rem', color: 'var(--on-surface)', fontWeight: 500, margin: 0 },
  infoInput:    { fontSize: '0.9rem', padding: '0.4rem 0.75rem' },
  actividadCard:{ background: 'var(--surface-container)', border: '1px solid rgba(74,68,85,0.25)', borderRadius: 'var(--radius-2xl)', padding: '1.5rem' },
  actItem:      { display: 'flex', alignItems: 'flex-start', gap: '0.85rem', paddingBottom: '0.85rem', borderBottom: '1px solid rgba(74,68,85,0.15)', marginBottom: '0.85rem' },
  actDot:       { width: 10, height: 10, borderRadius: 'var(--radius-full)', marginTop: 5, flexShrink: 0 },
  actDesc:      { fontSize: '0.875rem', color: 'var(--on-surface)', fontWeight: 600, margin: 0 },
  actFecha:     { fontSize: '0.75rem', color: 'var(--outline)', margin: '0.2rem 0 0' },
}
