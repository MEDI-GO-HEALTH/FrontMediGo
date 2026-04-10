/**
 * subastaService.js — Gestión de Subastas
 * Backend principal: /api/auctions
 */

import client from './client';

const AUCTIONS_BASE = '/api/auctions';

/** GET /api/auctions — Listar subastas */
export const getAuctions = async (params = {}) => {
  const response = await client.get(AUCTIONS_BASE, { params });
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
