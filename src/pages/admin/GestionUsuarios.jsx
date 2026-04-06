import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { cambiarRolUsuario, deleteUsuario, getUsuarios, toggleEstadoUsuario } from '../../api/usuariosService'
import { ROUTES } from '../../constants/routes'
import '../../styles/admin/gestion-usuarios.css'

const FALLBACK_USERS = [
  {
    id: 'USR-001',
    name: 'Andrea Ospina',
    email: 'andrea@clinica.co',
    role: 'AFILIADO',
    active: true,
    joinedAt: '12 Mar 2024',
    deliveries: 45,
  },
  {
    id: 'USR-002',
    name: 'Carlos Mendez',
    email: 'carlos@raps.co',
    role: 'REPARTIDOR',
    active: true,
    joinedAt: '05 Feb 2024',
    deliveries: 128,
  },
  {
    id: 'USR-003',
    name: 'Juliana Torres',
    email: 'juliana@admin.co',
    role: 'ADMIN',
    active: true,
    joinedAt: '01 Jan 2024',
    deliveries: 0,
  },
  {
    id: 'USR-004',
    name: 'Diego Ramirez',
    email: 'diego@clinica.co',
    role: 'AFILIADO',
    active: false,
    joinedAt: '20 Mar 2024',
    deliveries: 12,
  },
]

const ROLE_META = {
  ADMIN: { label: 'Admin', icon: 'shield', tone: 'admin' },
  AFILIADO: { label: 'Afiliado', icon: 'person', tone: 'affiliate' },
  REPARTIDOR: { label: 'Repartidor', icon: 'local_shipping', tone: 'driver' },
}

const mapUserFromApi = (item, index) => ({
  id: item?.id || item?.codigo || `USR-${String(index + 1).padStart(3, '0')}`,
  name: item?.name || item?.nombre || 'Usuario',
  email: item?.email || 'sin-correo@medigo.co',
  role: String(item?.role || item?.rol || 'AFILIADO').toUpperCase(),
  active: Boolean(item?.active ?? item?.activo ?? true),
  joinedAt: item?.joinedAt || item?.creadoEn || 'Fecha no disponible',
  deliveries: Number(item?.deliveries ?? item?.pedidos ?? 0),
})

