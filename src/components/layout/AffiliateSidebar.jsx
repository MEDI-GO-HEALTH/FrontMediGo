/**
 * AffiliateSidebar.jsx
 * ═════════════════════════════════════════════════════════════════
 * Barra lateral de navegación para afiliados
 * - Menú de opciones (Mapa Logístico, Subastas, Perfil)
 * - Botón de cerrar sesión
 */

import { useNavigate, useLocation } from 'react-router'
import { AFFILIATE_MENU, ROUTES } from '../../constants/routes'

export default function AffiliateSidebar() {
  const navigate = useNavigate()
  const location = useLocation()

  const isActive = (path) => location.pathname === path

  const handleLogout = () => {
    localStorage.removeItem('medigo_token')
    localStorage.removeItem('medigo_user')
    navigate(ROUTES.AUTH.LOGIN, { replace: true })
  }

  return (
    <aside className="hidden lg:flex flex-col h-screen w-64 fixed left-0 top-0 bg-slate-50 border-r border-slate-100 z-50 pt-24 shadow-md">
      <div className="px-6 mb-8">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Configuración</h2>
      </div>

      {/* Menú de Navegación */}
      <nav className="flex-1 space-y-1">
        {AFFILIATE_MENU.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex items-center px-4 py-3 mx-2 rounded-xl transition-all group w-full text-left ${
              isActive(item.path)
                ? 'bg-white text-sky-700 font-semibold shadow-sm'
                : 'text-slate-600 hover:bg-sky-50'
            }`}
          >
            <span
              className="material-symbols-outlined mr-3 text-slate-400 group-hover:text-sky-600"
              style={{ fontSize: '20px' }}
            >
              {item.icon}
            </span>
            <span className="text-sm font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 mt-auto space-y-1">
        <button
          onClick={handleLogout}
          className="w-full flex items-center px-4 py-3 mx-2 text-error hover:bg-error-container/20 rounded-xl transition-all text-left"
        >
          <span className="material-symbols-outlined mr-3" style={{ fontSize: '20px' }}>
            logout
          </span>
          <span className="text-sm font-medium">Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
