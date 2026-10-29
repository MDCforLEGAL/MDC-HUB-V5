import type { Env } from "./env";

const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "Cache-Control": "no-store",
};

export function parseOrigins(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function resolveOrigin(request: Request, env: Env): string | null {
  const origin = request.headers.get("Origin");
  if (!origin) return null;
  return parseOrigins(env.SITE_ORIGINS).includes(origin) ? origin : null;
}

export function preflight(request: Request, env: Env): Response {
  const origin = resolveOrigin(request, env);
  const headers = new Headers({
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  });
  if (origin) headers.set("Access-Control-Allow-Origin", origin);

  return new Response(null, { status: 204, headers });
}

export function applyCors(response: Response, request: Request, env: Env): Response {
  const origin = resolveOrigin(request, env);
  const headers = new Headers(response.headers);
  headers.set("Vary", "Origin");
  if (origin) headers.set("Access-Control-Allow-Origin", origin);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export function json(
  data: unknown,
  status: number,
  request: Request,
  env: Env,
): Response {
  const origin = resolveOrigin(request, env);
  const headers = new Headers({ "Content-Type": "application/json; charset=utf-8", ...SECURITY_HEADERS });
  headers.set("Vary", "Origin");
  if (origin) headers.set("Access-Control-Allow-Origin", origin);

  return new Response(JSON.stringify(data), { status, headers });
}

export function apiError(
  code: string,
  status: number,
  request: Request,
  env: Env,
  message?: string,
): Response {
  return json({ error: code, message: message ?? code }, status, request, env);
}

export function redirect(location: string, extraHeaders?: Record<string, string>): Response {
  const headers = new Headers({ Location: location, ...SECURITY_HEADERS });
  for (const [name, value] of Object.entries(extraHeaders ?? {})) {
    headers.set(name, value);
  }
  return new Response(null, { status: 302, headers });
}

export function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get("Cookie");
  if (!header) return null;

  for (const part of header.split(";")) {
    const separator = part.indexOf("=");
    if (separator === -1) continue;
    if (part.slice(0, separator).trim() === name) {
      try {
        return decodeURIComponent(part.slice(separator + 1).trim());
      } catch {
        return null;
      }
    }
  }
  return null;
}

export function serializeCookie(
  name: string,
  value: string,
  options: { maxAge: number; path: string; secure: boolean },
): string {
  return [
    `${name}=${encodeURIComponent(value)}`,
    `Path=${options.path}`,
    `Max-Age=${options.maxAge}`,
    "HttpOnly",
    "SameSite=Lax",
    ...(options.secure ? ["Secure"] : []),
  ].join("; ");
}

export function clearCookie(name: string, path: string): string {
  return `${name}=; Path=${path}; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;
}

export function appendSetCookie(headers: Headers, cookies: string[]): void {
  for (const cookie of cookies) headers.append("Set-Cookie", cookie);
}
