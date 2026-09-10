import { getAccessToken, setAccessToken } from "./auth-token";
import type { Role } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4010/api/v1";
// The API's origin (no /api/v1 prefix) — locally-stored photos come back as
// a path relative to *that* origin, not this Next.js app's own origin.
const API_ORIGIN = API_BASE_URL.replace(/\/api\/v\d+\/?$/, "");

/** Resolves a photo/asset URL from the API into one the browser can load. Absolute (S3/CDN) URLs pass through unchanged. */
export function resolveMediaUrl(url: string): string {
  if (!url) return url;
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_ORIGIN}${url.startsWith("/") ? "" : "/"}${url}`;
}

// Mirrors AuthController's SafeUser (backend/src/modules/auth/auth.service.ts).
export interface BackendUser {
  id: string;
  name: string;
  phone: string;
  role: Role;
}

export interface LoginResult {
  user: BackendUser;
  accessToken: string;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function parseErrorMessage(res: Response): Promise<string> {
  try {
    const body: unknown = await res.json();
    if (
      body &&
      typeof body === "object" &&
      "message" in body &&
      typeof (body as { message: unknown }).message === "string"
    ) {
      return (body as { message: string }).message;
    }
  } catch {
    // response wasn't JSON — fall through to the generic message below
  }
  return res.statusText || `Request failed with status ${res.status}`;
}

/**
 * Dedupes concurrent refresh attempts — if five requests all 401 at once,
 * only one POST /auth/refresh goes out and the rest await its result.
 */
let refreshInFlight: Promise<LoginResult | null> | null = null;

async function doRefresh(): Promise<LoginResult | null> {
  const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) {
    setAccessToken(null);
    return null;
  }
  const data = (await res.json()) as LoginResult;
  setAccessToken(data.accessToken);
  return data;
}

/** Silent refresh using the httpOnly cookie — no phone/password needed. */
export function refreshSession(): Promise<LoginResult | null> {
  if (!refreshInFlight) {
    refreshInFlight = doRefresh().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

export async function login(phone: string, password: string): Promise<LoginResult> {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ phone, password }),
  });
  if (!res.ok) {
    throw new ApiError(res.status, await parseErrorMessage(res));
  }
  const data = (await res.json()) as LoginResult;
  setAccessToken(data.accessToken);
  return data;
}

export async function logout(): Promise<void> {
  try {
    await apiFetch("/auth/logout", { method: "POST" });
  } finally {
    setAccessToken(null);
  }
}

export async function fetchMe(): Promise<BackendUser> {
  const data = await apiFetch<{ user: BackendUser }>("/auth/me");
  return data.user;
}

interface ApiFetchOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  /** Internal: prevents infinite retry loops on the refresh call itself. */
  _isRetry?: boolean;
}

/**
 * Fetch wrapper for authenticated calls: attaches the in-memory access
 * token, sends the refresh cookie along for the ride, and on a 401
 * transparently refreshes once and retries — callers never have to think
 * about token expiry. Pass a FormData body (file uploads) and the
 * Content-Type header is left for the browser to set with its boundary.
 */
export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { body, _isRetry, headers, ...rest } = options;
  const token = getAccessToken();
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    credentials: "include",
    headers: {
      ...(body !== undefined && !isFormData ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : isFormData ? (body as FormData) : JSON.stringify(body),
  });

  if (res.status === 401 && !_isRetry && !path.startsWith("/auth/")) {
    const refreshed = await refreshSession();
    if (refreshed) {
      return apiFetch<T>(path, { ...options, _isRetry: true });
    }
  }

  if (!res.ok) {
    throw new ApiError(res.status, await parseErrorMessage(res));
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

/** Absolute URL for the API base — for building download/template links (<a href>). */
export function apiUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}

/**
 * Downloads a file from an authenticated GET endpoint (templates, CSV error
 * reports). A plain <a href> can't carry the in-memory Bearer token, so this
 * fetches the blob with apiFetch's auth/refresh handling and saves it via a
 * throwaway object URL.
 */
export async function downloadAuthenticated(path: string, filename: string): Promise<void> {
  const token = getAccessToken();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  let response = res;
  if (response.status === 401) {
    const refreshed = await refreshSession();
    if (refreshed) {
      response = await fetch(`${API_BASE_URL}${path}`, {
        credentials: "include",
        headers: { Authorization: `Bearer ${refreshed.accessToken}` },
      });
    }
  }

  if (!response.ok) {
    throw new ApiError(response.status, await parseErrorMessage(response));
  }

    const blob = new Blob([await response.arrayBuffer()], {
      type:
        response.headers.get("Content-Type") ||
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
