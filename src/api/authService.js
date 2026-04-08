/**
 * authService.js — Servicios de Autenticación
 * ─────────────────────────────────────────────────────────────
 * Endpoints relacionados con autenticación y sesión de usuario.
 * ─────────────────────────────────────────────────────────────
 */

import client from './client';
import { API_CONFIG, AUTH_ENDPOINTS } from '../config/api';

/**
 * Iniciar sesión
 * @param {{ email: string, password: string }} credentials
 */
export const login = async (credentials) => {
  const { email } = credentials;

  // 🧪 MOCK LOGIN para Desarrollo (Si se usa un correo específico)
  if (API_CONFIG.useAuthMock) {
    if (email.includes('admin@medigo.co')) {
      return { token: 'fake-jwt.1.ADMIN.0', user: { id: 1, name: 'Admin Demo', email, role: 'ADMIN' } };
    }
    if (email.includes('afiliado@medigo.co')) {
      return { token: 'fake-jwt.2.AFFILIATE.0', user: { id: 2, name: 'Afiliado Demo', email, role: 'AFILIADO' } };
    }
    if (email.includes('repartidor@medigo.co')) {
      return { token: 'fake-jwt.3.DELIVERY.0', user: { id: 3, name: 'Repartidor Demo', email, role: 'REPARTIDOR' } };
    }
  }

  try {
    const response = await client.post(AUTH_ENDPOINTS.login, credentials);
    const data = response.data.data // Extraer del envelope 'data' del Gateway
    
    // Normalizar para el frontend: data.jwtToken -> token, el resto -> user
    return {
      token: data.jwtToken,
      user: {
        id: data.id,
        username: data.username,
        email: data.email,
        role: data.role
      }
    };
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
  const response = await client.post(AUTH_ENDPOINTS.register, userData);
  return response.data;
};

/**
 * Cerrar sesión
 * 📡 BACKEND: POST /auth/logout
 */
export const logout = async () => {
  const response = await client.post(AUTH_ENDPOINTS.logout);
  return response.data;
};

export const getMe = async () => {
  // Obtener el ID del usuario desde localStorage como fallback si es necesario
  const storedUser = JSON.parse(localStorage.getItem('medigo_user') || '{}');
  const userId = storedUser.id || storedUser.user_id;

  // Ambos Gateway y Backend actuales requieren user_id como query param
  const response = await client.get(`${AUTH_ENDPOINTS.me}${userId ? `?user_id=${userId}` : ''}`);
  
  // Normalizar respuesta del Gateway (success/data envelope)
  const userData = response.data.data || response.data;
  return userData;
};
