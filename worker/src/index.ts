import type { Env } from "./env";
import { randomToken, sha256Hex, timingSafeEqual } from "./crypto";
import {
  buildProfile,
  consumeLoginCode,
  consumeOAuthState,
  createComment,
  createCommunityScript,
  createLoginCode,
  createOAuthState,
  createSession,
  deleteComment,
  deleteCommunityScript,
  deleteSession,
  findCommunityScript,
  findPublicProfile,
  findSessionUser,
  listComments,
  listCommunityScripts,
  listUsersForAdmin,
  myReactions,
  parseProfileLinks,
  pruneExpired,
  setCommentHidden,
  setReaction,
  setUserRole,
  socialCounts,
  toPublicAuthor,
  toPublicCommunityScript,
  toPublicUser,
  touchSession,
  updateUserProfile,
  upsertDiscordUser,
  userStats,
} from "./db";
import type { ProfileLink, ScriptSection, SessionRow } from "./db";
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

function adminUsernames(env: Env): string[] {
  return (env.ADMIN_USERNAMES ?? "")
    .split(",")
    .map((name) => name.trim().replace(/^@/, "").toLowerCase())
    .filter(Boolean);
}

/** Admins come from the env allowlist (ids or usernames) or a granted role in D1. */
function isAdminIdentity(env: Env, discordId: string, username: string): boolean {
  return (
    adminIds(env).includes(discordId) ||
    adminUsernames(env).includes(username.trim().replace(/^@/, "").toLowerCase())
  );
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
    const role = isAdminIdentity(env, profile.id, profile.username) ? "admin" : "member";
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

  // The env allowlist wins even for sessions created before the username was added.
  if (row.role !== "admin" && isAdminIdentity(env, row.provider_id, row.username)) {
    const promoted = await setUserRole(env.DB, row.id, "admin");
    if (promoted) row.role = "admin";
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

const SCRIPT_ID_PATTERN = /^[a-z0-9][a-z0-9_-]{0,79}$/i;
const COMMENT_MAX_LENGTH = 600;
const PROFILE_BIO_MAX = 180;
const PROFILE_LINKS_MAX = 3;
const PROFILE_LINK_LABEL_MAX = 28;
const PROFILE_LINK_URL_MAX = 240;
const MAX_JSON_BYTES = 120_000;

function isScriptId(value: string | null): value is string {
  return Boolean(value && SCRIPT_ID_PATTERN.test(value));
}

async function readJsonBody(request: Request): Promise<unknown | null> {
  const declared = Number(request.headers.get("Content-Length") ?? "0");
  if (declared > MAX_JSON_BYTES) return null;

  const body = await request.text();
  if (body.length > MAX_JSON_BYTES) return null;

  try {
    return JSON.parse(body) as unknown;
  } catch {
    return null;
  }
}

function field(payload: unknown, key: string, max: number): string {
  if (!payload || typeof payload !== "object") return "";
  const value = (payload as Record<string, unknown>)[key];
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function scriptTags(payload: unknown): string[] {
  if (!payload || typeof payload !== "object") return [];
  const value = (payload as Record<string, unknown>).tags;
  if (!Array.isArray(value)) return [];

  return Array.from(
    new Set(
      value
        .filter((tag): tag is string => typeof tag === "string")
        .map((tag) => tag.trim().slice(0, 24))
        .filter(Boolean),
    ),
  ).slice(0, 5);
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (url.protocol === "http:" || url.protocol === "https:") && Boolean(url.hostname);
  } catch {
    return false;
  }
}

function profileLinks(payload: unknown): ProfileLink[] | null {
  if (!payload || typeof payload !== "object") return null;
  const raw = (payload as { links?: unknown }).links;
  if (raw === undefined) return [];
  if (!Array.isArray(raw) || raw.length > PROFILE_LINKS_MAX) return null;

  const links: ProfileLink[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") return null;

    const label = field(item, "label", PROFILE_LINK_LABEL_MAX);
    const url = field(item, "url", PROFILE_LINK_URL_MAX);
    if (!url) continue;
    if (!isHttpUrl(url)) return null;

    const hostname = new URL(url).hostname.replace(/^www\./i, "");
    links.push({ label: label || hostname, url });
  }

  return links.slice(0, PROFILE_LINKS_MAX);
}

async function sessionUser(request: Request, env: Env): Promise<SessionRow | null> {
  const token = bearerToken(request);
  if (!token) return null;
  return findSessionUser(env.DB, await sha256Hex(token), iso(Date.now()));
}

async function handleCommunityList(request: Request, env: Env): Promise<Response> {
  if (request.method !== "GET") {
    return apiError("method_not_allowed", 405, request, env);
  }

  const rows = await listCommunityScripts(env.DB);
  return json({ scripts: rows.map(toPublicCommunityScript) }, 200, request, env);
}

async function handleCommunityCreate(request: Request, env: Env): Promise<Response> {
  if (request.method !== "POST") {
    return apiError("method_not_allowed", 405, request, env);
  }

  const user = await sessionUser(request, env);
  if (!user) {
    return apiError("unauthorized", 401, request, env, "Sign in to publish a script.");
  }
  const payload = await readJsonBody(request);
  if (!payload) {
    return apiError("invalid_body", 400, request, env);
  }

  const title = field(payload, "title", 140);
  const game = field(payload, "game", 80);
  const description = field(payload, "description", 600);
  const code = field(payload, "code", 80_000);

  if (title.length < 3 || game.length < 2 || code.length < 10) {
    return apiError(
      "invalid_fields",
      400,
      request,
      env,
      "Game, script name and script code are required.",
    );
  }

  const requestedSection =
    field(payload, "section", 16) || (user.role === "admin" ? "mdc" : "community");
  if (requestedSection !== "mdc" && requestedSection !== "community") {
    return apiError(
      "invalid_section",
      400,
      request,
      env,
      "Choose the MDC or Community section.",
    );
  }
  if (requestedSection === "mdc" && user.role !== "admin") {
    return apiError(
      "publish_admin_only",
      403,
      request,
      env,
      "MDC scripts can only be published by admin accounts.",
    );
  }
  const section: ScriptSection = requestedSection;

  const now = iso(Date.now());
  const id = `community-${randomToken(8)}`;
  await createCommunityScript(env.DB, {
    id,
    userId: user.id,
    section,
    title,
    game,
    description,
    code,
    tags: scriptTags(payload),
    now,
  });

  const row = await findCommunityScript(env.DB, id);
  return json({ script: row ? toPublicCommunityScript(row) : null }, 201, request, env);
}

async function handleCommunityDelete(
  request: Request,
  env: Env,
  rawId: string,
): Promise<Response> {
  if (request.method !== "DELETE") {
    return apiError("method_not_allowed", 405, request, env);
  }

  const user = await sessionUser(request, env);
  if (!user) {
    return apiError("unauthorized", 401, request, env, "Sign in to delete a script.");
  }
  if (!isScriptId(rawId)) {
    return apiError("not_found", 404, request, env);
  }

  const row = await findCommunityScript(env.DB, rawId);
  if (!row) {
    return apiError("not_found", 404, request, env);
  }
  if (row.user_id !== user.id && user.role !== "admin") {
    return apiError("forbidden", 403, request, env, "Only the author can delete this script.");
  }

  await deleteCommunityScript(env.DB, rawId);
  return json({ ok: true }, 200, request, env);
}

async function handleSocialGet(
  request: Request,
  env: Env,
  url: URL,
): Promise<Response> {
  if (request.method !== "GET") {
    return apiError("method_not_allowed", 405, request, env);
  }

  const ids = Array.from(
    new Set(
      (url.searchParams.get("ids") ?? "")
        .split(",")
        .map((value) => value.trim())
        .filter(isScriptId),
    ),
  ).slice(0, 60);

  if (ids.length === 0) {
    return json({ social: {} }, 200, request, env);
  }

  const counts = await socialCounts(env.DB, ids);
  const user = await sessionUser(request, env);
  const mine = user ? await myReactions(env.DB, user.id, ids) : new Map<string, number>();

  const social: Record<
    string,
    { likes: number; dislikes: number; comments: number; mine: number }
  > = {};
  for (const row of counts) {
    social[row.scriptId] = {
      likes: row.likes,
      dislikes: row.dislikes,
      comments: row.comments,
      mine: mine.get(row.scriptId) ?? 0,
    };
  }

  return json({ social }, 200, request, env);
}

async function handleSocialReact(request: Request, env: Env): Promise<Response> {
  if (request.method !== "POST") {
    return apiError("method_not_allowed", 405, request, env);
  }

  const user = await sessionUser(request, env);
  if (!user) {
    return apiError("unauthorized", 401, request, env, "Sign in to react to a script.");
  }

  const payload = await readJsonBody(request);
  if (!payload) {
    return apiError("invalid_body", 400, request, env);
  }

  const scriptId = field(payload, "scriptId", 80);
  const rawValue = (payload as { value?: unknown }).value;
  const value = typeof rawValue === "number" ? rawValue : Number.NaN;

  if (!isScriptId(scriptId) || !Number.isInteger(value) || value < -1 || value > 1) {
    return apiError("invalid_body", 400, request, env);
  }

  await setReaction(env.DB, scriptId, user.id, value, iso(Date.now()));

  const [row] = await socialCounts(env.DB, [scriptId]);
  return json(
    {
      social: {
        likes: row?.likes ?? 0,
        dislikes: row?.dislikes ?? 0,
        comments: row?.comments ?? 0,
        mine: value,
      },
    },
    200,
    request,
    env,
  );
}

async function handleCommentsList(
  request: Request,
  env: Env,
  url: URL,
): Promise<Response> {
  if (request.method !== "GET") {
    return apiError("method_not_allowed", 405, request, env);
  }

  const scriptId = url.searchParams.get("scriptId");
  if (!isScriptId(scriptId)) {
    return apiError("invalid_body", 400, request, env);
  }

  const user = await sessionUser(request, env);
  const rows = await listComments(env.DB, scriptId, {
    includeHidden: user?.role === "admin",
  });

  const comments = rows.map((row) => ({
    id: row.id,
    body: row.body,
    createdAt: row.created_at,
    hidden: row.hidden === 1,
    author: toPublicAuthor(
      {
        id: row.user_id,
        username: row.username,
        display_name: row.display_name,
        avatar_url: row.avatar_url,
        role: row.role,
      },
      {
        scripts: Number(row.author_scripts ?? 0),
        comments: Number(row.author_comments ?? 0),
        likesGiven: Number(row.author_likes_given ?? 0),
      },
    ),
    mine: Boolean(user && (row.user_id === user.id || user.role === "admin")),
  }));

  return json({ comments }, 200, request, env);
}

async function handleCommentsCreate(request: Request, env: Env): Promise<Response> {
  if (request.method !== "POST") {
    return apiError("method_not_allowed", 405, request, env);
  }

  const user = await sessionUser(request, env);
  if (!user) {
    return apiError("unauthorized", 401, request, env, "Sign in to comment.");
  }

  const payload = await readJsonBody(request);
  if (!payload) {
    return apiError("invalid_body", 400, request, env);
  }

  const scriptId = field(payload, "scriptId", 80);
  const body = field(payload, "body", COMMENT_MAX_LENGTH);

  if (!isScriptId(scriptId) || body.length === 0) {
    return apiError("invalid_body", 400, request, env, "Write a comment first.");
  }

  const now = iso(Date.now());
  const id = `c-${randomToken(8)}`;
  await createComment(env.DB, { id, scriptId, userId: user.id, body, now });

  return json(
    {
      comment: {
        id,
        body,
        createdAt: now,
        author: toPublicAuthor(user, {
          scripts: Number(user.script_count ?? 0),
          comments: Number(user.comment_count ?? 0),
          likesGiven: Number(user.likes_given_count ?? 0),
        }),
        mine: true,
      },
    },
    201,
    request,
    env,
  );
}

async function handleCommentDelete(
  request: Request,
  env: Env,
  rawId: string,
): Promise<Response> {
  if (request.method !== "DELETE") {
    return apiError("method_not_allowed", 405, request, env);
  }

  const user = await sessionUser(request, env);
  if (!user) {
    return apiError("unauthorized", 401, request, env);
  }

  const result = await deleteComment(env.DB, rawId, user.id, user.role === "admin");
  if (result === "not_found") {
    return apiError("not_found", 404, request, env);
  }
  if (result === "forbidden") {
    return apiError("forbidden", 403, request, env);
  }

  return json({ ok: true }, 200, request, env);
}

async function handleCommentModerate(
  request: Request,
  env: Env,
  rawId: string,
): Promise<Response> {
  if (request.method !== "PATCH") {
    return apiError("method_not_allowed", 405, request, env);
  }

  const user = await sessionUser(request, env);
  if (!user) {
    return apiError("unauthorized", 401, request, env);
  }
  if (user.role !== "admin") {
    return apiError("forbidden", 403, request, env, "Admin access required.");
  }

  const payload = await readJsonBody(request);
  if (!payload || typeof payload !== "object") {
    return apiError("invalid_body", 400, request, env);
  }

  const hidden = (payload as { hidden?: unknown }).hidden;
  if (typeof hidden !== "boolean") {
    return apiError("invalid_body", 400, request, env, "A hidden value is required.");
  }

  const updated = await setCommentHidden(env.DB, rawId, user.id, hidden, iso(Date.now()));
  if (!updated) {
    return apiError("not_found", 404, request, env);
  }

  return json({ ok: true, hidden }, 200, request, env);
}

async function handleProfile(request: Request, env: Env): Promise<Response> {
  if (request.method !== "GET") {
    return apiError("method_not_allowed", 405, request, env);
  }

  const user = await sessionUser(request, env);
  if (!user) {
    return apiError("unauthorized", 401, request, env, "Sign in to see your profile.");
  }

  const stats = await userStats(env.DB, user.id);

  return json(
    { user: toPublicUser(user), ...buildProfile(stats) },
    200,
    request,
    env,
  );
}

async function handleProfileUpdate(request: Request, env: Env): Promise<Response> {
  if (request.method !== "PATCH") {
    return apiError("method_not_allowed", 405, request, env);
  }

  const user = await sessionUser(request, env);
  if (!user) {
    return apiError("unauthorized", 401, request, env, "Sign in to edit your profile.");
  }

  const payload = await readJsonBody(request);
  if (!payload || typeof payload !== "object") {
    return apiError("invalid_body", 400, request, env);
  }

  const bio = field(payload, "bio", PROFILE_BIO_MAX);
  const rawLinks = (payload as { links?: unknown }).links;
  const links =
    rawLinks === undefined ? parseProfileLinks(user.links) : profileLinks(payload);
  if (!links) {
    return apiError(
      "invalid_links",
      400,
      request,
      env,
      "Links must use http or https and fit in up to three entries.",
    );
  }

  const updated = await updateUserProfile(env.DB, user.id, bio, links);
  if (!updated) {
    return apiError("not_found", 404, request, env);
  }

  const stats = await userStats(env.DB, user.id);
  return json(
    { user: toPublicUser(updated), ...buildProfile(stats) },
    200,
    request,
    env,
  );
}

async function handlePublicProfile(
  request: Request,
  env: Env,
  rawUsername: string,
): Promise<Response> {
  if (request.method !== "GET") {
    return apiError("method_not_allowed", 405, request, env);
  }

  let username = "";
  try {
    username = decodeURIComponent(rawUsername).trim();
  } catch {
    return apiError("invalid_username", 400, request, env);
  }

  if (!username || username.length > 64) {
    return apiError("invalid_username", 400, request, env);
  }

  const profile = await findPublicProfile(env.DB, username);
  if (!profile) {
    return apiError("not_found", 404, request, env);
  }

  return json(profile, 200, request, env);
}

async function handleAdminUsers(
  request: Request,
  env: Env,
  url: URL,
): Promise<Response> {
  if (request.method !== "GET") {
    return apiError("method_not_allowed", 405, request, env);
  }

  const user = await sessionUser(request, env);
  if (!user) {
    return apiError("unauthorized", 401, request, env);
  }
  if (user.role !== "admin") {
    return apiError("forbidden", 403, request, env, "Admin access required.");
  }

  const query = (url.searchParams.get("q") ?? "").trim().slice(0, 60);
  const users = await listUsersForAdmin(env.DB, query);

  return json({ users }, 200, request, env);
}

async function handleAdminRoles(request: Request, env: Env): Promise<Response> {
  if (request.method !== "POST") {
    return apiError("method_not_allowed", 405, request, env);
  }

  const user = await sessionUser(request, env);
  if (!user) {
    return apiError("unauthorized", 401, request, env);
  }
  if (user.role !== "admin") {
    return apiError("forbidden", 403, request, env, "Admin access required.");
  }

  const payload = await readJsonBody(request);
  if (!payload) {
    return apiError("invalid_body", 400, request, env);
  }

  const userId = field(payload, "userId", 80);
  const role = field(payload, "role", 16);

  if (!userId || (role !== "admin" && role !== "member")) {
    return apiError("invalid_body", 400, request, env, "A user and a valid role are required.");
  }
  if (userId === user.id) {
    return apiError("self_role", 400, request, env, "You cannot change your own role.");
  }

  const updated = await setUserRole(env.DB, userId, role);
  if (!updated) {
    return apiError("not_found", 404, request, env);
  }

  return json(
    { ok: true, user: { id: updated.id, role: updated.role === "admin" ? "admin" : "member" } },
    200,
    request,
    env,
  );
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
      } else if (url.pathname === "/api/community") {
        response =
          request.method === "GET"
            ? await handleCommunityList(request, env)
            : await handleCommunityCreate(request, env);
      } else if (url.pathname.startsWith("/api/community/")) {
        response = await handleCommunityDelete(
          request,
          env,
          url.pathname.slice("/api/community/".length),
        );
      } else if (url.pathname === "/api/social") {
        response = await handleSocialGet(request, env, url);
      } else if (url.pathname === "/api/social/react") {
        response = await handleSocialReact(request, env);
      } else if (url.pathname === "/api/social/comments") {
        response =
          request.method === "GET"
            ? await handleCommentsList(request, env, url)
            : await handleCommentsCreate(request, env);
      } else if (url.pathname === "/api/profile") {
        response =
          request.method === "PATCH"
            ? await handleProfileUpdate(request, env)
            : await handleProfile(request, env);
      } else if (url.pathname.startsWith("/api/users/")) {
        response = await handlePublicProfile(
          request,
          env,
          url.pathname.slice("/api/users/".length),
        );
      } else if (url.pathname === "/api/admin/users") {
        response = await handleAdminUsers(request, env, url);
      } else if (url.pathname === "/api/admin/roles") {
        response = await handleAdminRoles(request, env);
      } else if (url.pathname.startsWith("/api/social/comments/")) {
        const commentId = url.pathname.slice("/api/social/comments/".length);
        response =
          request.method === "PATCH"
            ? await handleCommentModerate(request, env, commentId)
            : await handleCommentDelete(request, env, commentId);
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