export default function GestionUsuarios() {
  const navigate = useNavigate()
  const [users, setUsers] = useState(FALLBACK_USERS)
  const [search, setSearch] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const loadUsers = async () => {
      try {
        const response = await getUsuarios({ limit: 40 })
        if (!mounted) {
          return
        }

        const source = response?.data || response
        if (Array.isArray(source) && source.length > 0) {
          setUsers(source.map(mapUserFromApi))
        }
      } catch {
        if (mounted) {
          setNotice('No se pudo sincronizar con backend. Mostrando usuarios de respaldo.')
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadUsers()

    return () => {
      mounted = false
    }
  }, [])

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) {
      return users
    }

    return users.filter((user) => `${user.name} ${user.email} ${user.role}`.toLowerCase().includes(query))
  }, [users, search])

  const totalActive = users.filter((user) => user.active).length
  const totalInactive = users.length - totalActive

  const handleLogout = () => {
    localStorage.removeItem('medigo_token')
    localStorage.removeItem('medigo_user')
    navigate(ROUTES.AUTH.LOGIN, { replace: true })
  }

  const handleToggleStatus = async (user) => {
    setUsers((previous) => previous.map((row) => (row.id === user.id ? { ...row, active: !row.active } : row)))

    try {
      await toggleEstadoUsuario(user.id, !user.active)
    } catch {
      setUsers((previous) => previous.map((row) => (row.id === user.id ? { ...row, active: user.active } : row)))
      setNotice('No se pudo actualizar el estado en backend. El cambio fue revertido localmente.')
    }
  }

  const handleDelete = async (user) => {
    if (!window.confirm(`Eliminar a ${user.name}?`)) {
      return
    }

    const previous = users
    setUsers((current) => current.filter((row) => row.id !== user.id))

    try {
      await deleteUsuario(user.id)
    } catch {
      setUsers(previous)
      setNotice('No se pudo eliminar en backend. Se restauraron los datos locales.')
    }
  }

  const handleRoleChange = async (user, nextRole) => {
    if (user.role === nextRole) {
      return
    }

    setUsers((previous) => previous.map((row) => (row.id === user.id ? { ...row, role: nextRole } : row)))

    try {
      await cambiarRolUsuario(user.id, nextRole)
    } catch {
      setUsers((previous) => previous.map((row) => (row.id === user.id ? { ...row, role: user.role } : row)))
      setNotice('No se pudo actualizar el rol en backend. El cambio fue revertido localmente.')
    }
  }

  return (
    <div className="admin-users-shell">
      <aside className="users-side">
        <div className="users-brand">
          <div className="users-brand-icon">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
              clinical_notes
            </span>
          </div>
          <div>
            <h1>MediGo Admin</h1>
            <p>CLINICAL PRECISION</p>
          </div>
        </div>

        <nav className="users-nav" aria-label="Navegacion administrador">
          <button type="button" onClick={() => navigate(ROUTES.ADMIN.AUCTIONS)}>
            <span className="material-symbols-outlined">gavel</span>
            Subastas
          </button>
          <button type="button" onClick={() => navigate(ROUTES.ADMIN.INVENTORY)}>
            <span className="material-symbols-outlined">inventory_2</span>
            Inventario
          </button>
          <button type="button" onClick={() => navigate(ROUTES.ADMIN.BRANCHES)}>
            <span className="material-symbols-outlined">account_tree</span>
            Sedes
          </button>
          <button type="button" className="active" onClick={() => navigate(ROUTES.ADMIN.USERS)}>
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
              group
            </span>
            Usuarios
          </button>
        </nav>

        <div className="users-side-footer">
          <button type="button" className="side-link">
            <span className="material-symbols-outlined">help</span>
            Soporte
          </button>
          <button type="button" className="side-link danger" onClick={handleLogout}>
            <span className="material-symbols-outlined">logout</span>
            Cerrar Sesion
          </button>
        </div>
      </aside>

      <main className="users-main">
        <header className="users-topbar">
          <label className="users-search" aria-label="Buscar usuarios">
            <span className="material-symbols-outlined">search</span>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar usuario o correo..." />
          </label>

          <div className="users-top-right">
            <button type="button" className="icon-btn" aria-label="Notificaciones">
              <span className="material-symbols-outlined">notifications</span>
              <i />
            </button>
            <button type="button" className="icon-btn" aria-label="Configuracion">
              <span className="material-symbols-outlined">settings</span>
            </button>
            <div className="top-separator" />
            <div className="top-profile">
              <div>
                <strong>Admin User</strong>
                <small>Administrator</small>
              </div>
              <div className="profile-image-placeholder" aria-label="Placeholder de imagen de administrador">
                IMG
              </div>
            </div>
          </div>
        </header>

        <section className="users-content">
          <div className="users-header-row">
            <div>
              <h2>Gestion de Usuarios</h2>
              <p>Administre los roles y permisos de afiliados, repartidores y administradores en toda la red MediGo.</p>
            </div>
          </div>

          {notice ? <p className="users-notice">{notice}</p> : null}

          <section className="users-metrics" aria-label="Indicadores de usuarios">
            <article>
              <p>Total Usuarios</p>
              <strong>{users.length}</strong>
            </article>
            <article>
              <p>Activos</p>
              <strong className="ok">{totalActive}</strong>
            </article>
            <article>
              <p>Inactivos</p>
              <strong className="warn">{totalInactive}</strong>
            </article>
          </section>

          <section className="users-table-card" aria-label="Tabla de usuarios">
            <div className="users-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>USUARIO</th>
                    <th>ROL</th>
                    <th>PEDIDOS</th>
                    <th>MIEMBRO DESDE</th>
                    <th>ESTADO</th>
                    <th className="actions">ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => {
                    const role = ROLE_META[user.role] || ROLE_META.AFILIADO
                    return (
                      <tr key={user.id}>
                        <td>
                          <div className="user-cell">
                            <div className={`avatar ${role.tone}`}>{user.name.slice(0, 1).toUpperCase()}</div>
                            <div>
                              <p>{user.name}</p>
                              <small>{user.email}</small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <label className={`role-pill ${role.tone}`}>
                            <span className="material-symbols-outlined">{role.icon}</span>
                            <select value={user.role} onChange={(event) => handleRoleChange(user, event.target.value)}>
                              <option value="ADMIN">Admin</option>
                              <option value="AFILIADO">Afiliado</option>
                              <option value="REPARTIDOR">Repartidor</option>
                            </select>
                          </label>
                        </td>
                        <td>
                          <strong className="deliveries">{new Intl.NumberFormat('es-CO').format(user.deliveries)}</strong>
                        </td>
                        <td>
                          <span className="joined">{user.joinedAt}</span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className={`status-btn ${user.active ? 'active' : 'inactive'}`}
                            onClick={() => handleToggleStatus(user)}
                          >
                            <span className="material-symbols-outlined">{user.active ? 'check_circle' : 'cancel'}</span>
                            {user.active ? 'Activo' : 'Inactivo'}
                          </button>
                        </td>
                        <td>
                          <div className="action-btns">
                            <button type="button" aria-label={`Editar ${user.name}`}>
                              <span className="material-symbols-outlined">edit</span>
                            </button>
                            <button type="button" aria-label={`Eliminar ${user.name}`} onClick={() => handleDelete(user)}>
                              <span className="material-symbols-outlined">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {filteredUsers.length === 0 ? <div className="empty-users">No hay usuarios que coincidan con "{search}".</div> : null}
          </section>

          <footer className="users-legal">Arquitectura del Sistema MediGo - Gestion Segura de Identidades</footer>
        </section>
      </main>

      {loading ? <div className="users-loading">Sincronizando usuarios...</div> : null}
    </div>
  )
}
