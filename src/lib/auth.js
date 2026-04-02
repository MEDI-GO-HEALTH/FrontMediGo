/**
 * Decodes JWT payload without signature verification (client-side only).
 * JWT claims: sub=userId, username, email, role
 * @param {string} token
 * @returns {object|null}
 */
function decodeJwt(token) {
  try {
    const payload = token.split('.')[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

const TOKEN_KEY = 'medigo_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * @returns {{ userId: number, username: string, email: string, role: string }|null}
 */
export function getCurrentUser() {
  const token = getToken();
  if (!token) return null;
  const claims = decodeJwt(token);
  if (!claims) return null;
  return {
    userId: Number(claims.sub),
    username: claims.username ?? String(claims.sub),
    email: claims.email ?? '',
    role: claims.role ?? 'USER',
  };
}

export function isAdmin() {
  return getCurrentUser()?.role === 'ADMIN';
}

/** USER or DELIVERY role = afiliado that can join and bid */
export function isAfiliado() {
  const role = getCurrentUser()?.role;
  return role === 'USER' || role === 'DELIVERY';
}

export function isAuthenticated() {
  return !!getToken();
}
