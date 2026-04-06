/**
 * authService.js — Servicios de Autenticación
 * ─────────────────────────────────────────────────────────────
 * Endpoints relacionados con autenticación y sesión de usuario.
 * ─────────────────────────────────────────────────────────────
 */

import client from './client';
import { API_CONFIG, AUTH_ENDPOINTS } from '../config/api';

const PHONE_REGEX = /^\+\d{1,3}-\d{3}-\d{7}$/;

/**
 * @typedef {'AFFILIATE'|'DELIVERY'} RegisterRole
 */

/**
 * @typedef {Object} RegisterUserRequest
 * @property {string} name
 * @property {string} email
 * @property {string} password
 * @property {RegisterRole} role
 * @property {string=} phone
 */

/**
 * @typedef {Object} RegisterUserResponse
 * @property {number|null} id
 * @property {string} name
 * @property {string} email
 * @property {string|null} phone
 * @property {string} role
 * @property {string|null} createdAt
 * @property {string|null} updatedAt
 * @property {string} message
 */

const normalizeRole = (roleLike) => {
  if (Array.isArray(roleLike)) {
    for (const value of roleLike) {
      const normalizedValue = normalizeRole(value);
      if (normalizedValue) {
        return normalizedValue;
      }
    }
    return null;
  }

  if (roleLike && typeof roleLike === 'object') {
    return normalizeRole(roleLike.authority || roleLike.role || roleLike.name || '');
  }

  const normalized = String(roleLike || '').trim().toUpperCase();
  if (!normalized) return null;

  if (normalized.includes('ADMIN')) return 'ADMIN';
  if (normalized.includes('REPART') || normalized.includes('DELIVERY') || normalized.includes('DRIVER')) {
    return 'REPARTIDOR';
  }
  if (normalized.includes('AFILIADO') || normalized.includes('AFFILIATE')) return 'AFILIADO';

  return null;
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
  const rawRole =
    userSource?.role ??
    userSource?.rol ??
    userSource?.userRole ??
    userSource?.authority ??
    userSource?.authorities ??
    root?.role ??
    root?.rol ??
    root?.authority ??
    root?.authorities;

  const user = {
    id: userSource?.id ?? userSource?.user_id ?? null,
    name: userSource?.name || userSource?.username || 'Usuario',
    email: userSource?.email || fallbackEmail,
    role: normalizeRole(rawRole) || 'AFILIADO',
  };

  return { token, user, message: payload?.message || root?.message || '' };
};

const normalizeRegisterRoleForApi = (role) => {
  const normalized = String(role || '').trim().toUpperCase();
  if (normalized === 'AFFILIATE' || normalized === 'DELIVERY') {
    return normalized;
  }
  if (normalized.includes('AFILIADO') || normalized.includes('AFFILIATE')) {
    return 'AFFILIATE';
  }
  if (normalized.includes('REPART') || normalized.includes('DELIVERY') || normalized.includes('DRIVER')) {
    return 'DELIVERY';
  }
  return '';
};

const mapToLegacyRegisterRole = (role) => {
  if (role === 'AFFILIATE') return 'AFILIADO';
  if (role === 'DELIVERY') return 'REPARTIDOR';
  return role;
};

const shouldTryLegacyRoleFallback = (error) => {
  const message = String(
    error?.response?.data?.message ||
      error?.response?.data?.data?.message ||
      error?.response?.data?.error ||
      ''
  ).toUpperCase();

  // Si backend exige AFFILIATE/DELIVERY, no degradar a roles legacy.
  if (message.includes('AFFILIATE') || message.includes('DELIVERY')) {
    return false;
  }

  // Solo intentar legacy cuando el error sugiere etiquetas antiguas.
  return message.includes('AFILIADO') || message.includes('REPARTIDOR');
};

