/**
 * usuariosService.js — Gestión de Usuarios
 * 📡 BACKEND endpoints: /usuarios
 */

import client from './client';

/** GET /usuarios — Listar todos los usuarios */
export const getUsuarios = async (params = {}) => {
  const response = await client.get('/usuarios', { params });
  return response.data;
};

/** GET /usuarios/:id — Detalle de un usuario */
export const getUsuario = async (id) => {
  const response = await client.get(`/usuarios/${id}`);
  return response.data;
};

/** PUT /usuarios/:id — Actualizar usuario */
export const updateUsuario = async (id, data) => {
  const response = await client.put(`/usuarios/${id}`, data);
  return response.data;
};

/** PUT /usuarios/:id/rol — Cambiar rol de usuario */
export const cambiarRolUsuario = async (id, rol) => {
  const response = await client.put(`/usuarios/${id}/rol`, { rol });
  return response.data;
};

/** DELETE /usuarios/:id — Eliminar usuario */
export const deleteUsuario = async (id) => {
  const response = await client.delete(`/usuarios/${id}`);
  return response.data;
};

/** PUT /usuarios/:id/estado — Activar/Desactivar usuario */
export const toggleEstadoUsuario = async (id, activo) => {
  const response = await client.put(`/usuarios/${id}/estado`, { activo });
  return response.data;
};
