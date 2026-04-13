/**
 * subastaService.js — Gestión de Subastas
 * Backend principal: /api/auctions
 */

import client from './client';
import axios from 'axios';

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

/** GET /api/auctions — Listar subastas */
export const getAuctions = async (params = {}) => {
  return retryRequest(() => client.get(AUCTIONS_BASE, { params }));
};

/** GET /api/auctions/active — Subastas activas */
export const getActiveAuctions = async () => {
  return retryRequest(() => client.get(`${AUCTIONS_BASE}/active`));
};

/** GET /api/auctions/{id} — Detalle de subasta */
export const getAuctionById = async (id) => {
  return retryRequest(() => client.get(`${AUCTIONS_BASE}/${id}`));
};

/** POST /api/auctions — Crear subasta */
export const createAuction = async (data) => {
  return retryRequest(() => client.post(AUCTIONS_BASE, data));
};

/** PUT /api/auctions/{id} — Editar subasta */
export const updateAuction = async (id, data) => {
  return retryRequest(() => client.put(`${AUCTIONS_BASE}/${id}`, data));
};

/** POST /api/auctions/{id}/join — Unirse a subasta */
export const joinAuction = async (id, userId) => {
  return retryRequest(() => client.post(`${AUCTIONS_BASE}/${id}/join`, null, { params: { userId } }));
};

/** GET /api/auctions/{id}/bids — Historial de pujas */
export const getAuctionBids = async (id) => {
  return retryRequest(() => client.get(`${AUCTIONS_BASE}/${id}/bids`));
};

/** POST /api/auctions/{id}/bids — Colocar puja */
export const placeAuctionBid = async (id, payload) => {
  return retryRequest(() => client.post(`${AUCTIONS_BASE}/${id}/bids`, payload));
};

/** GET /api/auctions/{id}/winner — Ganador de la subasta */
export const getAuctionWinner = async (id) => {
  return retryRequest(() => client.get(`${AUCTIONS_BASE}/${id}/winner`));
};

/** GET /api/auctions/won — Subastas ganadas por el afiliado autenticado */
export const getWonAuctions = async (params) => {
  const requestParams = params || { page: 0, size: 20 };
  return retryRequest(() => client.get(`${AUCTIONS_BASE}/won`, { params: requestParams }));
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

async function retryRequest(requestFn, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await requestFn();
      return response.data;
    } catch (error) {
      if (i < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
}
