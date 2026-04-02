/**
 * AdminSidebar.jsx
 * ═════════════════════════════════════════════════════════════════
 * Barra lateral de navegación para administradores
 * - Menú de opciones (Subastas, Inventario, Sedes, Usuarios)
 * - Botón para crear nueva entrada
 * - Botón de cerrar sesión
 */

import { useNavigate, useLocation } from 'react-router'
import { ADMIN_MENU, ROUTES } from '../../constants/routes'

export default function AdminSidebar() {
  const navigate = useNavigate()
  const location = useLocation()

  const isActive = (path) => location.pathname === path

  const handleLogout = () => {
    localStorage.removeItem('medigo_token')
    localStorage.removeItem('medigo_user')
    navigate(ROUTES.AUTH.LOGIN, { replace: true })
  }

  return (
    <aside className="h-screen w-64 fixed left-0 top-0 bg-slate-100 flex flex-col py-6 px-4 z-50 shadow-lg">
      {/* Logo */}
      <div className="mb-10 px-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-container flex items-center justify-center text-white">
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              medical_services
            </span>
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-primary tracking-tight">MediGo Admin</h1>
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Clinical Precision</p>
          </div>
        </div>
      </div>

      {/* Menú de Navegación */}
      <nav className="flex-1 space-y-2">
        {ADMIN_MENU.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg shadow-sm transition-all duration-200 ${
              isActive(item.path)
                ? 'bg-white text-sky-700 font-bold'
                : 'text-slate-600 hover:bg-white/50'
            }`}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              {item.icon}
            </span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Acciones en Footer */}
      <div className="mt-auto pt-6 space-y-2">
        <button className="w-full mb-6 py-3 px-4 bg-gradient-to-r from-primary to-primary-container text-white rounded-lg font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-shadow">
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
            add
          </span>
          <span>Nueva Entrada</span>
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-2 text-slate-600 hover:bg-white/50 hover:text-primary transition-all text-left rounded-lg"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
            logout
          </span>
          <span className="text-sm">Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  )
}
