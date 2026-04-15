/**
 * repartidorService.js — Servicios del Repartidor
 * 📡 BACKEND endpoints: /api/logistics, /api/auth
 */

import client from './client';

const getUserId = () => {
  try {
    const user = JSON.parse(localStorage.getItem('medigo_user') || '{}');
    return user.id || user.user_id || user.userId || user.sub || null;
  } catch (e) {
    return null;
  }
};

/** GET /api/auth/me — Perfil del repartidor autenticado */
export const getPerfil = async () => {
  const { data } = await client.get('/api/auth/me');
  return data;
};

/** PUT /api/auth/:id — Actualizar perfil del repartidor */
export const updatePerfil = async (data) => {
  const id = getUserId();
  const { data: response } = await client.put(`/api/auth/${id}`, data);
  return response;
};

/** GET /api/logistics/deliveries/active — Historial de viajes/entregas (Mocked) */
export const getHistorial = async (params = {}) => {
  const id = getUserId();
  const { data } = await client.get('/api/logistics/deliveries/active', { 
    params: { ...params, deliveryPersonId: id } 
  });
  return data;
};

/** GET /api/logistics/deliveries/active — Pedidos activos con coordenadas para el mapa */
export const getPedidosMapa = async () => {
  const id = getUserId();
  const { data } = await client.get(`/api/logistics/deliveries/active?deliveryPersonId=${id}`);
  return data;
};

/** PUT /api/logistics/deliveries/:id/complete — Actualizar estado de un pedido */
export const updateEstadoPedido = async (id, estado) => {
  if (estado === 'DELIVERED' || estado === 'ENTREGADO') {
    const { data } = await client.put(`/api/logistics/deliveries/${id}/complete`);
    return data;
  }
  // Para otros estados usamos la ubicación como mock de actividad
  const { data } = await client.put(`/api/logistics/deliveries/${id}/location`, { latitude: 0, longitude: 0 });
  return data;
};

/** GET /api/logistics/deliveries/active — Pedidos en tiempo real para Afiliado */
export const getPedidosMapaAfiliado = async () => {
  const id = getUserId();
  const { data } = await client.get(`/api/logistics/deliveries/active?deliveryPersonId=${id}`);
  return data;
};

/** GET /api/auth/me — Perfil del afiliado autenticado */
export const getPerfilAfiliado = async () => {
  const { data } = await client.get('/api/auth/me');
  return data;
};

/** PUT /api/auth/:id — Actualizar perfil del afiliado */
export const updatePerfilAfiliado = async (data) => {
  const id = getUserId();
  const { data: response } = await client.put(`/api/auth/${id}`, data);
  return response;
};
