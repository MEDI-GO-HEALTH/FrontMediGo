import { useMemo } from 'react'
import { useNavigate } from 'react-router'
import { ROUTES } from '../../constants/routes'
import MedigoSidebarBrand from '../common/MedigoSidebarBrand'
import CarritoCompras from '../affiliate/CarritoCompras'

const SIDE_LINKS = [
  { key: 'map', label: 'Logistics Map', icon: 'map', path: ROUTES.AFFILIATE.MAP },
  { key: 'inventory', label: 'Branch Inventory', icon: 'inventory_2', path: ROUTES.AFFILIATE.INVENTORY },
  { key: 'auctions', label: 'Live Auctions', icon: 'gavel', path: ROUTES.AFFILIATE.AUCTIONS },
  { key: 'profile', label: 'Profile Settings', icon: 'account_circle', path: ROUTES.AFFILIATE.PROFILE },
]

const MOBILE_LINKS = [
  { key: 'map', label: 'Map', icon: 'explore', path: ROUTES.AFFILIATE.MAP },
  { key: 'inventory', label: 'Inventory', icon: 'inventory_2', path: ROUTES.AFFILIATE.INVENTORY },
  { key: 'auctions', label: 'Auctions', icon: 'payments', path: ROUTES.AFFILIATE.AUCTIONS },
  { key: 'profile', label: 'Profile', icon: 'person', path: ROUTES.AFFILIATE.PROFILE },
]

export default function AffiliateShell({ active = 'map', contentMode = 'contained', children }) {
  const navigate = useNavigate()

  const avatarLabel = useMemo(() => {
    const rawUser = localStorage.getItem('medigo_user')
    if (!rawUser) {
      return 'AF'
    }

    try {
      const user = JSON.parse(rawUser)
      const name = user?.name || 'Affiliate'
      const parts = String(name).trim().split(' ')
      const initials = `${parts[0]?.[0] || 'A'}${parts[1]?.[0] || 'F'}`.toUpperCase()
      return initials
    } catch {
      return 'AF'
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('medigo_token')
    localStorage.removeItem('medigo_user')
    navigate(ROUTES.AUTH.LOGIN, { replace: true })
  }

  return (
    <div className="affiliate-profile-page">
      <header className="affiliate-topbar">
        <div className="affiliate-topbar-inner">
          <h2 className="affiliate-top-title">MediGo Clinical Logistics</h2>

          <div className="affiliate-top-right">
            <div className="affiliate-online" aria-label="Estado de conexion">
              <span />
              <span>Online</span>
            </div>
            <div className="affiliate-avatar" aria-label="Avatar por defecto de afiliado">{avatarLabel}</div>
          </div>
        </div>
      </header>

      <div className="affiliate-shell">
        <aside className="affiliate-sidebar" aria-label="Navegacion lateral afiliado">
          <div className="affiliate-side-head">
            <MedigoSidebarBrand
              containerClassName="affiliate-side-brand"
              logoContainerClassName="affiliate-side-logo"
              textContainerClassName="affiliate-side-brand-text"
              title="Affiliate Portal"
              subtitle="Clinical Logistics Unit"
            />
            <h2>Configuracion</h2>
          </div>

          <nav className="affiliate-nav">
            {SIDE_LINKS.map((item) => (
              <button
                key={item.key}
                type="button"
                className={active === item.key ? 'active' : ''}
                onClick={() => navigate(item.path)}
              >
                <span
                  className="material-symbols-outlined"
                  style={active === item.key ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  {item.icon}
                </span>
                {item.label}
              </button>
            ))}
          </nav>

          <div className="affiliate-side-footer">
            <button type="button" className="affiliate-side-link">
              <span className="material-symbols-outlined">help_outline</span>
              Support
            </button>
            <button type="button" className="affiliate-side-link danger" onClick={handleLogout}>
              <span className="material-symbols-outlined">logout</span>
              Sign Out
            </button>
          </div>
        </aside>

        <main className={`affiliate-main${contentMode === 'fluid' ? ' fluid' : ''}`}>
          <div className={`affiliate-content${contentMode === 'fluid' ? ' fluid' : ''}`}>{children}</div>
        </main>
      </div>

      <CarritoCompras />

      <nav className="affiliate-mobile-bottom" aria-label="Navegacion movil afiliado">
        {MOBILE_LINKS.map((item) => (
          <button
            key={item.key}
            type="button"
            className={active === item.key ? 'active' : ''}
            onClick={() => navigate(item.path)}
          >
            <span
              className="material-symbols-outlined"
              style={active === item.key ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              {item.icon}
            </span>
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
