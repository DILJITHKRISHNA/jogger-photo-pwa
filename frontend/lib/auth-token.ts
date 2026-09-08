// Access token lives in memory only — never localStorage/sessionStorage,
// so it isn't readable by an XSS payload. It's lost on a hard refresh by
// design; AuthProvider re-mints one on mount via the httpOnly refresh
// cookie (see providers/auth-provider.tsx).
let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}
