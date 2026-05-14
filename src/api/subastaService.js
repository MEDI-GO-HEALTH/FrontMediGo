/**
 * subastaService.js — Gestión de Subastas
 * Backend principal: /api/auctions
 */

import client from './client';

const AUCTIONS_BASE = '/api/auctions';

export const getAuctionErrorMessage = (error, fallbackMessage = 'No se pudo completar la operacion en subastas.') => {
  const status = Number(error?.response?.status || 0)
  const data = error?.response?.data || {}
  const message = String(data?.message || data?.error || '').trim()

  if (!status) {
    return 'No se pudo conectar con el servicio de subastas. Intenta nuevamente.'
  }

  if (message.toLowerCase().includes('error interno del gateway')) {
    return 'El servicio de subastas no está disponible temporalmente. Intenta de nuevo en unos minutos.'
  }

  if (status === 401 || status === 403) {
    return 'No tienes permisos para realizar esta operación.'
  }

  if (status === 404) {
    return 'La subasta solicitada no fue encontrada.'
  }

  if (status === 409) {
    return message || 'No fue posible completar la operación por conflicto de estado en la subasta.'
  }

  if (status >= 500) {
    return 'El servicio de subastas no está disponible temporalmente. Intenta de nuevo en unos minutos.'
  }

  return message || fallbackMessage
}

/** GET /api/auctions — Listar subastas (Admin) */
export const getAllAuctions = async () => {
  const response = await client.get(`${AUCTIONS_BASE}/all`);
  return response.data;
};

/** GET /api/auctions/active — Subastas activas */
export const getActiveAuctions = async () => {
  const response = await client.get(`${AUCTIONS_BASE}/active`);
  return response.data;
};

/** GET /api/auctions/{id} — Detalle de subasta */
export const getAuctionById = async (id) => {
  const response = await client.get(`${AUCTIONS_BASE}/${id}`);
  return response.data;
};

/** POST /api/auctions — Crear subasta */
export const createAuction = async (data) => {
  const response = await client.post(AUCTIONS_BASE, data);
  return response.data;
};

/** PUT /api/auctions/{id} — Editar subasta */
export const updateAuction = async (id, data) => {
  const response = await client.put(`${AUCTIONS_BASE}/${id}`, data);
  return response.data;
};

/** POST /api/auctions/{id}/join — Unirse a subasta */
export const joinAuction = async (id, userId) => {
  const response = await client.post(`${AUCTIONS_BASE}/${id}/join`, null, {
    params: { userId },
  });
  return response.data;
};

/** GET /api/auctions/{id}/bids — Historial de pujas */
export const getAuctionBids = async (id) => {
  const response = await client.get(`${AUCTIONS_BASE}/${id}/bids`);
  return response.data;
};

/** POST /api/auctions/{id}/bids — Colocar puja */
export const placeAuctionBid = async (id, payload) => {
  const response = await client.post(`${AUCTIONS_BASE}/${id}/bids`, payload);
  return response.data;
};

/** GET /api/auctions/{id}/winner — Ganador de la subasta */
export const getAuctionWinner = async (id) => {
  const response = await client.get(`${AUCTIONS_BASE}/${id}/winner`);
  return response.data;
};

/** GET /api/auctions/won — Subastas ganadas por el afiliado autenticado */
export const getWonAuctions = async (params) => {
  const requestParams = params || { page: 0, size: 20 };
  const response = await client.get(`${AUCTIONS_BASE}/won`, { params: requestParams });
  return response.data;
};

// Alias de compatibilidad para el resto de pantallas existentes
// El backend actual no expone GET /api/auctions general; se usa active para evitar 404.
export const getSubastas = async () => getActiveAuctions();
export const getSubastasDisponibles = getActiveAuctions;
export const getSubasta = getAuctionById;
export const createSubasta = createAuction;
export const updateSubasta = updateAuction;
export const pujarSubasta = async (id, monto) => placeAuctionBid(id, { amount: monto });

// Endpoints legacy conservados por compatibilidad retroactiva
export const aceptarSubasta = async (id) => {
  const response = await client.post(`/subastas/${id}/aceptar`);
  return response.data;
};

export const cancelarSubasta = async (id) => {
  const response = await client.delete(`/subastas/${id}`);
  return response.data;
};
