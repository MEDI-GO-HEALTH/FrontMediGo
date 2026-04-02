# 📁 Estructura del Proyecto MediGo

## 🏗️ Arquitectura General

```
frontmedigo/
├── src/
│   ├── api/                          # Servicios HTTP y conexión a backend
│   │   ├── authService.js            # Autenticación (login, logout)
│   │   ├── client.js                 # Cliente HTTP (Axios)
│   │   ├── inventarioService.js      # Servicios de inventario
│   │   ├── repartidorService.js      # Servicios de repartidores
│   │   ├── sedesService.js           # Servicios de sedes
│   │   ├── subastaService.js         # Servicios de subastas
│   │   └── usuariosService.js        # Servicios de usuarios
│   │
│   ├── components/
│   │   ├── layout/                   # Layouts y sidebars
│   │   │   ├── AdminSidebar.jsx      # Menú lateral para admins
│   │   │   ├── AffiliateSidebar.jsx  # Menú lateral para afiliados
│   │   │   └── DriverSidebar.jsx     # Menú lateral para repartidores
│   │   │
│   │   └── common/                   # Componentes reutilizables
│   │       ├── Button.jsx            # (Futuro) Botones personalizados
│   │       ├── Modal.jsx             # (Futuro) Componente modal
│   │       └── Table.jsx             # (Futuro) Tabla personalizada
│   │
│   ├── pages/
│   │   ├── auth/                     # Páginas de autenticación
│   │   │   ├── Login.jsx             # Página de inicio de sesión
│   │   │   └── Register.jsx          # Página de registro
│   │   │
│   │   ├── admin/                    # Módulo de administración
│   │   │   ├── GestionSubastas.jsx   # Gestión de subastas
│   │   │   ├── Inventario.jsx        # Gestión de inventario
│   │   │   ├── GestionSedes.jsx      # Gestión de sedes
│   │   │   └── GestionUsuarios.jsx   # Gestión de usuarios
│   │   │
│   │   ├── affiliate/                # Módulo de afiliados
│   │   │   ├── MapaPedidos.jsx       # Mapa logístico de pedidos
│   │   │   ├── CentroSubastas.jsx    # Centro de subastas en vivo
│   │   │   └── PerfilAfiliado.jsx    # Perfil del afiliado
│   │   │
│   │   └── driver/                   # Módulo de repartidores
│   │       ├── MapaEntregas.jsx      # Mapa de entregas GPS
│   │       ├── HistorialViajes.jsx   # Historial de entregas
│   │       └── PerfilRepartidor.jsx  # Perfil del repartidor
│   │
│   ├── constants/
│   │   └── routes.js                 # Rutas, menús y configuración
│   │
│   ├── hooks/                        # Custom hooks (futuros)
│   │   └── (vacío)
│   │
│   ├── styles/
│   │   ├── design-system.css         # Variables CSS del Design System
│   │   └── login.css                 # Estilos específicos del login
│   │
│   ├── App.jsx                       # Componente raíz con rutas
│   ├── App.css                       # Estilos globales
│   ├── main.jsx                      # Punto de entrada (Vite)
│   └── index.css                     # Configuración de Tailwind
│
├── doc/
│   ├── API_CONNECTIONS.md            # Documentación de APIs
│   └── PROJECT_ARCHITECTURE.md       # Este archivo
│
├── public/
│   └── (assets estáticos)
│
├── package.json                      # Dependencias del proyecto
├── vite.config.js                    # Configuración de Vite
├── tailwind.config.js                # Configuración de Tailwind
├── .env.local                        # Variables de entorno
└── README.md                         # Readme principal
```

## 🎯 Rutas del Aplicativo

### Públicas (Sin autenticación)
- `/` → Login (redirige automáticamente según rol)
- `/register` → Registro de nuevos usuarios

### Protegidas - Admin
- `/admin/subastas` → Gestión de subastas
- `/admin/inventario` → Gestión de inventario
- `/admin/sedes` → Gestión de sedes
- `/admin/usuarios` → Gestión de usuarios

