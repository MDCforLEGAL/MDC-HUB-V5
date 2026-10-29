export type AuthRole = "admin" | "member";

export interface AuthUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  role: AuthRole;
  createdAt: string;
}

export interface HealthInfo {
  ok: boolean;
  database: boolean;
  discord: boolean;
}

export interface RuntimeConfig {
  apiBaseUrl: string | null;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message?: string) {
    super(message ?? code);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

const TOKEN_KEY = "mdc-hub.session";

/* ------------------------------------------------------------------ */
/* Session token                                                       */
/* ------------------------------------------------------------------ */

export function getStoredToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function storeToken(token: string): void {
  try {
    window.localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Private browsing can block storage; the session then lasts this page only.
  }
}

export function clearStoredToken(): void {
  try {
    window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Nothing to clear.
  }
}

/* ------------------------------------------------------------------ */
/* Runtime configuration (public/config.json, editable without rebuild) */
/* ------------------------------------------------------------------ */

function basePath(): string {
  const base = import.meta.env.BASE_URL;
  return base.endsWith("/") ? base : `${base}/`;
}

function normalizeApiBase(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  const isLocal = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  if (url.protocol !== "https:" && !(isLocal && url.protocol === "http:")) return null;

  return url.origin;
}

async function readRuntimeConfig(): Promise<RuntimeConfig> {
  let apiBaseUrl: string | null = null;

  try {
    const response = await fetch(`${basePath()}config.json`, { cache: "no-store" });
    if (response.ok) {
      const payload = (await response.json()) as { apiBaseUrl?: unknown };
      apiBaseUrl = normalizeApiBase(payload.apiBaseUrl);
    }
  } catch {
    // Missing or offline config: accounts stay disabled instead of breaking the site.
  }

  if (!apiBaseUrl && import.meta.env.DEV) {
    // Local development talks to `npm run worker:dev` without extra setup.
    apiBaseUrl = "http://127.0.0.1:8787";
  }

  return { apiBaseUrl };
}

let configPromise: Promise<RuntimeConfig> | null = null;

export function getRuntimeConfig(): Promise<RuntimeConfig> {
  configPromise ??= readRuntimeConfig();
  return configPromise;
}

/* ------------------------------------------------------------------ */
/* HTTP                                                                */
/* ------------------------------------------------------------------ */

interface RequestOptions {
  method?: string;
  body?: unknown;
  token?: string | null;
  signal?: AbortSignal;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { apiBaseUrl } = await getRuntimeConfig();
  if (!apiBaseUrl) {
    throw new ApiError(0, "not_configured", "The account API is not configured.");
  }

  const headers: Record<string, string> = { Accept: "application/json" };
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (options.token) headers.Authorization = `Bearer ${options.token}`;

  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      method: options.method ?? "GET",
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal,
      mode: "cors",
      credentials: "omit",
      cache: "no-store",
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiError(0, "network", "The account service could not be reached.");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  let payload: unknown = null;
  const contentType = response.headers.get("Content-Type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const body = (payload ?? {}) as { error?: string; message?: string };
    throw new ApiError(response.status, body.error ?? "request_failed", body.message);
  }

  return payload as T;
}

export async function fetchHealth(signal?: AbortSignal): Promise<HealthInfo> {
  return request<HealthInfo>("/health", { signal });
}

interface SessionPayload {
  token: string;
  expiresAt: string;
  user: AuthUser;
}

export async function exchangeLoginCode(code: string, signal?: AbortSignal): Promise<SessionPayload> {
  return request<SessionPayload>("/auth/exchange", {
    method: "POST",
    body: { code },
    signal,
  });
}

export async function fetchMe(token: string, signal?: AbortSignal): Promise<AuthUser> {
  const payload = await request<{ user: AuthUser }>("/api/me", { token, signal });
  return payload.user;
}

export async function endSession(token: string): Promise<void> {
  await request<{ ok: boolean }>("/auth/logout", { method: "POST", token });
}

/** Sends the browser to Discord. Returns false when the API is not configured. */
export async function beginDiscordLogin(): Promise<boolean> {
  const { apiBaseUrl } = await getRuntimeConfig();
  if (!apiBaseUrl) return false;

  window.location.assign(`${apiBaseUrl}/auth/discord`);
  return true;
}

/* ------------------------------------------------------------------ */
/* Bootstrap                                                           */
/* ------------------------------------------------------------------ */

export type AuthStatus = "loading" | "signed-in" | "signed-out" | "unconfigured" | "unavailable";
export type AuthErrorKind = "callback" | "network" | null;

export interface AuthSnapshot {
  status: AuthStatus;
  user: AuthUser | null;
  health: HealthInfo | null;
  error: AuthErrorKind;
  errorDetail: string | null;
}

let callbackError: string | null = null;

function consumeCallbackFragment(): string | null {
  const raw = window.location.hash.replace(/^#/, "");
  if (!raw) return null;

  const params = new URLSearchParams(raw);
  const code = params.get("mdc_auth");
  const error = params.get("mdc_auth_error");
  if (!code && !error) return null;

  callbackError = error;
  window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
  return code;
}

let bootstrapPromise: Promise<AuthSnapshot> | null = null;

export function bootstrapAuth(): Promise<AuthSnapshot> {
  bootstrapPromise ??= runBootstrap();
  return bootstrapPromise;
}

async function runBootstrap(): Promise<AuthSnapshot> {
  const code = consumeCallbackFragment();
  const { apiBaseUrl } = await getRuntimeConfig();

  if (!apiBaseUrl) {
    return {
      status: "unconfigured",
      user: null,
      health: null,
      error: callbackError ? "callback" : null,
      errorDetail: callbackError,
    };
  }

  let health: HealthInfo;
  try {
    health = await fetchHealth();
  } catch {
    return {
      status: "unavailable",
      user: null,
      health: null,
      error: callbackError ? "callback" : "network",
      errorDetail: callbackError,
    };
  }

  if (code) {
    try {
      const session = await exchangeLoginCode(code);
      storeToken(session.token);
      return { status: "signed-in", user: session.user, health, error: null, errorDetail: null };
    } catch (error) {
      clearStoredToken();
      return {
        status: "signed-out",
        user: null,
        health,
        error: "callback",
        errorDetail: error instanceof ApiError ? error.code : "exchange_failed",
      };
    }
  }

  if (callbackError) {
    return {
      status: "signed-out",
      user: null,
      health,
      error: "callback",
      errorDetail: callbackError,
    };
  }

  const token = getStoredToken();
  if (!token) {
    return { status: "signed-out", user: null, health, error: null, errorDetail: null };
  }

  try {
    const user = await fetchMe(token);
    return { status: "signed-in", user, health, error: null, errorDetail: null };
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      clearStoredToken();
      return { status: "signed-out", user: null, health, error: null, errorDetail: null };
    }

    return {
      status: "unavailable",
      user: null,
      health,
      error: "network",
      errorDetail: error instanceof ApiError ? error.code : null,
    };
  }
}
