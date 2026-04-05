/**
 * repartidorService.js — Servicios del Repartidor
 * 📡 BACKEND endpoints: /repartidor, /pedidos, /viajes
 */

import client from './client';

/** GET /repartidor/perfil — Perfil del repartidor autenticado */
export const getPerfil = async () => {
  const response = await client.get('/repartidor/perfil');
  return response.data;
};

/** PUT /repartidor/perfil — Actualizar perfil del repartidor */
export const updatePerfil = async (data) => {
  const response = await client.put('/repartidor/perfil', data);
  return response.data;
};

/** GET /repartidor/historial — Historial de viajes/entregas */
export const getHistorial = async (params = {}) => {
  const response = await client.get('/repartidor/historial', { params });
  return response.data;
};

/** GET /repartidor/mapa — Pedidos activos con coordenadas para el mapa */
export const getPedidosMapa = async () => {
  const response = await client.get('/repartidor/mapa');
  return response.data;
};

/** PUT /pedidos/:id/estado — Actualizar estado de un pedido */
export const updateEstadoPedido = async (id, estado) => {
  const response = await client.put(`/pedidos/${id}/estado`, { estado });
  return response.data;
};

/** GET /afiliado/mapa — Pedidos en tiempo real para Afiliado */
export const getPedidosMapaAfiliado = async () => {
  const response = await client.get('/afiliado/mapa');
  return response.data;
};

/** GET /afiliado/perfil — Perfil del afiliado autenticado */
export const getPerfilAfiliado = async () => {
  const response = await client.get('/afiliado/perfil');
  return response.data;
};

/** PUT /afiliado/perfil — Actualizar perfil del afiliado */
export const updatePerfilAfiliado = async (data) => {
  const response = await client.put('/afiliado/perfil', data);
  return response.data;
};
