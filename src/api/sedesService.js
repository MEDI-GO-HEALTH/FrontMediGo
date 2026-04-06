/**
 * sedesService.js — Gestión de Sedes / Farmacias
 * 📡 BACKEND endpoints: /sedes
 */

import client from './client';

/** GET /sedes — Listar todas las sedes */
export const getSedes = async (params = {}) => {
  const response = await client.get('/sedes', { params });
  return response.data;
};

/** GET /sedes/:id — Detalle de una sede */
export const getSede = async (id) => {
  const response = await client.get(`/sedes/${id}`);
  return response.data;
};

/** GET /sedes/:id/usuarios — Usuarios de una sede */
export const getSedeUsuarios = async (id) => {
  const response = await client.get(`/sedes/${id}/usuarios`);
  return response.data;
};

/** POST /sedes — Crear nueva sede */
export const createSede = async (data) => {
  const response = await client.post('/sedes', data);
  return response.data;
};

/** PUT /sedes/:id — Actualizar sede */
export const updateSede = async (id, data) => {
  const response = await client.put(`/sedes/${id}`, data);
  return response.data;
};

/** DELETE /sedes/:id — Eliminar sede */
export const deleteSede = async (id) => {
  const response = await client.delete(`/sedes/${id}`);
  return response.data;
};
