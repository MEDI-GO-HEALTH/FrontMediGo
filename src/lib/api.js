import axios from 'axios';
import { getToken } from './auth';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081';

const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/**
 * Normalizes gateway error envelope: { success, message, data, traceId }
 * into error.displayMessage for UI consumption.
 */
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const data = error.response?.data;
    error.displayMessage = data?.message || error.message || 'Error desconocido';
    error.statusCode = error.response?.status;
    return Promise.reject(error);
  }
);

export default api;
