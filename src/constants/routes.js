/**
 * RUTAS Y REDIRECCIONES DEL APLICATIVO
 * ═════════════════════════════════════════════════════════════════
 * Define todas las rutas y redirecciones basadas en roles de usuario
 */

export const ROLE_REDIRECTS = {
  ADMIN: '/admin/inventario',
  AFILIADO: '/afiliado/subastas',
  REPARTIDOR: '/repartidor/mapa',
}

export const ROUTES = {
  AUTH: {
    LOGIN: '/',
    REGISTER: '/register',
  },
  ADMIN: {
    AUCTIONS: '/admin/subastas',
    INVENTORY: '/admin/inventario',
    BRANCHES: '/admin/sedes',
    USERS: '/admin/usuarios',
  },
  AFFILIATE: {
    MAP: '/afiliado/mapa',
    AUCTIONS: '/afiliado/subastas',
    PROFILE: '/afiliado/perfil',
  },
  DRIVER: {
    MAP: '/repartidor/mapa',
    HISTORY: '/repartidor/historial',
    PROFILE: '/repartidor/perfil',
  },
}

// Menú de navegación para Admin
export const ADMIN_MENU = [
  {
    label: 'Subastas',
    icon: 'gavel',
    path: ROUTES.ADMIN.AUCTIONS,
  },
  {
    label: 'Inventario',
    icon: 'inventory_2',
    path: ROUTES.ADMIN.INVENTORY,
  },
  {
    label: 'Sedes',
    icon: 'account_tree',
    path: ROUTES.ADMIN.BRANCHES,
  },
  {
    label: 'Usuarios',
    icon: 'group',
    path: ROUTES.ADMIN.USERS,
  },
]

// Menú de navegación para Afiliado
export const AFFILIATE_MENU = [
  {
    label: 'Logistics Map',
    icon: 'map',
    path: ROUTES.AFFILIATE.MAP,
  },
  {
    label: 'Live Auctions',
    icon: 'gavel',
    path: ROUTES.AFFILIATE.AUCTIONS,
  },
  {
    label: 'Profile Settings',
    icon: 'account_circle',
    path: ROUTES.AFFILIATE.PROFILE,
  },
]

// Menú de navegación para Repartidor
export const DRIVER_MENU = [
  {
    label: 'Mapa de Entregas',
    icon: 'map',
    path: ROUTES.DRIVER.MAP,
  },
  {
    label: 'Historial de Viajes',
    icon: 'history',
    path: ROUTES.DRIVER.HISTORY,
  },
  {
    label: 'Configuración de Perfil',
    icon: 'settings_accessibility',
    path: ROUTES.DRIVER.PROFILE,
  },
]
