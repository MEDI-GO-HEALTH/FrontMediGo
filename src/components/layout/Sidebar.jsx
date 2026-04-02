import { NavLink, useNavigate, useLocation } from 'react-router'
import {
  LayoutGrid, Package, Building2, Users, MapPin,
  Gavel, History, User, LogOut, ChevronRight
} from 'lucide-react'

const NAV_CONFIG = {
  ADMIN: [
    { to: '/admin/inventario',     icon: Package,    label: 'Inventario' },
    { to: '/admin/sedes',          icon: Building2,  label: 'Sedes' },
    { to: '/admin/sedes-usuarios', icon: LayoutGrid, label: 'Sedes & Usuarios' },
    { to: '/admin/usuarios',       icon: Users,      label: 'Usuarios' },
  ],
  AFILIADO: [
    { to: '/afiliado/subastas', icon: Gavel,   label: 'Centro de Subastas' },
    { to: '/afiliado/mapa',     icon: MapPin,  label: 'Mapa en Tiempo Real' },
    { to: '/afiliado/perfil',   icon: User,    label: 'Mi Perfil' },
  ],
  REPARTIDOR: [
    { to: '/repartidor/subastas',  icon: Gavel,   label: 'Subastas' },
    { to: '/repartidor/mapa',      icon: MapPin,  label: 'Mapa de Entregas' },
    { to: '/repartidor/historial', icon: History, label: 'Historial' },
    { to: '/repartidor/perfil',    icon: User,    label: 'Mi Perfil' },
  ],
}

const ROLE_LABELS = {
  ADMIN: 'Administrador',
  AFILIADO: 'Afiliado',
  REPARTIDOR: 'Repartidor',
}

const ROLE_COLORS = {
  ADMIN:      { bg: 'rgba(124,58,237,0.15)', color: '#d2bbff' },
  AFILIADO:   { bg: 'rgba(0,254,102,0.12)',  color: '#00fe66' },
  REPARTIDOR: { bg: 'rgba(123,208,255,0.12)', color: '#7bd0ff' },
}

export default function Sidebar() {
  const navigate  = useNavigate()
  const { pathname } = useLocation()

  const user = JSON.parse(localStorage.getItem('medigo_user') || '{}')
  const role = user.role || 'ADMIN'
  const navItems = NAV_CONFIG[role] || []
  const roleColor = ROLE_COLORS[role]

  const handleLogout = () => {
    localStorage.removeItem('medigo_token')
    localStorage.removeItem('medigo_user')
    navigate('/login')
  }

  return (
    <aside style={styles.sidebar}>
      {/* Logo */}
      <div style={styles.logo}>
        <div style={styles.logoIcon}>
          <span style={{ fontSize: 20 }}>💊</span>
        </div>
        <span style={styles.logoText}>Medi<span style={{ color: 'var(--primary)' }}>Go</span></span>
      </div>

      {/* Badge de rol */}
      <div style={{ ...styles.roleBadge, background: roleColor.bg, color: roleColor.color }}>
        {ROLE_LABELS[role]}
      </div>

      {/* Nav Items */}
      <nav style={styles.nav}>
        {navItems.map(({ to, icon: Icon, label }) => {
          const active = pathname.startsWith(to)
          return (
            <NavLink key={to} to={to} style={{ textDecoration: 'none' }}>
              <div style={{
                ...styles.navItem,
                ...(active ? styles.navItemActive : {}),
              }}>
                <Icon size={18} style={{ color: active ? 'var(--primary)' : 'var(--on-surface-variant)', flexShrink: 0 }} />
                <span style={{ color: active ? 'var(--on-surface)' : 'var(--on-surface-variant)', fontSize: '0.875rem', fontWeight: active ? 600 : 400 }}>
                  {label}
                </span>
                {active && <ChevronRight size={14} style={{ marginLeft: 'auto', color: 'var(--primary)' }} />}
              </div>
            </NavLink>
          )
        })}
      </nav>

      {/* Usuario actual + Logout */}
      <div style={styles.footer}>
        <div style={styles.userInfo}>
          <div style={styles.avatar}>
            {(user.name || 'U')[0].toUpperCase()}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <p style={{ color: 'var(--on-surface)', fontSize: '0.85rem', fontWeight: 600, fontFamily: 'var(--font-display)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user.name || 'Usuario'}
            </p>
            <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.75rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user.email || ''}
            </p>
          </div>
        </div>
        <button onClick={handleLogout} style={styles.logoutBtn} title="Cerrar sesión">
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  )
}

const styles = {
  sidebar: {
    width: 260,
    minHeight: '100vh',
    background: 'var(--surface-container-low)',
    borderRight: '1px solid rgba(74,68,85,0.3)',
    display: 'flex',
    flexDirection: 'column',
    padding: '1.5rem 1rem',
    position: 'fixed',
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 100,
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '1.5rem',
    paddingLeft: '0.25rem',
  },
  logoIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    background: 'linear-gradient(135deg, #7c3aed, #d2bbff)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontFamily: 'var(--font-display)',
    fontWeight: 800,
    fontSize: '1.3rem',
    color: 'var(--on-surface)',
    letterSpacing: '-0.5px',
  },
  roleBadge: {
    fontSize: '0.7rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    padding: '4px 10px',
    borderRadius: 'var(--radius-full)',
    alignSelf: 'flex-start',
    marginBottom: '1.5rem',
    marginLeft: '0.25rem',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    flex: 1,
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.65rem 0.85rem',
    borderRadius: 'var(--radius-lg)',
    cursor: 'pointer',
    transition: 'background var(--transition-fast)',
    textDecoration: 'none',
  },
  navItemActive: {
    background: 'rgba(124, 58, 237, 0.12)',
  },
  footer: {
    borderTop: '1px solid rgba(74,68,85,0.3)',
    paddingTop: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  userInfo: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: '0.65rem',
    overflow: 'hidden',
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 'var(--radius-full)',
    background: 'linear-gradient(135deg, #7c3aed, #d2bbff)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontWeight: 700,
    fontSize: '0.85rem',
    flexShrink: 0,
    fontFamily: 'var(--font-display)',
  },
  logoutBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--on-surface-variant)',
    padding: '0.4rem',
    borderRadius: 'var(--radius-md)',
    display: 'flex',
    alignItems: 'center',
    transition: 'color var(--transition-fast), background var(--transition-fast)',
  },
}
