/**
 * App.jsx
 * ═════════════════════════════════════════════════════════════════
 * Componente raíz de la aplicación
 * - Configuración de rutas con React Router
 * - Protección de rutas según autenticación y rol
 * - Encaminamiento dinámico basado en roles de usuario
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import { useState, useEffect } from 'react'

// ═════════════════════════════════════════════════════════════════
// PÁGINAS DE AUTENTICACIÓN
// ═════════════════════════════════════════════════════════════════
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'

// ═════════════════════════════════════════════════════════════════
// PÁGINAS DE ADMINISTRADOR
// ═════════════════════════════════════════════════════════════════
import GestionSubastas from './pages/admin/GestionSubastas'
import Inventario from './pages/admin/Inventario'
import GestionSedes from './pages/admin/GestionSedes'
import GestionUsuarios from './pages/admin/GestionUsuarios'

// ═════════════════════════════════════════════════════════════════
// PÁGINAS DE AFILIADO
// ═════════════════════════════════════════════════════════════════
import MapaPedidos from './pages/affiliate/MapaPedidos'
import CentroSubastas from './pages/affiliate/CentroSubastas'
import PerfilAfiliado from './pages/affiliate/PerfilAfiliado'

// ═════════════════════════════════════════════════════════════════
// PÁGINAS DE REPARTIDOR
// ═════════════════════════════════════════════════════════════════
import MapaEntregas from './pages/driver/MapaEntregas'
import HistorialViajes from './pages/driver/HistorialViajes'
import PerfilRepartidor from './pages/driver/PerfilRepartidor'

// ═════════════════════════════════════════════════════════════════
// CONSTANTES DE RUTAS
// ═════════════════════════════════════════════════════════════════
import { ROUTES } from './constants/routes'

// ═════════════════════════════════════════════════════════════════
// COMPONENTE: ProtectedRoute
// ═════════════════════════════════════════════════════════════════
/**
 * Envuelve rutas que requieren autenticación
 * - Valida que exista token
 * - Valida que el rol sea permitido
 * - Redirige a login si no está autenticado
 */
function ProtectedRoute({ children, allowedRoles }) {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    try {
      const token = localStorage.getItem('medigo_token')
      const userStr = localStorage.getItem('medigo_user')

      if (!token || !userStr) {
        setIsAuthorized(false)
        setIsLoading(false)
        return
      }

      const user = JSON.parse(userStr)

      if (allowedRoles && !allowedRoles.includes(user.role)) {
        setIsAuthorized(false)
        setIsLoading(false)
        return
      }

      setIsAuthorized(true)
    } catch (error) {
      console.error('Auth validation error:', error)
      setIsAuthorized(false)
    } finally {
      setIsLoading(false)
    }
  }, [allowedRoles])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-600 font-medium">Verificando autenticación...</p>
        </div>
      </div>
    )
  }

  if (!isAuthorized) {
    return <Navigate to={ROUTES.AUTH.LOGIN} replace />
  }

  return children
}

// ═════════════════════════════════════════════════════════════════
// COMPONENTE: App
// Punto de entrada principal con rutas
// ═════════════════════════════════════════════════════════════════
export default function App() {
  // Asegurar Light Mode siempre
  useEffect(() => {
    document.documentElement.classList.remove('dark')
    document.documentElement.setAttribute('color-scheme', 'light')
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        {/* ═════════════════════════════════════════════════════════════
            RUTAS PÚBLICAS (Sin autenticación)
            ═════════════════════════════════════════════════════════════ */}
        <Route path={ROUTES.AUTH.LOGIN} element={<Login />} />
        <Route path={ROUTES.AUTH.REGISTER} element={<Register />} />

        {/* ═════════════════════════════════════════════════════════════
            RUTAS DE ADMIN (Requiere role = 'ADMIN')
            ═════════════════════════════════════════════════════════════ */}
        <Route
          path={ROUTES.ADMIN.AUCTIONS}
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <GestionSubastas />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.ADMIN.INVENTORY}
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <Inventario />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.ADMIN.BRANCHES}
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <GestionSedes />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.ADMIN.USERS}
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <GestionUsuarios />
            </ProtectedRoute>
          }
        />

        {/* ═════════════════════════════════════════════════════════════
            RUTAS DE AFILIADO (Requiere role = 'AFILIADO')
            ═════════════════════════════════════════════════════════════ */}
        <Route
          path={ROUTES.AFFILIATE.MAP}
          element={
            <ProtectedRoute allowedRoles={['AFILIADO', 'AFFILIATE']}>
              <MapaPedidos />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.AFFILIATE.AUCTIONS}
          element={
            <ProtectedRoute allowedRoles={['AFILIADO', 'AFFILIATE']}>
              <CentroSubastas />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.AFFILIATE.PROFILE}
          element={
            <ProtectedRoute allowedRoles={['AFILIADO', 'AFFILIATE']}>
              <PerfilAfiliado />
            </ProtectedRoute>
          }
        />

        {/* ═════════════════════════════════════════════════════════════
            RUTAS DE REPARTIDOR (Requiere role = 'REPARTIDOR')
            ═════════════════════════════════════════════════════════════ */}
        <Route
          path={ROUTES.DRIVER.MAP}
          element={
            <ProtectedRoute allowedRoles={['REPARTIDOR', 'DELIVERY']}>
              <MapaEntregas />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.DRIVER.HISTORY}
          element={
            <ProtectedRoute allowedRoles={['REPARTIDOR', 'DELIVERY']}>
              <HistorialViajes />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.DRIVER.PROFILE}
          element={
            <ProtectedRoute allowedRoles={['REPARTIDOR', 'DELIVERY']}>
              <PerfilRepartidor />
            </ProtectedRoute>
          }
        />

        {/* ═════════════════════════════════════════════════════════════
            RUTAS POR DEFECTO
            ═════════════════════════════════════════════════════════════ */}
        <Route path="/" element={<Navigate to={ROUTES.AUTH.LOGIN} replace />} />
        <Route path="*" element={<Navigate to={ROUTES.AUTH.LOGIN} replace />} />
      </Routes>
    </BrowserRouter>
  )
}
