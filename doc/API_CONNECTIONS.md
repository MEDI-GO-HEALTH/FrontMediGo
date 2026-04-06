# 🔌 Conexiones Frontend ↔ Backend — MediGo

> **Propósito:** Este documento centraliza todas las llamadas HTTP que el frontend hace al backend.
> Cada entrada incluye el archivo exacto, la función y el endpoint esperado.
> Cuando el backend cambie URLs, rutas o estructura de respuesta, **este archivo y el service correspondiente** son los únicos puntos a modificar.

---

## ⚙️ Configuración Base

| Archivo | Línea | Variable |
|---------|-------|----------|
| `src/api/client.js` | 17 | `VITE_API_BASE_URL` (env) |

**Para cambiar la URL base del backend:**
1. Editar `.env` en la raíz del proyecto:
   ```
   VITE_API_BASE_URL=http://localhost:8080/api
   ```
2. En producción: `VITE_API_BASE_URL=https://api.medigo.co/api/v1`

---

## 🔐 Autenticación — `src/api/authService.js`

| Función | Endpoint | Método | Archivo consumidor | Línea aprox. | Descripción |
|---------|----------|--------|-------------------|--------------|-------------|
| `login(credentials)` | `/auth/login` | `POST` | `src/pages/auth/Login.jsx` | ~57 | Login con email+password. Retorna `{ token, user: { id, name, email, role } }` |
| `register(userData)` | `/auth/register` | `POST` | `src/pages/auth/Register.jsx` | ~55 | Registro de Afiliado o Repartidor |
| `logout()` | `/auth/logout` | `POST` | `src/components/layout/Sidebar.jsx` | handleLogout | Cerrar sesión en el servidor |
| `getMe()` | `/auth/me` | `GET` | — | — | Validar token activo (por implementar en guard de rutas) |

