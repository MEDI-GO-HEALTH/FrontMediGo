/**
 * usuariosService.js — Gestión de Usuarios
 * 📡 BACKEND endpoints: /api/usuarios
 */

import client from './client';

/** GET /api/usuarios — Listar todos los usuarios */
export const getUsuarios = async (params = {}) => {
  const queryValues = Object.values(params).filter(v => typeof v === 'string');
  const sqlInjectionPattern = /[-'";|\/\*]/;

  for (const val of queryValues) {
    if (sqlInjectionPattern.test(val)) {
      console.warn('⚠️ Intento de SQL Injection detectado en el cliente (Usuarios):', val);
      throw new Error('Caracteres no permitidos en la búsqueda por motivos de seguridad.');
    }
  }

  const response = await client.get('/api/usuarios', { params });
  return response.data;
};

/** GET /api/usuarios/:id — Detalle de un usuario */
export const getUsuario = async (id) => {
  const response = await client.get(`/api/usuarios/${id}`);
  return response.data;
};

/** PUT /api/usuarios/:id — Actualizar usuario */
export const updateUsuario = async (id, data) => {
  const response = await client.put(`/api/usuarios/${id}`, data);
  return response.data;
};

/** PUT /api/usuarios/:id/rol — Cambiar rol de usuario */
export const cambiarRolUsuario = async (id, rol) => {
  const response = await client.put(`/api/usuarios/${id}/rol`, { rol });
  return response.data;
};

/** DELETE /api/usuarios/:id — Eliminar usuario */
export const deleteUsuario = async (id) => {
  const response = await client.delete(`/api/usuarios/${id}`);
  return response.data;
};

/** PUT /api/usuarios/:id/estado — Activar/Desactivar usuario */
export const toggleEstadoUsuario = async (id, activo) => {
  const response = await client.put(`/api/usuarios/${id}/estado`, { activo });
  return response.data;
};
