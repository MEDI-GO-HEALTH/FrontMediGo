/**
 * DriverSidebar.jsx
 * ═════════════════════════════════════════════════════════════════
 * Barra lateral de navegación para repartidores
 * - Menú de opciones (Mapa, Historial, Perfil)
 * - Botón de cerrar sesión
 */

import { useNavigate, useLocation } from 'react-router'
import { DRIVER_MENU, ROUTES } from '../../constants/routes'
import MedigoSidebarBrand from '../common/MedigoSidebarBrand'

export default function DriverSidebar() {
  const navigate = useNavigate()
  const location = useLocation()

  const isActive = (path) => location.pathname === path

  const handleLogout = () => {
    localStorage.removeItem('medigo_token')
    localStorage.removeItem('medigo_user')
    navigate(ROUTES.AUTH.LOGIN, { replace: true })
  }

  return (
    <aside className="bg-slate-50 dark:bg-slate-950 flex flex-col h-full border-r border-slate-100/10 w-72 fixed left-0 top-0 z-50 shadow-md">
      {/* Header */}
      <div className="px-8 py-10">
        <MedigoSidebarBrand
          containerClassName="flex items-center gap-3"
          logoContainerClassName="w-10 h-10 rounded-xl overflow-hidden"
          title="Driver Portal"
          subtitle="Clinical Logistics Unit"
          titleClassName="text-lg font-black text-sky-900 dark:text-sky-100 mb-1"
          subtitleClassName="text-xs text-slate-500 font-medium tracking-wide"
        />
      </div>

      {/* Menú de Navegación */}
      <nav className="flex-1 px-4 space-y-2">
        {DRIVER_MENU.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex items-center gap-4 px-4 py-4 rounded-xl transition-all w-full text-left ${
              isActive(item.path)
                ? 'bg-white dark:bg-slate-900 text-teal-700 font-bold shadow-sm border-r-4 border-teal-600'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              {item.icon}
            </span>
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-6 mt-auto">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-4 px-4 py-2 text-slate-600 hover:text-sky-900 transition-all text-left"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
            logout
          </span>
          <span className="text-sm">Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