### Estructura de respuesta esperada (`/auth/login`):
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Andrea Ospina",
    "email": "andrea@clinica.co",
    "role": "AFILIADO"
  }
}
```
> ⚠️ El campo `role` determina la redirección automática:
> - `"ADMIN"` → `/admin/inventario`
> - `"AFILIADO"` → `/afiliado/subastas`
> - `"REPARTIDOR"` → `/repartidor/mapa`

### Almacenamiento de sesión:
- Token JWT: `localStorage.setItem('medigo_token', data.token)` — `Login.jsx` línea ~61
- Usuario: `localStorage.setItem('medigo_user', JSON.stringify(data.user))` — `Login.jsx` línea ~62

---

## 📦 Inventario — `src/api/inventarioService.js`

| Función | Endpoint | Método | Archivo consumidor | Línea aprox. | Estado |
|---------|----------|--------|-------------------|--------------|--------|
| `getInventarioStats()` | `/inventario/stats` | `GET` | `src/pages/admin/Inventario.jsx` | ~47 (comentada) | ⏳ Pendiente backend |
| `getInventario(params)` | `/inventario` | `GET` | `src/pages/admin/Inventario.jsx` | ~47 (comentada) | ⏳ Pendiente backend |
| `createMedicamento(data)` | `/inventario` | `POST` | `src/pages/admin/Inventario.jsx` | Botón "Nuevo" | ⏳ Modal por implementar |
| `updateMedicamento(id, data)` | `/inventario/:id` | `PUT` | `src/pages/admin/Inventario.jsx` | Botón "Editar" | ⏳ Modal por implementar |
| `deleteMedicamento(id)` | `/inventario/:id` | `DELETE` | `src/pages/admin/Inventario.jsx` | ~62 (comentada) | ⏳ Descomentar |

### Cómo activar la llamada real en `Inventario.jsx`:
```jsx
// Descomentar el useEffect (línea ~47) y comentar los MOCK_*
useEffect(() => {
  setLoading(true)
  Promise.all([getInventarioStats(), getInventario()])
    .then(([statsData, itemsData]) => { setStats(statsData); setItems(itemsData) })
    .finally(() => setLoading(false))
}, [])
```

---

## 🏛️ Subastas — `src/api/subastaService.js`

| Función | Endpoint | Método | Archivo consumidor | Línea aprox. | Estado |
|---------|----------|--------|-------------------|--------------|--------|
| `getSubastas()` | `/subastas` | `GET` | `src/pages/afiliado/CentroSubastas.jsx` | ~35 (comentada) | ⏳ |
| `getSubastasDisponibles()` | `/subastas/disponibles` | `GET` | `src/pages/repartidor/GestionSubastas.jsx` | ~35 (comentada) | ⏳ |
| `aceptarSubasta(id)` | `/subastas/:id/aceptar` | `POST` | `src/pages/afiliado/CentroSubastas.jsx` | ~58 | ⏳ Descomentar |
| `cancelarSubasta(id)` | `/subastas/:id` | `DELETE` | `src/pages/afiliado/CentroSubastas.jsx` | ~68 | ⏳ Descomentar |
| `pujarSubasta(id, monto)` | `/subastas/:id/pujar` | `POST` | `src/pages/repartidor/GestionSubastas.jsx` | ~50 | ⏳ Descomentar |
| `createSubasta(data)` | `/subastas` | `POST` | `src/pages/afiliado/CentroSubastas.jsx` | Botón "Nueva" | ⏳ Modal |
| `updateSubasta(id, data)` | `/subastas/:id` | `PUT` | — | — | ⏳ |

---

## 🏢 Sedes — `src/api/sedesService.js`

| Función | Endpoint | Método | Archivo consumidor | Línea aprox. | Estado |
|---------|----------|--------|-------------------|--------------|--------|
| `getSedes()` | `/sedes` | `GET` | `src/pages/admin/GestionSedes.jsx` | ~33 (comentada) | ⏳ |
| `getSedes()` | `/sedes` | `GET` | `src/pages/admin/GestionSedesUsuarios.jsx` | ~44 (comentada) | ⏳ |
| `getSedeUsuarios(id)` | `/sedes/:id/usuarios` | `GET` | `src/pages/admin/GestionSedesUsuarios.jsx` | ~46 (comentada) | ⏳ |
| `createSede(data)` | `/sedes` | `POST` | `src/pages/admin/GestionSedes.jsx` | Botón "Nueva Sede" | ⏳ Modal |
| `updateSede(id, data)` | `/sedes/:id` | `PUT` | `src/pages/admin/GestionSedes.jsx` | Botón Edit | ⏳ |
| `deleteSede(id)` | `/sedes/:id` | `DELETE` | `src/pages/admin/GestionSedes.jsx` | ~39 (comentada) | ⏳ Descomentar |

---

## 👥 Usuarios — `src/api/usuariosService.js`

| Función | Endpoint | Método | Archivo consumidor | Línea aprox. | Estado |
|---------|----------|--------|-------------------|--------------|--------|
| `getUsuarios()` | `/usuarios` | `GET` | `src/pages/admin/GestionUsuarios.jsx` | ~35 (comentada) | ⏳ |
| `toggleEstadoUsuario(id, activo)` | `/usuarios/:id/estado` | `PUT` | `src/pages/admin/GestionUsuarios.jsx` | ~48 | ⏳ Descomentar |
| `cambiarRolUsuario(id, rol)` | `/usuarios/:id/rol` | `PUT` | — | — | ⏳ Por conectar a UI |
| `deleteUsuario(id)` | `/usuarios/:id` | `DELETE` | `src/pages/admin/GestionUsuarios.jsx` | ~57 | ⏳ Descomentar |

---

## 🛵 Repartidor / Afiliado — `src/api/repartidorService.js`

| Función | Endpoint | Método | Archivo consumidor | Línea aprox. | Estado |
|---------|----------|--------|-------------------|--------------|--------|
| `getPedidosMapaAfiliado()` | `/afiliado/mapa` | `GET` | `src/pages/afiliado/MapaPedidos.jsx` | ~40 (comentada) | ⏳ + Polling |
| `getPerfilAfiliado()` | `/afiliado/perfil` | `GET` | `src/pages/afiliado/PerfilAfiliado.jsx` | ~27 (comentada) | ⏳ |
| `updatePerfilAfiliado(data)` | `/afiliado/perfil` | `PUT` | `src/pages/afiliado/PerfilAfiliado.jsx` | ~34 | ⏳ Descomentar |
| `getPedidosMapa()` | `/repartidor/mapa` | `GET` | `src/pages/repartidor/MapaEntregas.jsx` | ~34 (comentada) | ⏳ |
| `updateEstadoPedido(id, estado)` | `/pedidos/:id/estado` | `PUT` | `src/pages/repartidor/MapaEntregas.jsx` | ~52 | ⏳ Descomentar |
| `getHistorial(params)` | `/repartidor/historial` | `GET` | `src/pages/repartidor/HistorialViajes.jsx` | ~28 (comentada) | ⏳ |
| `getPerfil()` | `/repartidor/perfil` | `GET` | `src/pages/repartidor/PerfilRepartidor.jsx` | ~22 (comentada) | ⏳ |
| `updatePerfil(data)` | `/repartidor/perfil` | `PUT` | `src/pages/repartidor/PerfilRepartidor.jsx` | ~30 | ⏳ Descomentar |

---

## 🔒 Token JWT — Flujo completo

```
Login.jsx → authService.login() → POST /auth/login
    ↓
localStorage: 'medigo_token' + 'medigo_user'
    ↓
client.js interceptor → agrega header: Authorization: Bearer <token>
    ↓
Todas las llamadas autenticadas van con el token automáticamente
    ↓
Si el servidor responde 401 → client.js interceptor → clearStorage + redirect /login
```

---

## 📋 Leyenda de Estado

| Símbolo | Significado |
|---------|-------------|
| ✅ | Implementado y conectado |
| ⏳ | Código preparado, esperando backend |
| 💬 | Comentado en el código — descomentar para activar |
| 🚫 | No implementado aún en el frontend |

---

## 🛠️ Cómo adaptar al backend cuando cambie

1. **Cambio de URL base:** Editar `.env` → `VITE_API_BASE_URL`
2. **Cambio de endpoint:** Editar la función en `src/api/[service].js`
3. **Cambio de estructura de respuesta:** Editar la función del service y actualizar los estados en el componente
4. **Nuevo endpoint:** Agregar función al service correspondiente y documentar en esta tabla

> 💡 **Convención:** Todas las llamadas al backend están en `src/api/`. Los componentes **nunca** llaman a `axios` directamente — siempre usan los services. Esto garantiza un único punto de cambio.
