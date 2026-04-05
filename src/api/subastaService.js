/**
 * subastaService.js — Gestión de Subastas
 * 📡 BACKEND endpoints: /subastas
 */

import client from './client';

/** GET /subastas — Listar todas las subastas */
export const getSubastas = async (params = {}) => {
  const response = await client.get('/subastas', { params });
  return response.data;
};

/** GET /subastas/disponibles — Subastas disponibles para repartidor */
export const getSubastasDisponibles = async () => {
  const response = await client.get('/subastas/disponibles');
  return response.data;
};

/** GET /subastas/:id — Detalle de una subasta */
export const getSubasta = async (id) => {
  const response = await client.get(`/subastas/${id}`);
  return response.data;
};

/** POST /subastas — Crear nueva subasta (Admin) */
export const createSubasta = async (data) => {
  const response = await client.post('/subastas', data);
  return response.data;
};

/** PUT /subastas/:id — Actualizar subasta (Admin) */
export const updateSubasta = async (id, data) => {
  const response = await client.put(`/subastas/${id}`, data);
  return response.data;
};

/** POST /subastas/:id/pujar — El repartidor hace una puja */
export const pujarSubasta = async (id, monto) => {
  const response = await client.post(`/subastas/${id}/pujar`, { monto });
  return response.data;
};

/** POST /subastas/:id/aceptar — El afiliado acepta oferta ganadora */
export const aceptarSubasta = async (id) => {
  const response = await client.post(`/subastas/${id}/aceptar`);
  return response.data;
};

/** DELETE /subastas/:id — Cancelar subasta */
export const cancelarSubasta = async (id) => {
  const response = await client.delete(`/subastas/${id}`);
  return response.data;
};
