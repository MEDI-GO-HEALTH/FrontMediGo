const trimTrailingSlash = (value = '') => value.replace(/\/$/, '')

<<<<<<< Updated upstream
=======
const DEFAULT_PROD_API_BASE_URL = 'https://ezequiel-gateway-etcrh9dxg9dwhng4.canadacentral-01.azurewebsites.net'
const DEFAULT_DEV_API_BASE_URL = 'http://localhost:8081'
const DEFAULT_API_BASE_URL = import.meta.env.DEV ? DEFAULT_DEV_API_BASE_URL : DEFAULT_PROD_API_BASE_URL

const isLocalhostUrl = (value = '') => /^(https?:\/\/)?(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/i.test(value)

const resolveApiBaseUrl = () => {
  const envBaseUrl = trimTrailingSlash(import.meta.env.VITE_API_BASE_URL || '')

  if (envBaseUrl && !(isLocalhostUrl(envBaseUrl) && !import.meta.env.DEV)) {
    return envBaseUrl
  }

  return DEFAULT_API_BASE_URL
}

>>>>>>> Stashed changes
export const API_CONFIG = {
  baseURL: trimTrailingSlash(import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'),
  timeoutMs: Number(import.meta.env.VITE_API_TIMEOUT_MS || 15000),
  useAuthMock: String(import.meta.env.VITE_USE_AUTH_MOCK || 'false').toLowerCase() === 'true',
  showDevLoginButtons:
    String(import.meta.env.VITE_SHOW_DEV_LOGIN_BUTTONS || String(import.meta.env.DEV)).toLowerCase() === 'true',
}

export const AUTH_ENDPOINTS = {
  login: import.meta.env.VITE_AUTH_LOGIN_ENDPOINT || '/auth/login',
  register: import.meta.env.VITE_AUTH_REGISTER_ENDPOINT || '/auth/register',
  logout: import.meta.env.VITE_AUTH_LOGOUT_ENDPOINT || '/auth/logout',
  me: import.meta.env.VITE_AUTH_ME_ENDPOINT || '/auth/me',
}
