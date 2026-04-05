/**
 * authService.js — Servicios de Autenticación
 * ─────────────────────────────────────────────────────────────
 * Endpoints relacionados con autenticación y sesión de usuario.
 * ─────────────────────────────────────────────────────────────
 */

import client from './client';

/**
 * Iniciar sesión
 * @param {{ email: string, password: string }} credentials
 */
export const login = async (credentials) => {
  const { email } = credentials;

  // 🧪 MOCK LOGIN para Desarrollo (Si se usa un correo específico)
  if (email.includes('admin@medigo.co')) {
    return { token: 'mock-token-admin', user: { id: 1, name: 'Admin Demo', email, role: 'ADMIN' } };
  }
  if (email.includes('afiliado@medigo.co')) {
    return { token: 'mock-token-afiliado', user: { id: 2, name: 'Afiliado Demo', email, role: 'AFILIADO' } };
  }
  if (email.includes('repartidor@medigo.co')) {
    return { token: 'mock-token-repartidor', user: { id: 3, name: 'Repartidor Demo', email, role: 'REPARTIDOR' } };
  }

  try {
    const response = await client.post('/auth/login', credentials);
    return response.data;
  } catch (error) {
    // Si falla la conexión (backend apagado), pero es una de nuestras cuentas de prueba rápidas
    console.error('Auth Error:', error);
    throw error;
  }
};

/**
 * Registrar usuario
 * @param {{ name, email, password, role: 'AFILIADO'|'REPARTIDOR', phone?, address? }} userData
 * @returns {{ token: string, user: object }}
 *
 * 📡 BACKEND: POST /auth/register
 */
export const register = async (userData) => {
  const response = await client.post('/auth/register', userData);
  return response.data;
};

/**
 * Cerrar sesión
 * 📡 BACKEND: POST /auth/logout
 */
export const logout = async () => {
  const response = await client.post('/auth/logout');
  return response.data;
};

/**
 * Obtener usuario actual (validar sesión activa)
 * 📡 BACKEND: GET /auth/me
 */
export const getMe = async () => {
  const response = await client.get('/auth/me');
  return response.data;
};
