# 🛠️ Guía de Desarrollo - MediGo Frontend

## 🚀 Inicio Rápido

### Requisitos Previos
```bash
Node.js >= 18.x
npm >= 9.x
Git
```

### Instalación
```bash
# 1. Clonar el repositorio
git clone [repository-url]
cd frontmedigo

# 2. Instalar dependencias
npm install

# 3. Crear archivo .env.local
cp .env.example .env.local

# 4. Iniciar servidor de desarrollo
npm run dev
```

### Compilación para Producción
```bash
npm run build    # Genera carpeta dist/
npm run preview  # Visualiza build localmente
```

## 📱 Testing de Roles

### Quick Login Buttons (Modo Desarrollo)
En la página `/login`, hay tres botones de acceso rápido:

1. **ADMIN**
   - Usuario: admin@medigo.com
   - Acceso a: Gestión de subastas, inventario, sedes, usuarios

2. **AFILIADO**
   - Usuario: afiliado@medigo.com
   - Acceso a: Mapa de pedidos, subastas, perfil

3. **REPARTIDOR**
   - Usuario: driver@medigo.com
   - Acceso a: Mapa de entregas, historial, perfil

**Nota**: Estos botones son solo para desarrollo. En producción, usar credenciales reales.

## 🏗️ Estructura de Desarrollo

### Agregar Una Nueva Página

1. **Crear archivo en `/pages`**
   ```jsx
   // src/pages/admin/MiNuevaPage.jsx
   import { useNavigate, useLocation } from 'react-router-dom';
   import AdminSidebar from '../../components/layout/AdminSidebar';

   export default function MiNuevaPage() {
     return (
       <div className="flex">
         <AdminSidebar />
         <div className="flex-1 p-6">
           <h1 className="text-2xl font-bold">Mi Nueva Página</h1>
         </div>
       </div>
     );
   }
   ```

2. **Agregar entrada en `constants/routes.js`**
   ```javascript
   admin: {
     // ... otras rutas
     miNuevaPage: '/admin/mi-nueva-page',
   },
   
   const ADMIN_MENU = [
     // ... otros items
     {
       label: 'Mi Nueva Página',
       path: ROUTES.admin.miNuevaPage,
       icon: 'new_icon_name',
     },
   ];
   ```

3. **Agregar ruta en `App.jsx`**
   ```jsx
   <Route path={ROUTES.admin.miNuevaPage} element={
     <ProtectedRoute allowedRoles={['ADMIN']}>
       <MiNuevaPage />
     </ProtectedRoute>
   } />
   ```

### Agregar Un Nuevo Rol

1. **Agregar role en backend y localStorage**
   - Backend debe devolver `{ role: 'MI_NUEVO_ROLE' }`

2. **Crear sidebar en `components/layout/MiNuevoRolSidebar.jsx`**
   ```jsx
   // Copiar estructura de AdminSidebar.jsx o similar
   ```

3. **Actualizar `constants/routes.js`**
   ```javascript
   const ROLE_REDIRECTS = {
     'MI_NUEVO_ROLE': '/nuevo-role/dashboard',
     // ... otros
   };

   const MI_NUEVO_ROLE_MENU = [
     // Items del menú
   ];
   ```

4. **Actualizar `App.jsx`** con nuevas rutas protegidas

## 🔌 Integración de API

### Estructura de Servicios

Todos los servicios están en `/src/api/`. Ejemplo:

```javascript
// src/api/miService.js
import client from './client';

const API_BASE = '/api/v1'; // Ajustar según backend

export const miService = {
  // Obtener todos los items
  async getAll() {
    const { data } = await client.get(`${API_BASE}/items`);
    return data;
  },

  // Obtener un item por ID
  async getById(id) {
    const { data } = await client.get(`${API_BASE}/items/${id}`);
    return data;
  },

  // Crear nuevo item
  async create(item) {
    const { data } = await client.post(`${API_BASE}/items`, item);
    return data;
  },

  // Actualizar item
  async update(id, item) {
    const { data } = await client.put(`${API_BASE}/items/${id}`, item);
    return data;
  },

  // Eliminar item
  async delete(id) {
    await client.delete(`${API_BASE}/items/${id}`);
  },
};
```

### Usar en Componentes

```jsx
import { useState, useEffect } from 'react';
import { miService } from '../../api/miService';

export default function MyComponent() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const data = await miService.getAll();
      setItems(data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching items:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {items.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  );
}
```

## 🎨 Usando Tailwind CSS

### Clases Útiles

```jsx
// Tipografía
<h1 className="text-3xl font-bold">Título</h1>
<p className="text-sm text-gray-600">Descripción</p>

// Layout
<div className="flex justify-between items-center">
  <span>Izquierda</span>
  <span>Derecha</span>
</div>

// Grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Items */}
</div>

// Espaciado
<div className="p-6 m-4">Contenido</div>

// Colores
<button className="bg-blue-600 text-white px-4 py-2 rounded">
  Botón
</button>

// Responsive
<div className="hidden md:block lg:flex">
  Solo visible en md y lg
</div>

// Gradientes
<div className="bg-gradient-to-r from-blue-500 to-purple-600">
  Gradient
</div>
```

