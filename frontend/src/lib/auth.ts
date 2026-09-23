export type AuthUser = {
  userId: string;
  email: string;
  role: string;
  exp: number;
  iat: number;
};

const ACCESS_KEY = "access_token";
const REFRESH_KEY = "refresh_token";

export function saveTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem(ACCESS_KEY, accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export function decodeToken(token: string): AuthUser | null {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/"))) as AuthUser;
  } catch {
    return null;
  }
}

export function isExpired(token: string): boolean {
  const decoded = decodeToken(token);
  return !decoded || decoded.exp * 1000 < Date.now();
}

export function getCurrentUser(): AuthUser | null {
  const token = getAccessToken();
  if (!token || isExpired(token)) return null;
  return decodeToken(token);
}

export function logout(): void {
  clearTokens();
  window.location.href = "/";
}
