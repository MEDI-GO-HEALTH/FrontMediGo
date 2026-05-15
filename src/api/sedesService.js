/**
 * sedesService.js — Gestión de Sedes / Farmacias
 * 📡 BACKEND endpoint base: /api/sedes
 */

import client from './client';

const SEDES_ENDPOINT = '/api/sedes';

const normalizeEnvelope = (responseData) => {
  if (!responseData || typeof responseData !== 'object') {
    return {
      success: true,
      message: '',
      data: responseData,
      traceId: '',
      apiVersion: '',
      timestamp: '',
    };
  }

  if (Object.prototype.hasOwnProperty.call(responseData, 'success')) {
    return {
      success: Boolean(responseData.success),
      message: String(responseData.message || ''),
      data: Object.prototype.hasOwnProperty.call(responseData, 'data') ? responseData.data : null,
      traceId: String(responseData.traceId || ''),
      apiVersion: String(responseData.apiVersion || ''),
      timestamp: String(responseData.timestamp || ''),
    };
  }

  return {
    success: true,
    message: '',
    data: responseData,
    traceId: '',
    apiVersion: '',
    timestamp: '',
  };
};

const normalizeApiError = (error, fallbackMessage) => {
  const status = error?.response?.status || 0;
  const envelope = normalizeEnvelope(error?.response?.data);
  const message = envelope.message || fallbackMessage;

  const normalized = new Error(message);
  normalized.status = status;
  normalized.traceId = envelope.traceId || '';
  normalized.apiVersion = envelope.apiVersion || '';
  normalized.timestamp = envelope.timestamp || '';
  normalized.payload = envelope.data;

  throw normalized;
};

const pickAllowedFields = (source = {}) => {
  const aliases = {
    lat: 'latitude',
    lng: 'longitude',
  };

  const normalizedSource = { ...source };
  Object.entries(aliases).forEach(([from, to]) => {
    if (normalizedSource[to] === undefined && normalizedSource[from] !== undefined) {
      normalizedSource[to] = normalizedSource[from];
    }
  });

  const allowed = ['nombre', 'direccion', 'especialidad', 'telefono', 'capacidad', 'latitude', 'longitude'];

  return allowed.reduce((accumulator, key) => {
    if (Object.prototype.hasOwnProperty.call(normalizedSource, key) && normalizedSource[key] !== undefined) {
      accumulator[key] = normalizedSource[key];
    }
    return accumulator;
  }, {});
};

/** GET /api/sedes — Listar sedes */
export const getSedes = async (params = {}) => {
  const sanitized = String(params?.q || '').trim();

  // 🛡️ Client-side Security Check for Demo
  const sqlInjectionPattern = /['";|\/\*-]/;
  if (sanitized && sqlInjectionPattern.test(sanitized)) {
    console.warn('⚠️ Intento de SQL Injection detectado en el cliente (Sedes):', sanitized);
    throw new Error('Caracteres no permitidos en la búsqueda por motivos de seguridad.');
  }

  try {
    const response = await client.get(SEDES_ENDPOINT, {
      params: {
        page: 1,
        limit: 20,
        q: sanitized,
        ...params,
      },
    });
    return normalizeEnvelope(response.data);
  } catch (error) {
    normalizeApiError(error, 'No se pudo consultar el listado de sedes.');
  }
};

/** GET /api/sedes/:id — Detalle de una sede */
export const getSede = async (id) => {
  try {
    const response = await client.get(`${SEDES_ENDPOINT}/${id}`);
    return normalizeEnvelope(response.data);
  } catch (error) {
    normalizeApiError(error, 'No se pudo consultar la sede solicitada.');
  }
};

/** GET /api/sedes/:id/usuarios — Usuarios de una sede */
export const getSedeUsuarios = async (id) => {
  try {
    const response = await client.get(`${SEDES_ENDPOINT}/${id}/usuarios`);
    return normalizeEnvelope(response.data);
  } catch (error) {
    normalizeApiError(error, 'No se pudo consultar los usuarios de la sede.');
  }
};

/** POST /api/sedes — Crear sede */
export const createSede = async (data) => {
  try {
    const payload = pickAllowedFields(data);
    const response = await client.post(SEDES_ENDPOINT, payload);
    return normalizeEnvelope(response.data);
  } catch (error) {
    normalizeApiError(error, 'No se pudo crear la sede.');
  }
};

/** PUT /api/sedes/:id — Actualización parcial permitida por contrato */
export const updateSede = async (id, data) => {
  try {
    const payload = pickAllowedFields(data);
    const response = await client.put(`${SEDES_ENDPOINT}/${id}`, payload);
    return normalizeEnvelope(response.data);
  } catch (error) {
    normalizeApiError(error, 'No se pudo actualizar la sede.');
  }
};

/** DELETE /api/sedes/:id — Eliminación lógica */
export const deleteSede = async (id) => {
  try {
    const response = await client.delete(`${SEDES_ENDPOINT}/${id}`);
    return normalizeEnvelope(response.data);
  } catch (error) {
    normalizeApiError(error, 'No se pudo eliminar la sede.');
  }
};