### Colores del Design System

```jsx
// Primario
className="text-primary-600 bg-primary-100"

// Secundario
className="text-secondary-600 bg-secondary-100"

// Error
className="text-error-600 bg-error-100"

// Surface
className="bg-surface text-on-surface"
```

## 🧪 Testing Manual

### Checklist de Testing por Rol

#### Admin
- [ ] Acceder como admin
- [ ] Ver todas las opciones del menú
- [ ] Navegar a cada sección
- [ ] Ver datos en tablas
- [ ] Hacer logout

#### Afiliado
- [ ] Acceder como afiliado
- [ ] Ver mapa de pedidos
- [ ] Ver centro de subastas
- [ ] Ver perfil
- [ ] Hacer logout

#### Repartidor
- [ ] Acceder como repartidor
- [ ] Ver mapa de entregas
- [ ] Ver historial
- [ ] Ver perfil
- [ ] Hacer logout

## 🐛 Debugging

### VS Code Debug Console
```javascript
// Ver token actual
console.log(localStorage.getItem('medigo_token'));

// Ver usuario actual
console.log(JSON.parse(localStorage.getItem('medigo_user')));

// Limpiar sesión (para testing)
localStorage.removeItem('medigo_token');
localStorage.removeItem('medigo_user');
```

### React DevTools
- Instalar extensión "React Developer Tools" en Chrome/Firefox
- Inspeccionar estado de componentes
- Ver árbol de componentes
- Debuggear hooks

### Network Tab
- Abrir DevTools → Network
- Ver todas las request HTTP
- Verificar status codes
- Revisar payloads

## 📋 Estándares de Código

### Naming Conventions
```javascript
// Componentes (PascalCase)
MyComponent.jsx

// Variables y funciones (camelCase)
const myVariable = 'value';
function myFunction() {}

// Constantes (UPPER_SNAKE_CASE)
const MY_CONSTANT = 'value';

// Rutas (kebab-case)
/admin/list-users
/afiliado/mapa-pedidos
```

### Estructura de Componentes
```jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// ... otros imports

/**
 * Descripción del componente
 * @component
 * @example
 * return <MyComponent />
 */
export default function MyComponent() {
  // Hooks
  const [state, setState] = useState(initial);
  const navigate = useNavigate();

  // Effects
  useEffect(() => {
    // Lógica
  }, []);

  // Funciones
  const handleAction = () => {
    // Acción
  };

  // Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```

## 🔐 Seguridad

### No Hacer ❌
```javascript
// ❌ No guardar passwords
localStorage.setItem('password', password);

// ❌ No hacer requests sin validar token
fetch('/api/data'); // Sin token

// ❌ No exponer datos sensibles en código
const API_KEY = 'sk-1234567890';

// ❌ No confiar en datos del cliente
if (localStorage.getItem('medigo_user').role === 'ADMIN') {
  // ❌ El rol debe validarse en backend
}
```

### Hacer ✅
```javascript
// ✅ Guardar solo token y necesario
localStorage.setItem('medigo_token', token);
localStorage.setItem('medigo_user', JSON.stringify(user));

// ✅ Siempre incluir token en requests
const client = axios.create({
  headers: {
    Authorization: `Bearer ${token}`
  }
});

// ✅ Guardar secrets en .env.local
const API_URL = import.meta.env.VITE_API_URL;

// ✅ Validar roles en backend
// El backend DEBE validar el rol del token
// El frontend solo puede redirigir UX
```

## 📦 Variables de Entorno

Crear archivo `.env.local`:
```
VITE_API_URL=http://localhost:8080/api
VITE_APP_NAME=MediGo
VITE_APP_VERSION=1.0.0
```

Usar en código:
```javascript
const apiUrl = import.meta.env.VITE_API_URL;
const appName = import.meta.env.VITE_APP_NAME;
```

## 🚢 Deployment

### Build para Producción
```bash
npm run build
```

Genera carpeta `dist/` lista para deploy.

### Deploy a Vercel
```bash
npm install -g vercel
vercel
```

### Deploy a GitHub Pages
```bash
npm run build
# Copiar contenido de dist/ a rama gh-pages
```

## 📞 Soporte

Para dudas o problemas:
1. Revisar documentación en `/doc`
2. Verificar ejemplos existentes en componentes
3. Consultar con frontend lead
4. Crear issue en repositorio

## 📚 Recursos Útiles

- [React Official](https://react.dev)
- [React Router Docs](https://reactrouter.com)
- [Tailwind CSS](https://tailwindcss.com)
- [Axios Documentation](https://axios-http.com)
- [Vite Documentation](https://vitejs.dev)
- [JavaScript ES6+](https://es6.io)
