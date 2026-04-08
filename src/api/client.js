/**
 * API Client — MediGo
 * ─────────────────────────────────────────────────────────────
 * Instancia base de Axios configurada con:
 *  - Base URL desde variable de entorno VITE_API_BASE_URL
 *  - Interceptor de Request: adjunta token JWT automáticamente
 *  - Interceptor de Response: redirige al login si token expira
 *
 * Para adaptarlo al backend: cambiar VITE_API_BASE_URL en .env
 * Ejemplo: VITE_API_BASE_URL=https://api.medigo.co/api/v1
 * ─────────────────────────────────────────────────────────────
 */

import axios from 'axios';
import { API_CONFIG } from '../config/api';

const PROD_API_BASE_URL = 'https://ezequiel-gateway-etcrh9dxg9dwhng4.canadacentral-01.azurewebsites.net';

const isLocalhostUrl = (value = '') => /^(https?:\/\/)?(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/i.test(value);

const createTraceId = () => {
  if (globalThis?.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `trace-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const isRunningOnLocalhost = () => {
  const host = globalThis?.location?.hostname || '';
  return host === 'localhost' || host === '127.0.0.1';
};

const client = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeoutMs,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// ── Interceptor de REQUEST: Adjunta token de autenticación ──
client.interceptors.request.use(
  (config) => {
    const configuredBaseUrl = String(config.baseURL || client.defaults.baseURL || '');

    // Failsafe: en despliegues (Vercel/produccion) nunca usar localhost como API.
    if (!isRunningOnLocalhost() && isLocalhostUrl(configuredBaseUrl)) {
      config.baseURL = PROD_API_BASE_URL;
      client.defaults.baseURL = PROD_API_BASE_URL;
    }

    // 🔑 TOKEN — El token se almacena en localStorage bajo la clave 'medigo_token'
    const token = localStorage.getItem('medigo_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (API_CONFIG.enableTraceIdHeader && !config.headers['X-Trace-Id']) {
      config.headers['X-Trace-Id'] = createTraceId();
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ── Interceptor de RESPONSE: Maneja errores de autenticación ──
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 🚪 Token expirado o inválido → limpiar sesión y redirigir
      localStorage.removeItem('medigo_token');
      localStorage.removeItem('medigo_user');
      globalThis.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default client;
