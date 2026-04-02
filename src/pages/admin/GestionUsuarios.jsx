/**
 * GestionUsuarios.jsx — Página de Gestión de Usuarios (Admin)
 *
 * 🔗 CONEXIONES AL BACKEND:
 *   src/api/usuariosService.js
 *   - getUsuarios(params)       → GET /usuarios
 *   - toggleEstadoUsuario(id, activo) → PUT /usuarios/:id/estado
 *   - cambiarRolUsuario(id, rol)      → PUT /usuarios/:id/rol
 *   - deleteUsuario(id)               → DELETE /usuarios/:id
 */

import { useState } from 'react'
import { Search, Users, UserCheck, UserX, Shield, Truck, User, Trash2, ChevronDown } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'

const MOCK_USERS = [
  { id: 1, name: 'Andrea Ospina',   email: 'andrea@clinica.co',  role: 'AFILIADO',   activo: true,  joined: '12 Mar 2024', pedidos: 45 },
  { id: 2, name: 'Carlos Méndez',   email: 'carlos@raps.co',     role: 'REPARTIDOR', activo: true,  joined: '05 Feb 2024', pedidos: 128 },
  { id: 3, name: 'Juliana Torres',  email: 'juliana@admin.co',   role: 'ADMIN',      activo: true,  joined: '01 Jan 2024', pedidos: 0 },
  { id: 4, name: 'Diego Ramírez',   email: 'diego@clinica.co',   role: 'AFILIADO',   activo: false, joined: '20 Mar 2024', pedidos: 12 },
  { id: 5, name: 'Mónica Salcedo',  email: 'monica@raps.co',     role: 'REPARTIDOR', activo: true,  joined: '18 Mar 2024', pedidos: 87 },
]

const ROLE_CONFIG = {
  ADMIN:      { label: 'Admin',      icon: Shield, color: '#d2bbff', bg: 'rgba(124,58,237,0.15)' },
  AFILIADO:   { label: 'Afiliado',   icon: User,   color: '#00e55b', bg: 'rgba(0,254,102,0.12)' },
  REPARTIDOR: { label: 'Repartidor', icon: Truck,  color: '#7bd0ff', bg: 'rgba(123,208,255,0.12)' },
}

