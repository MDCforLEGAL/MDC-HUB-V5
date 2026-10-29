import type { Env } from "./env";
import { randomToken, sha256Hex, timingSafeEqual } from "./crypto";
import {
  consumeLoginCode,
  consumeOAuthState,
  createLoginCode,
  createOAuthState,
  createSession,
  deleteSession,
  findSessionUser,
  pruneExpired,
  toPublicUser,
  touchSession,
  upsertDiscordUser,
} from "./db";
import { buildAuthorizeUrl, discordConfigured, exchangeDiscordCode, fetchDiscordProfile } from "./discord";
import {
  apiError,
  applyCors,
  clearCookie,
  json,
  preflight,
  readCookie,
  redirect,
  serializeCookie,
} from "./http";

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const SESSION_REFRESH_MS = 20 * 24 * 60 * 60 * 1000;
const LOGIN_CODE_TTL_MS = 60 * 1000;
const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;
const MAX_BODY_BYTES = 2048;

const STATE_COOKIE = "mdc_oauth";
const STATE_COOKIE_PATH = "/auth";

function iso(timestamp: number): string {
  return new Date(timestamp).toISOString();
}

function callbackUrl(request: Request): string {
  return `${new URL(request.url).origin}/auth/discord/callback`;
}

function siteUrl(env: Env): URL | null {
  const value = (env.SITE_REDIRECT_URL ?? "").trim();
  if (!value) return null;
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function siteRedirect(env: Env, key: string, value: string): string | null {
  const url = siteUrl(env);
  if (!url) return null;
  url.hash = `${key}=${value}`;
  return url.toString();
}

function redirectToSiteError(env: Env, reason: string, cookie: string): Response {
  const target = siteRedirect(env, "mdc_auth_error", reason);
  if (!target) return new Response("SITE_REDIRECT_URL is not configured on this API.", { status: 500 });
  return redirect(target, { "Set-Cookie": cookie });
}

function adminIds(env: Env): string[] {
  return (env.ADMIN_DISCORD_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

function bearerToken(request: Request): string | null {
  const header = request.headers.get("Authorization");
  if (!header) return null;

  const [scheme, value] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !value) return null;
  return /^[a-f0-9]{64}$/.test(value) ? value : null;
}

async function handleHealth(request: Request, env: Env): Promise<Response> {
  let database = false;
  try {
    await env.DB.prepare("SELECT 1").first();
    database = true;
  } catch (error) {
    console.error("health_db_failed", error);
  }

  return json(
    {
      ok: true,
      service: "mdc-hub-api",
      database,
      discord: discordConfigured(env),
      time: new Date().toISOString(),
    },
    200,
    request,
    env,
  );
}

async function handleDiscordStart(request: Request, env: Env): Promise<Response> {
  if (request.method !== "GET") {
    return apiError("method_not_allowed", 405, request, env);
  }
  if (!discordConfigured(env)) {
    return apiError(
      "auth_not_configured",
      503,
      request,
      env,
      "Discord login is not configured on this API yet.",
    );
  }

  const state = randomToken(24);
  const now = Date.now();
  await createOAuthState(env.DB, state, iso(now), iso(now + OAUTH_STATE_TTL_MS));

  const response = redirect(buildAuthorizeUrl(env, state, callbackUrl(request)));
  response.headers.append(
    "Set-Cookie",
    serializeCookie(STATE_COOKIE, state, {
      maxAge: OAUTH_STATE_TTL_MS / 1000,
      path: STATE_COOKIE_PATH,
      // Workers is HTTPS-only; local `wrangler dev` on http still needs the cookie.
      secure: new URL(request.url).protocol === "https:",
    }),
  );
  return response;
}

async function handleDiscordCallback(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const state = url.searchParams.get("state") ?? "";
  const code = url.searchParams.get("code") ?? "";
  const providerError = url.searchParams.get("error");
  const cookieState = readCookie(request, STATE_COOKIE) ?? "";
  const clearedCookie = clearCookie(STATE_COOKIE, STATE_COOKIE_PATH);

  if (providerError) {
    return redirectToSiteError(env, "cancelled", clearedCookie);
  }
  if (!state || !cookieState || !timingSafeEqual(state, cookieState)) {
    return redirectToSiteError(env, "state", clearedCookie);
  }

  const now = Date.now();
  if (!(await consumeOAuthState(env.DB, state, iso(now)))) {
    return redirectToSiteError(env, "state", clearedCookie);
  }
  if (!code || !discordConfigured(env)) {
    return redirectToSiteError(env, "config", clearedCookie);
  }

  try {
    const accessToken = await exchangeDiscordCode(env, code, callbackUrl(request));
    const profile = await fetchDiscordProfile(env, accessToken);
    const role = adminIds(env).includes(profile.id) ? "admin" : "member";
    const user = await upsertDiscordUser(env.DB, profile, role, iso(now));

    const loginCode = randomToken(32);
    await createLoginCode(
      env.DB,
      await sha256Hex(loginCode),
      user.id,
      iso(now),
      iso(now + LOGIN_CODE_TTL_MS),
    );

    const target = siteRedirect(env, "mdc_auth", loginCode);
    if (!target) {
      return redirectToSiteError(env, "config", clearedCookie);
    }

    // Cleanup is best effort: expired rows never authenticate anything.
    await pruneExpired(env.DB, iso(now)).catch((error) => console.error("prune_failed", error));

    return redirect(target, { "Set-Cookie": clearedCookie });
  } catch (error) {
    console.error("discord_callback_failed", error);
    return redirectToSiteError(env, "server", clearedCookie);
  }
}

async function handleExchange(request: Request, env: Env): Promise<Response> {
  if (request.method !== "POST") {
    return apiError("method_not_allowed", 405, request, env);
  }

  const contentLength = Number(request.headers.get("Content-Length") ?? "0");
  if (contentLength > MAX_BODY_BYTES) {
    return apiError("body_too_large", 413, request, env);
  }

  let payload: unknown;
  try {
    const body = await request.text();
    if (body.length > MAX_BODY_BYTES) {
      return apiError("body_too_large", 413, request, env);
    }
    payload = JSON.parse(body);
  } catch {
    return apiError("invalid_body", 400, request, env);
  }

  const code =
    payload && typeof payload === "object" && typeof (payload as { code?: unknown }).code === "string"
      ? (payload as { code: string }).code.trim()
      : "";
  if (!/^[a-f0-9]{64}$/.test(code)) {
    return apiError("invalid_code", 400, request, env);
  }

  const now = Date.now();
  const userId = await consumeLoginCode(env.DB, await sha256Hex(code), iso(now));
  if (!userId) {
    return apiError("invalid_code", 401, request, env, "This sign-in link is invalid or has expired.");
  }

  const token = randomToken(32);
  const tokenHash = await sha256Hex(token);
  const expiresAt = iso(now + SESSION_TTL_MS);
  await createSession(env.DB, tokenHash, userId, iso(now), expiresAt);

  const session = await findSessionUser(env.DB, tokenHash, iso(now));
  if (!session) {
    return apiError("server_error", 500, request, env);
  }

  return json({ token, expiresAt, user: toPublicUser(session) }, 200, request, env);
}

async function handleMe(request: Request, env: Env): Promise<Response> {
  if (request.method !== "GET") {
    return apiError("method_not_allowed", 405, request, env);
  }

  const token = bearerToken(request);
  if (!token) {
    return apiError("unauthorized", 401, request, env, "A valid session token is required.");
  }

  const now = Date.now();
  const tokenHash = await sha256Hex(token);
  const row = await findSessionUser(env.DB, tokenHash, iso(now));
  if (!row) {
    return apiError("unauthorized", 401, request, env, "This session is invalid or expired.");
  }

  // Sliding session: keep active users signed in without unbounded lifetimes.
  const expiresAt = Date.parse(row.session_expires_at);
  if (Number.isFinite(expiresAt) && expiresAt - now < SESSION_REFRESH_MS) {
    await touchSession(env.DB, tokenHash, iso(now + SESSION_TTL_MS));
  }

  return json({ user: toPublicUser(row) }, 200, request, env);
}

async function handleLogout(request: Request, env: Env): Promise<Response> {
  if (request.method !== "POST") {
    return apiError("method_not_allowed", 405, request, env);
  }

  const token = bearerToken(request);
  if (token) {
    await deleteSession(env.DB, await sha256Hex(token));
  }

  return json({ ok: true }, 200, request, env);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return preflight(request, env);
    }

    let response: Response;
    try {
      if (url.pathname === "/" || url.pathname === "/health") {
        response = await handleHealth(request, env);
      } else if (url.pathname === "/auth/discord") {
        response = await handleDiscordStart(request, env);
      } else if (url.pathname === "/auth/discord/callback") {
        response = await handleDiscordCallback(request, env);
      } else if (url.pathname === "/auth/exchange") {
        response = await handleExchange(request, env);
      } else if (url.pathname === "/auth/logout") {
        response = await handleLogout(request, env);
      } else if (url.pathname === "/api/me") {
        response = await handleMe(request, env);
      } else {
        response = apiError("not_found", 404, request, env);
      }
    } catch (error) {
      console.error("unhandled_error", error);
      response = apiError("server_error", 500, request, env);
    }

    return applyCors(response, request, env);
  },
};
