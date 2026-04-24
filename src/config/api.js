const trimTrailingSlash = (value = '') => value.replace(/\/$/, '')

const DEFAULT_PROD_API_BASE_URL = 'https://ezequiel-gateway-etcrh9dxg9dwhng4.canadacentral-01.azurewebsites.net'
const DEFAULT_DEV_API_BASE_URL = ''  // Proxy de Vite reenvía /api/* → localhost:8081
const DEFAULT_API_BASE_URL = import.meta.env.DEV ? DEFAULT_DEV_API_BASE_URL : DEFAULT_PROD_API_BASE_URL
const DEFAULT_DEV_AUCTION_WS_URL = 'ws://localhost:8080/ws'

const isLocalhostUrl = (value = '') => /^(https?:\/\/)?(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/i.test(value)

const normalizeWsUrl = (value = '') => {
  const normalized = trimTrailingSlash(String(value || '').trim())
  if (!normalized) return ''
  return normalized.replace(/^http/i, 'ws')
}

const resolveApiBaseUrl = () => {
  const envBaseUrl = trimTrailingSlash(import.meta.env.VITE_API_BASE_URL || '')

  if (envBaseUrl && !(isLocalhostUrl(envBaseUrl) && !import.meta.env.DEV)) {
    return envBaseUrl
  }

  return DEFAULT_API_BASE_URL
}

const resolveAuctionWsUrl = () => {
  // VITE_WS_URL toma precedencia — cubre tanto subastas como ubicación de repartidores
  const wsUrl = normalizeWsUrl(import.meta.env.VITE_WS_URL || '')
  if (wsUrl) return wsUrl

  const explicitWsUrl = normalizeWsUrl(import.meta.env.VITE_AUCTION_WS_URL || '')
  if (explicitWsUrl) return explicitWsUrl

  // En desarrollo: conectar directo al backend (puerto 8080)
  if (import.meta.env.DEV) {
    return DEFAULT_DEV_AUCTION_WS_URL
  }

  // En producción sin VITE_WS_URL: derivar del backend Azure
  // El gateway de Azure no hace proxy WebSocket — apuntamos al backend directamente
  const httpBase = resolveApiBaseUrl().replace(/\/api\/?$/, '')
  const gatewayWs = normalizeWsUrl(httpBase) + '/ws'
  // Sustituir el dominio del gateway por el del backend si coincide el patrón conocido
  return gatewayWs.replace('ezequiel-gateway', 'medi-go-app')
}

export const API_CONFIG = {
  baseURL: resolveApiBaseUrl(),
  auctionWsURL: resolveAuctionWsUrl(),
  timeoutMs: Number(import.meta.env.VITE_API_TIMEOUT_MS || 15000),
  enableTraceIdHeader: String(import.meta.env.VITE_ENABLE_TRACE_ID_HEADER || 'false').toLowerCase() === 'true',
  useAuthMock: String(import.meta.env.VITE_USE_AUTH_MOCK || 'false').toLowerCase() === 'true',
  showDevLoginButtons:
    String(import.meta.env.VITE_SHOW_DEV_LOGIN_BUTTONS || String(import.meta.env.DEV)).toLowerCase() === 'true',
}

export const AUTH_ENDPOINTS = {
  login: import.meta.env.VITE_AUTH_LOGIN_ENDPOINT || '/api/auth/login',
  register: import.meta.env.VITE_AUTH_REGISTER_ENDPOINT || '/api/auth/register',
  logout: import.meta.env.VITE_AUTH_LOGOUT_ENDPOINT || '/api/auth/logout',
  me: import.meta.env.VITE_AUTH_ME_ENDPOINT || '/api/auth/me',
}