### Protegidas - Afiliado
- `/afiliado/mapa` → Mapa logístico de pedidos
- `/afiliado/subastas` → Centro de subastas
- `/afiliado/perfil` → Perfil del afiliado

### Protegidas - Repartidor
- `/repartidor/mapa` → Mapa de entregas
- `/repartidor/historial` → Historial de viajes
- `/repartidor/perfil` → Perfil del repartidor

## 🔐 Sistema de Autenticación

### Flow de Login
1. Usuario ingresa credenciales en `/login`
2. Se envía POST a `authService.login(email, password)`
3. Backend devuelve: `{ token, user: { id, name, email, role } }`
4. Se guarda en localStorage:
   - `medigo_token` → JWT token
   - `medigo_user` → JSON del usuario
5. Se valida el rol y se redirige automáticamente:
   - `ADMIN` → `/admin/inventario`
   - `AFILIADO` → `/afiliado/subastas`
   - `REPARTIDOR` → `/repartidor/mapa`

### Protección de Rutas
- Componente `ProtectedRoute` en `App.jsx`
- Valida token y rol antes de renderizar página
- Redirige a login si no está autenticado o no tiene permiso

## 🎨 Design System "Clinical Sanctuary"

### Colores (CSS Variables)
```css
--primary: #003358
--primary-container: #004a7c
--secondary: #006a6a
--secondary-container: #9ef1f0
--tertiary: #1a343f
--error: #ba1a1a
--surface: #f8f9fb
--on-surface: #191c1e
```

### Tipografía
- Headlines: `Plus Jakarta Sans` (Bold, ExtraBold)
- Body/Labels: `Inter` (Regular 400, Medium 500, Semibold 600)

### Componentes
- Glass panels: glassmorphism con blur(24px)
- Gradientes primarios: 135deg de primary a primary-container
- Ghost borders: 15% opacity
- Shadow: ambient occlusion style

## 📦 Dependencias Principales

```json
{
  "react": "^19.2.4",
  "react-router": "^7.13.2",
  "axios": "^1.14.0",
  "lucide-react": "^1.7.0",
  "tailwindcss": "^4.0.0",
  "vite": "^6.0.0"
}
```

## 🚀 Mejores Prácticas Implementadas

### 1. Separación de Responsabilidades
- **Componentes de Layout**: Sidebars, Headers
- **Páginas**: Vistas completas por módulo
- **Servicios API**: Llamadas al backend centralizadas
- **Constantes**: Rutas, menús, configuración

### 2. Estructura de Carpetas
- Organización por funcionalidad (admin, affiliate, driver)
- Componentes reutilizables en `/components`
- Servicios en `/api`
- Constantes en `/constants`

### 3. Seguridad
- JWT tokens en localStorage
- Validación de roles en rutas protegidas
- Logout elimina tokens automáticamente
- Redirección a login si sesión vence

### 4. Código Limpio
- Nombres descriptivos y coherentes
- Documentación en comentarios JSDoc
- Separación clara de concerns
- Reutilización de componentes

### 5. Escalabilidad
- Fácil agregar nuevas rutas en `constants/routes.js`
- Estructura preparada para más módulos
- Componentes hook-ready para futuras mejoras
- API service abstraído y preparado

## 📝 Próximos Pasos

- [ ] Implementar hooks personalizados (`useAuth`, `useApi`)
- [ ] Crear componentes comunes (`Button`, `Modal`, `Table`)
- [ ] Conectar servicios API reales
- [ ] Agregar validación de formularios con react-hook-form
- [ ] Implementar notificaciones (toast)
- [ ] Agregar tests unitarios
- [ ] Configurar CI/CD
- [ ] Implementar 2FA
- [ ] Agregar OAuth (Google, Microsoft)

## 🔗 Referencias Proyecto

- **Vite**: https://vite.dev/
- **React Router**: https://reactrouter.com/
- **Tailwind CSS**: https://tailwindcss.com/
- **Lucide Icons**: https://lucide.dev/
