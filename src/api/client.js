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
    // 🔑 TOKEN — El token se almacena en localStorage bajo la clave 'medigo_token'
    const token = localStorage.getItem('medigo_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default client;
