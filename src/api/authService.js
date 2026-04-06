/**
 * authService.js — Servicios de Autenticación
 * ─────────────────────────────────────────────────────────────
 * Endpoints relacionados con autenticación y sesión de usuario.
 * ─────────────────────────────────────────────────────────────
 */

import client from './client';
import { API_CONFIG, AUTH_ENDPOINTS } from '../config/api';

const normalizeRole = (role = '') => {
  const normalized = String(role).toUpperCase();
  if (normalized.includes('ADMIN')) return 'ADMIN';
  if (normalized.includes('REPART')) return 'REPARTIDOR';
  if (normalized.includes('DELIVERY')) return 'REPARTIDOR';
  return 'AFILIADO';
};

const normalizeLoginPayload = (payload, fallbackEmail = '') => {
  const root = payload?.data ? payload.data : payload;
  const nested = root?.data || {};

  const token =
    nested?.jwtToken ||
    nested?.token ||
    root?.jwtToken ||
    root?.token ||
    root?.accessToken ||
    '';

  const userSource = nested?.user || root?.user || nested || root || {};

  const user = {
    id: userSource?.id ?? userSource?.user_id ?? null,
    name: userSource?.name || userSource?.username || 'Usuario',
    email: userSource?.email || fallbackEmail,
    role: normalizeRole(userSource?.role),
  };

  return { token, user, message: payload?.message || root?.message || '' };
};

/**
 * Iniciar sesión
 * @param {{ email: string, password: string }} credentials
 */
export const login = async (credentials) => {
  const { email } = credentials;

  // 🧪 MOCK LOGIN para Desarrollo (Si se usa un correo específico)
  if (API_CONFIG.useAuthMock) {
    if (email.includes('admin@medigo.co')) {
      return { token: 'mock-token-admin', user: { id: 1, name: 'Admin Demo', email, role: 'ADMIN' } };
    }
    if (email.includes('afiliado@medigo.co')) {
      return { token: 'mock-token-afiliado', user: { id: 2, name: 'Afiliado Demo', email, role: 'AFILIADO' } };
    }
    if (email.includes('repartidor@medigo.co')) {
      return { token: 'mock-token-repartidor', user: { id: 3, name: 'Repartidor Demo', email, role: 'REPARTIDOR' } };
    }
  }

  try {
    const response = await client.post(AUTH_ENDPOINTS.login, credentials);
    const normalized = normalizeLoginPayload(response.data, email);

    if (!normalized.token) {
      throw new Error('El backend no devolvio un JWT valido para el login.');
    }

    return normalized;
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

/**
 * Obtener usuario actual (validar sesión activa)
 * 📡 BACKEND: GET /auth/me
 */
export const getMe = async () => {
  const response = await client.get(AUTH_ENDPOINTS.me);
  return response.data;
};