export default function GestionUsuarios() {
  const [users,  setUsers]  = useState(MOCK_USERS)
  const [search, setSearch] = useState('')

  // ─────────────────────────────────────────────────────────────────
  // 📡 LLAMADA AL BACKEND — toggleEstadoUsuario(id, !activo)
  //    PUT /usuarios/:id/estado  → { activo: boolean }
  // ─────────────────────────────────────────────────────────────────
  const handleToggle = async (id) => {
    try {
      // const updated = await toggleEstadoUsuario(id, !users.find(u=>u.id===id).activo)
      setUsers(prev => prev.map(u => u.id === id ? { ...u, activo: !u.activo } : u))
    } catch (err) { console.error(err) }
  }

  // ─────────────────────────────────────────────────────────────────
  // 📡 LLAMADA AL BACKEND — deleteUsuario(id)
  //    DELETE /usuarios/:id
  // ─────────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este usuario permanentemente?')) return
    try {
      // await deleteUsuario(id)
      setUsers(prev => prev.filter(u => u.id !== id))
    } catch (err) { console.error(err) }
  }

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  const totalActivos   = users.filter(u => u.activo).length
  const totalInactivos = users.filter(u => !u.activo).length

  return (
    <DashboardLayout
      title="Gestión de Usuarios"
      subtitle="Administra los roles y permisos de todos los usuarios"
    >
      <div style={styles.statsRow}>
        {[
          { label: 'Total Usuarios', value: users.length, icon: Users,     color: 'var(--primary)' },
          { label: 'Activos',        value: totalActivos,   icon: UserCheck, color: 'var(--secondary-fixed)' },
          { label: 'Inactivos',      value: totalInactivos, icon: UserX,     color: '#ffb4ab' },
        ].map((s, i) => (
          <div key={i} style={styles.statCard}>
            <div style={{ ...styles.statIcon, background: `${s.color}20` }}><s.icon size={18} style={{ color: s.color }} /></div>
            <div>
              <p style={styles.statLabel}>{s.label}</p>
              <p style={{ ...styles.statValue, color: s.color }}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={styles.tableCard}>
        <div style={styles.toolbar}>
          <div style={styles.searchBox}>
            <Search size={15} style={{ color: 'var(--outline)' }} />
            <input id="usuarios-search" type="text" placeholder="Buscar usuario..." value={search} onChange={e => setSearch(e.target.value)} style={styles.searchInput} />
          </div>
          <button style={styles.filterBtn}>Rol <ChevronDown size={13} /></button>
        </div>

        <table style={styles.table}>
          <thead>
            <tr>{['Usuario', 'Rol', 'Pedidos', 'Miembro desde', 'Estado', 'Acciones'].map(h => <th key={h} style={styles.th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {filtered.map(u => {
              const rc = ROLE_CONFIG[u.role]
              return (
                <tr key={u.id} style={styles.tr}>
                  <td style={styles.td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ ...styles.avatar, background: rc.bg, color: rc.color }}>{u.name[0]}</div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--on-surface)', fontSize: '0.88rem' }}>{u.name}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--outline)' }}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <span style={{ ...styles.roleBadge, background: rc.bg, color: rc.color }}>
                      <rc.icon size={12} /> {rc.label}
                    </span>
                  </td>
                  <td style={{ ...styles.td, fontWeight: 700, color: 'var(--on-surface)' }}>{u.pedidos}</td>
                  <td style={{ ...styles.td, fontSize: '0.8rem' }}>{u.joined}</td>
                  <td style={styles.td}>
                    <button
                      id={`usuario-toggle-${u.id}`}
                      onClick={() => handleToggle(u.id)}
                      style={{ ...styles.toggleBtn, background: u.activo ? 'rgba(0,254,102,0.1)' : 'rgba(255,180,171,0.1)', color: u.activo ? '#00e55b' : '#ffb4ab' }}
                    >
                      {u.activo ? <UserCheck size={13} /> : <UserX size={13} />}
                      {u.activo ? 'Activo' : 'Inactivo'}
                    </button>
                  </td>
                  <td style={styles.td}>
                    <button id={`usuario-delete-${u.id}`} onClick={() => handleDelete(u.id)} style={styles.deleteBtn} title="Eliminar"><Trash2 size={14} /></button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  )
}

const styles = {
  statsRow:   { display: 'flex', gap: '1rem', marginBottom: '1.75rem' },
  statCard:   { flex: 1, background: 'var(--surface-container)', border: '1px solid rgba(74,68,85,0.25)', borderRadius: 'var(--radius-xl)', padding: '1.1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' },
  statIcon:   { width: 40, height: 40, borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  statLabel:  { fontSize: '0.78rem', color: 'var(--on-surface-variant)', marginBottom: 2 },
  statValue:  { fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-display)' },
  tableCard:  { background: 'var(--surface-container)', border: '1px solid rgba(74,68,85,0.25)', borderRadius: 'var(--radius-xl)', overflow: 'hidden' },
  toolbar:    { display: 'flex', gap: '0.75rem', padding: '1rem 1.25rem', borderBottom: '1px solid rgba(74,68,85,0.2)', alignItems: 'center' },
  searchBox:  { display: 'flex', alignItems: 'center', gap: '0.6rem', background: 'var(--surface-container-high)', borderRadius: 'var(--radius-full)', padding: '0.45rem 1rem', flex: 1 },
  searchInput:{ border: 'none', background: 'none', color: 'var(--on-surface)', fontSize: '0.875rem', outline: 'none', width: '100%', padding: 0 },
  filterBtn:  { background: 'var(--surface-container-high)', border: '1px solid rgba(74,68,85,0.4)', borderRadius: 'var(--radius-full)', color: 'var(--on-surface-variant)', padding: '0.4rem 0.85rem', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' },
  table:      { width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' },
  th:         { padding: '0.85rem 1.25rem', textAlign: 'left', fontSize: '0.73rem', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.06em', background: 'var(--surface-container-high)' },
  tr:         { borderBottom: '1px solid rgba(74,68,85,0.15)' },
  td:         { padding: '0.9rem 1.25rem', color: 'var(--on-surface-variant)' },
  avatar:     { width: 34, height: 34, borderRadius: 'var(--radius-full)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem', fontFamily: 'var(--font-display)', flexShrink: 0 },
  roleBadge:  { display: 'inline-flex', alignItems: 'center', gap: '0.3rem', borderRadius: 'var(--radius-full)', padding: '3px 10px', fontSize: '0.75rem', fontWeight: 600 },
  toggleBtn:  { display: 'inline-flex', alignItems: 'center', gap: '0.35rem', borderRadius: 'var(--radius-full)', padding: '4px 12px', fontSize: '0.78rem', fontWeight: 600, border: 'none', cursor: 'pointer' },
  deleteBtn:  { background: 'rgba(255,180,171,0.1)', border: 'none', borderRadius: 'var(--radius-md)', padding: '0.4rem', cursor: 'pointer', color: '#ffb4ab', display: 'flex', alignItems: 'center' },
}
