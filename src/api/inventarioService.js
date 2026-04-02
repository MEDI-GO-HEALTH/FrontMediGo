/**
 * inventarioService.js — Gestión de Inventario
 * 📡 BACKEND endpoints: /inventario
 */

import client from './client';

/** GET /inventario — Listar todos los medicamentos */
export const getInventario = async (params = {}) => {
  const response = await client.get('/inventario', { params });
  return response.data;
};

/** GET /inventario/:id — Obtener un medicamento por ID */
export const getMedicamento = async (id) => {
  const response = await client.get(`/inventario/${id}`);
  return response.data;
};

/** POST /inventario — Crear nuevo medicamento */
export const createMedicamento = async (data) => {
  const response = await client.post('/inventario', data);
  return response.data;
};

/** PUT /inventario/:id — Actualizar medicamento */
export const updateMedicamento = async (id, data) => {
  const response = await client.put(`/inventario/${id}`, data);
  return response.data;
};

/** DELETE /inventario/:id — Eliminar medicamento */
export const deleteMedicamento = async (id) => {
  const response = await client.delete(`/inventario/${id}`);
  return response.data;
};

/** GET /inventario/stats — Estadísticas del inventario */
export const getInventarioStats = async () => {
  const response = await client.get('/inventario/stats');
  return response.data;
};
