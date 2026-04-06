/**
 * GestionSedesUsuarios.jsx — Sedes con panel de Usuarios (Admin)
 *
 * 🔗 CONEXIONES AL BACKEND:
 *   src/api/sedesService.js
 *   - getSedes()             → GET /sedes
 *   - getSedeUsuarios(id)    → GET /sedes/:id/usuarios
 */

import { useState } from 'react'
import { Building2, Users, ChevronDown, ChevronRight, MapPin, User, Shield, Truck } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'

const MOCK_DATA = [
  {
    id: 1, nombre: 'Sede Norte', ciudad: 'Bogotá', activa: true,
    usuarios: [
      { id: 1, name: 'Andrea Ospina',  role: 'AFILIADO',   email: 'andrea@clinica.co' },
      { id: 2, name: 'Carlos Méndez', role: 'REPARTIDOR',  email: 'carlos@raps.co' },
    ]
  },
  {
    id: 2, nombre: 'Sede Sur', ciudad: 'Bogotá', activa: true,
    usuarios: [
      { id: 3, name: 'Juliana Torres', role: 'ADMIN',      email: 'juliana@admin.co' },
      { id: 4, name: 'Diego Ramírez',  role: 'AFILIADO',   email: 'diego@clinica.co' },
    ]
  },
  {
    id: 3, nombre: 'Sede El Poblado', ciudad: 'Medellín', activa: true,
    usuarios: [
      { id: 5, name: 'Mónica Salcedo', role: 'REPARTIDOR', email: 'monica@raps.co' },
    ]
  },
]

const ROLE_CFG = {
  ADMIN:      { icon: Shield, color: '#d2bbff', bg: 'rgba(124,58,237,0.15)', label: 'Admin' },
  AFILIADO:   { icon: User,   color: '#00e55b', bg: 'rgba(0,254,102,0.12)',  label: 'Afiliado' },
  REPARTIDOR: { icon: Truck,  color: '#7bd0ff', bg: 'rgba(123,208,255,0.12)', label: 'Repartidor' },
}

export default function GestionSedesUsuarios() {
  const [expanded, setExpanded] = useState({ 1: true })

  const toggle = (id) => setExpanded(p => ({ ...p, [id]: !p[id] }))

  // ─────────────────────────────────────────────────────────────────
  // 📡 LLAMADA AL BACKEND — getSedes() + getSedeUsuarios(id)
  //    GET /sedes + GET /sedes/:id/usuarios
  //    Descomentar y reemplazar MOCK_DATA:
  // ─────────────────────────────────────────────────────────────────
  // useEffect(() => {
  //   getSedes().then(async (sedes) => {
  //     const withUsers = await Promise.all(
  //       sedes.map(async s => ({ ...s, usuarios: await getSedeUsuarios(s.id) }))
  //     )
  //     setData(withUsers)
  //   })
  // }, [])

  return (
    <DashboardLayout
      title="Sedes & Usuarios"
      subtitle="Visualiza los usuarios asignados a cada sede"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {MOCK_DATA.map(sede => (
          <div key={sede.id} style={styles.sedeCard}>
            {/* Header de sede */}
            <button id={`sede-expand-${sede.id}`} onClick={() => toggle(sede.id)} style={styles.sedeHeader}>
              <div style={styles.sedeIconWrap}><Building2 size={18} style={{ color: 'var(--primary)' }} /></div>
              <div style={{ flex: 1 }}>
                <div style={styles.sedeName}>{sede.nombre}</div>
                <div style={styles.sedeCity}><MapPin size={12} /> {sede.ciudad}</div>
              </div>
              <div style={styles.userCount}><Users size={14} />{sede.usuarios.length} usuario{sede.usuarios.length !== 1 ? 's' : ''}</div>
              <div style={{ ...styles.estadoBadge, background: sede.activa ? 'rgba(0,254,102,0.1)' : 'rgba(255,180,171,0.1)', color: sede.activa ? '#00e55b' : '#ffb4ab' }}>
                {sede.activa ? 'Activa' : 'Inactiva'}
              </div>
              {expanded[sede.id] ? <ChevronDown size={16} style={{ color: 'var(--outline)', flexShrink: 0 }} /> : <ChevronRight size={16} style={{ color: 'var(--outline)', flexShrink: 0 }} />}
            </button>

            {/* Lista de usuarios */}
            {expanded[sede.id] && (
              <div style={styles.usersPanel}>
                {sede.usuarios.map(u => {
                  const rc = ROLE_CFG[u.role]
                  return (
                    <div key={u.id} style={styles.userRow}>
                      <div style={{ ...styles.avatar, background: rc.bg, color: rc.color }}>{u.name[0]}</div>
                      <div style={{ flex: 1 }}>
                        <div style={styles.userName}>{u.name}</div>
                        <div style={styles.userEmail}>{u.email}</div>
                      </div>
                      <span style={{ ...styles.roleBadge, background: rc.bg, color: rc.color }}>
                        <rc.icon size={11} />{rc.label}
                      </span>
                    </div>
                  )
                })}
                {sede.usuarios.length === 0 && (
                  <p style={{ color: 'var(--outline)', fontSize: '0.85rem', textAlign: 'center', padding: '1rem' }}>
                    No hay usuarios asignados a esta sede.
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </DashboardLayout>
  )
}

const styles = {
  sedeCard:    { background: 'var(--surface-container)', border: '1px solid rgba(74,68,85,0.25)', borderRadius: 'var(--radius-xl)', overflow: 'hidden' },
  sedeHeader:  { display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '1.1rem 1.25rem', width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' },
  sedeIconWrap:{ width: 38, height: 38, borderRadius: 10, background: 'rgba(124,58,237,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  sedeName:    { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', color: 'var(--on-surface)' },
  sedeCity:    { fontSize: '0.78rem', color: 'var(--on-surface-variant)', display: 'flex', alignItems: 'center', gap: 3, marginTop: 2 },
  userCount:   { display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--on-surface-variant)', marginRight: '0.5rem' },
  estadoBadge: { fontSize: '0.72rem', fontWeight: 600, padding: '3px 10px', borderRadius: 'var(--radius-full)' },
  usersPanel:  { borderTop: '1px solid rgba(74,68,85,0.2)', background: 'var(--surface-container-low)', padding: '0.5rem 1.25rem 1rem' },
  userRow:     { display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.75rem 0', borderBottom: '1px solid rgba(74,68,85,0.12)' },
  avatar:      { width: 32, height: 32, borderRadius: 'var(--radius-full)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem', fontFamily: 'var(--font-display)', flexShrink: 0 },
  userName:    { fontWeight: 600, fontSize: '0.875rem', color: 'var(--on-surface)' },
  userEmail:   { fontSize: '0.75rem', color: 'var(--outline)' },
  roleBadge:   { display: 'inline-flex', alignItems: 'center', gap: '0.3rem', borderRadius: 'var(--radius-full)', padding: '3px 10px', fontSize: '0.73rem', fontWeight: 600, flexShrink: 0 },
}
