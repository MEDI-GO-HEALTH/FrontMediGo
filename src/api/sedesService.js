import client from './client';

/** 
 * Lista todas las farmacias/sedes reales de la base de datos.
 */
export const getSedes = async () => {
  const response = await client.get('/api/medications/branches');
  return response.data;
};

/**
 * Obtiene los medicamentos reales de una sede específica.
 */
export const getSedeMedications = async (id) => {
  const response = await client.get(`/api/medications/branch/${id}/medications`);
  return response.data;
};

/** GET /api/medications/branch/:id — Detalle de una sede */
export const getSede = async (id) => {
  const response = await client.get(`/api/medications/branch/${id}`);
  return response.data;
};

/** POST /api/medications/branch — Crear nueva sede (Ruta estimada para ADMIN) */
export const createSede = async (data) => {
  const response = await client.post('/api/medications/branch', data);
  return response.data;
};

/** PUT /api/medications/branch/:id — Actualizar sede */
export const updateSede = async (id, data) => {
  const response = await client.put(`/api/medications/branch/${id}`, data);
  return response.data;
};

/** DELETE /api/medications/branch/:id — Eliminar sede */
export const deleteSede = async (id) => {
  const response = await client.delete(`/api/medications/branch/${id}`);
  return response.data;
};