const normalizeRegisterPayload = (payload) => {
  const root = payload?.data ? payload.data : payload;
  const nested = root?.data || root || {};
  const normalizedRole = normalizeRole(nested?.role || root?.role) || 'AFILIADO';

  return {
    id: nested?.id ?? null,
    name: nested?.name || nested?.username || 'Usuario',
    email: nested?.email || '',
    phone: nested?.phone ?? null,
    role: normalizedRole,
    createdAt: nested?.createdAt || null,
    updatedAt: nested?.updatedAt || null,
    message: nested?.message || root?.message || 'Registro exitoso.',
  };
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
 * Register against API Gateway using role AFFILIATE/DELIVERY and optional phone.
 * @param {RegisterUserRequest} payload
 * @returns {Promise<{ token: string, user: { id: number|null, name: string, email: string, role: string }, register: RegisterUserResponse, message: string }>}
 */
export const registerUser = async (payload) => {
  const name = String(payload?.name || '').trim();
  const email = String(payload?.email || '').trim().toLowerCase();
  const password = String(payload?.password || '');
  const role = normalizeRegisterRoleForApi(payload?.role);
  const rawPhone = String(payload?.phone || '').trim();

  if (!name || !email || !password) {
    throw new Error('Nombre, correo y contraseña son obligatorios.');
  }

  if (!role) {
    throw new Error('Rol inválido. Usa AFFILIATE o DELIVERY.');
  }

  if (rawPhone && !PHONE_REGEX.test(rawPhone)) {
    throw new Error('El teléfono debe cumplir el formato +57-322-5555555.');
  }

  const buildRequestBody = (resolvedRole, includePhone = false) => {
    /** @type {RegisterUserRequest|{name:string,email:string,password:string,role:string,phone?:string}>} */
    const body = {
      name,
      email,
      password,
      role: resolvedRole,
    };

    if (includePhone && rawPhone) {
      body.phone = rawPhone;
    }

    return body;
  };

  const tryRegister = async (resolvedRole, includePhone = false) => {
    const response = await client.post(AUTH_ENDPOINTS.register, buildRequestBody(resolvedRole, includePhone));
    const registerResult = normalizeRegisterPayload(response.data);

    const root = response?.data?.data ? response.data.data : response.data;
    const token =
      root?.token ||
      root?.jwtToken ||
      root?.accessToken ||
      response?.data?.token ||
      response?.data?.jwtToken ||
      '';

    return {
      token,
      user: {
        id: registerResult.id,
        name: registerResult.name,
        email: registerResult.email,
        role: registerResult.role,
      },
      register: registerResult,
      message: registerResult.message,
    };
  };

  const legacyRole = mapToLegacyRegisterRole(role);
  const attempts = [
    // Prioridad 1: contrato actual del UI y gateway (AFFILIATE/DELIVERY).
    { resolvedRole: role, includePhone: false },
  ];

  // Fallback adicional para ambientes que sí aceptan phone.
  if (rawPhone) {
    attempts.push({ resolvedRole: role, includePhone: true });
  }

  let lastError = null;
  let canTryLegacy = false;
  for (const attempt of attempts) {
    // Evitar request duplicado cuando role legacy y role normal son iguales.
    if (!attempt.resolvedRole) {
      continue;
    }
    if (attempt.resolvedRole === role && attempt.includePhone === false && attempts.indexOf(attempt) > 0) {
      continue;
    }

    try {
      return await tryRegister(attempt.resolvedRole, attempt.includePhone);
    } catch (error) {
      lastError = error;
      if (error?.response?.status !== 400) {
        break;
      }

      canTryLegacy = shouldTryLegacyRoleFallback(error);
    }
  }

  // Intento legacy solo cuando el backend realmente lo está pidiendo.
  if (canTryLegacy && legacyRole && legacyRole !== role) {
    const legacyAttempts = [{ resolvedRole: legacyRole, includePhone: false }];
    if (rawPhone) {
      legacyAttempts.push({ resolvedRole: legacyRole, includePhone: true });
    }

    for (const attempt of legacyAttempts) {
      try {
        return await tryRegister(attempt.resolvedRole, attempt.includePhone);
      } catch (error) {
        lastError = error;
        if (error?.response?.status !== 400) {
          break;
        }
      }
    }
  }

  const backendMessage =
    lastError?.response?.data?.message ||
    lastError?.response?.data?.data?.message ||
    lastError?.response?.data?.error ||
    '';
  const traceId =
    lastError?.response?.headers?.['x-trace-id'] ||
    lastError?.response?.headers?.['X-Trace-Id'] ||
    '';

  if (backendMessage) {
    lastError.message = traceId
      ? `${backendMessage} (traceId: ${traceId})`
      : backendMessage;
  }

  throw lastError;
};

/**
 * Registrar usuario
 * @param {{ name, email, password, role: 'AFILIADO'|'REPARTIDOR', phone?, address? }} userData
 * @returns {{ token: string, user: object }}
 *
 * 📡 BACKEND: POST /auth/register
 */
export const register = async (userData) => {
  return registerUser(userData);
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
