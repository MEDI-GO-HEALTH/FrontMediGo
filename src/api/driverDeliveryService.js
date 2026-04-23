import client from './client'

const getUserId = () => {
  const userStr = localStorage.getItem('medigo_user');
  if (!userStr) return null;
  
  try {
    const user = JSON.parse(userStr);
    // Intentar obtener el ID de diferentes fuentes comunes en el proyecto
    const id = user.id || user.user_id || user.userId || user.sub;
    return id || null;
  } catch (e) {
    return null;
  }
};

export const driverDeliveryEndpoints = {
  mapSnapshot: '/api/logistics/deliveries/active',
  currentOrder: '/api/logistics/deliveries/active',
  acceptOrder: '/api/logistics/deliveries/assign',
  startShift: '/api/logistics/deliveries/active', // Mocked to active
  completeDelivery: (id) => `/api/logistics/deliveries/${id}/complete`,
}

export async function getDriverMapSnapshot() {
  const id = getUserId();
  if (!id) {
    console.warn('No se encontró ID de usuario para el mapa');
    return [];
  }
  const { data } = await client.get(`${driverDeliveryEndpoints.mapSnapshot}?deliveryPersonId=${id}`)
  return data
}

export async function getDriverCurrentOrder() {
  const id = getUserId();
  if (!id) {
    console.warn('No se encontró ID de usuario para la orden actual');
    return null;
  }
  const { data } = await client.get(`${driverDeliveryEndpoints.currentOrder}?deliveryPersonId=${id}`)
  return Array.isArray(data) ? data[0] : data
}

export async function acceptDriverOrder(payload) {
  const { data } = await client.post(driverDeliveryEndpoints.acceptOrder, payload)
  return data
}

export async function startDriverShift(payload = {}) {
  const id = getUserId();
  if (!id) {
    console.warn('No se encontró ID de usuario para iniciar turno');
    return [];
  }
  const { data } = await client.get(`${driverDeliveryEndpoints.startShift}?deliveryPersonId=${id}`)
  return data
}

/**
 * HU-10: El repartidor confirma la entrega de un pedido.
 * Llama a PUT /api/logistics/deliveries/{id}/complete
 * Cambia estado a DELIVERED y registra fecha/hora de entrega.
 *
 * @param {number} deliveryId  ID de la entrega a confirmar
 * @returns {Promise<{id, orderId, deliveryPersonId, status, assignedAt, deliveredAt}>}
 */
export async function finalizeDelivery(deliveryId) {
  const { data } = await client.put(driverDeliveryEndpoints.completeDelivery(deliveryId))
  return data
}
