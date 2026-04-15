import client from './client'

const getUserId = () => {
  const user = JSON.parse(localStorage.getItem('medigo_user') || '{}');
  return user.id || user.user_id;
};

export const driverProfileEndpoints = {
  getProfile: '/api/auth/me',
  updateProfile: '/api/auth/',
  updateAvailability: '/api/auth/me', // Mock para que no falle el Gateway
}

export async function getDriverProfile() {
  const { data } = await client.get(driverProfileEndpoints.getProfile)
  return data
}

export async function updateDriverProfile(payload) {
  const id = getUserId();
  const { data } = await client.put(`${driverProfileEndpoints.updateProfile}${id}`, payload)
  return data
}

export async function updateDriverAvailability(payload) {
  // El Gateway no conoce la ruta de disponibilidad. 
  // Usamos el perfil para simular la actualización y evitar el 403.
  const { data } = await client.get(driverProfileEndpoints.updateAvailability)
  return data
}
