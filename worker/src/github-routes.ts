import { randomToken, sha256Hex, timingSafeEqual } from "./crypto";
import {
  createLoginCode,
  createOAuthState,
  consumeOAuthState,
  findSessionUser,
  listPublicGithubRepos,
  listUserGithubRepos,
  pruneExpired,
  setGithubLogin,
  setGithubRepoPublic,
  toGithubRepo,
  toPublicUser,
  uniqueOAuthUsername,
  upsertGithubRepo,
  upsertOAuthUser,
  deleteGithubRepo,
} from "./db";
import type { SessionRow } from "./db";
import type { Env } from "./env";
import {
  buildGithubAuthorizeUrl,
  exchangeGithubCode,
  fetchGithubProfile,
  fetchGithubRepo,
  githubConfigured,
  listGithubRepos,
} from "./github";
import {
  apiError,
  clearCookie,
  json,
  readCookie,
  redirect,
  serializeCookie,
} from "./http";

const LOGIN_CODE_TTL_MS = 60 * 1000;
const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;
const STATE_COOKIE = "mdc_oauth";
const STATE_COOKIE_PATH = "/auth";
const MAX_JSON_BYTES = 4096;
const REPO_PATTERN = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;

function iso(timestamp: number): string {
  return new Date(timestamp).toISOString();
}

function callbackUrl(request: Request): string {
  return `${new URL(request.url).origin}/auth/github/callback`;
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
  if (!target) {
    return new Response("SITE_REDIRECT_URL is not configured on this API.", { status: 500 });
  }
  return redirect(target, { "Set-Cookie": cookie });
}

function adminRole(env: Env, id: string, login: string): "admin" | "member" {
  const ids = (env.ADMIN_DISCORD_IDS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const names = (env.ADMIN_USERNAMES ?? "")
    .split(",")
    .map((value) => value.trim().replace(/^@/, "").toLowerCase())
    .filter(Boolean);
  return ids.includes(id) || names.includes(login.toLowerCase()) ? "admin" : "member";
}

function bearerToken(request: Request): string | null {
  const header = request.headers.get("Authorization");
  if (!header) return null;
  const [scheme, value] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !value) return null;
  return /^[a-f0-9]{64}$/.test(value) ? value : null;
}

async function sessionUser(request: Request, env: Env): Promise<SessionRow | null> {
  const token = bearerToken(request);
  if (!token) return null;
  return findSessionUser(env.DB, await sha256Hex(token), iso(Date.now()));
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

function field(payload: unknown, name: string, max: number): string {
  if (!payload || typeof payload !== "object") return "";
  const value = (payload as Record<string, unknown>)[name];
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function handleGithubAuthStart(
  request: Request,
  env: Env,
): Promise<Response> {
  if (request.method !== "GET") {
    return apiError("method_not_allowed", 405, request, env);
  }
  if (!githubConfigured(env)) {
    return apiError(
      "auth_not_configured",
      503,
      request,
      env,
      "GitHub login is not configured on this API yet.",
    );
  }

  const state = randomToken(24);
  const now = Date.now();
  await createOAuthState(env.DB, state, iso(now), iso(now + OAUTH_STATE_TTL_MS));

  const response = redirect(buildGithubAuthorizeUrl(env, state, callbackUrl(request)));
  response.headers.append(
    "Set-Cookie",
    serializeCookie(STATE_COOKIE, state, {
      maxAge: OAUTH_STATE_TTL_MS / 1000,
      path: STATE_COOKIE_PATH,
      secure: new URL(request.url).protocol === "https:",
    }),
  );
  return response;
}

export async function handleGithubAuthCallback(
  request: Request,
  env: Env,
): Promise<Response> {
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
  if (!code || !githubConfigured(env)) {
    return redirectToSiteError(env, "config", clearedCookie);
  }

  try {
    const accessToken = await exchangeGithubCode(env, code, callbackUrl(request));
    const profile = await fetchGithubProfile(accessToken);
    const username = await uniqueOAuthUsername(env.DB, "github", profile.id, profile.username);
    const user = await upsertOAuthUser(
      env.DB,
      "github",
      { ...profile, username },
      adminRole(env, profile.id, profile.username),
      iso(now),
    );
    await setGithubLogin(env.DB, user.id, profile.username);

    const loginCode = randomToken(32);
    await createLoginCode(
      env.DB,
      await sha256Hex(loginCode),
      user.id,
      iso(now),
      iso(now + LOGIN_CODE_TTL_MS),
    );

    const target = siteRedirect(env, "mdc_auth", loginCode);
    if (!target) return redirectToSiteError(env, "config", clearedCookie);

    await pruneExpired(env.DB, iso(now)).catch((error) =>
      console.error("prune_failed", error),
    );
    return redirect(target, { "Set-Cookie": clearedCookie });
  } catch (error) {
    console.error("github_callback_failed", error);
    return redirectToSiteError(env, "server", clearedCookie);
  }
}

export async function handleGithubRepoCandidates(
  request: Request,
  env: Env,
): Promise<Response> {
  if (request.method !== "GET") {
    return apiError("method_not_allowed", 405, request, env);
  }
  const user = await sessionUser(request, env);
  if (!user) {
    return apiError("unauthorized", 401, request, env, "Sign in to list your repositories.");
  }
  if (!user.github_login) {
    return apiError(
      "github_login_required",
      403,
      request,
      env,
      "Sign in with GitHub to import repositories.",
    );
  }

  try {
    const repos = await listGithubRepos(user.github_login);
    return json({ repos }, 200, request, env);
  } catch (error) {
    console.error("github_repos_failed", error);
    return apiError("github_unavailable", 502, request, env);
  }
}

export async function handleGithubPublicRepos(
  request: Request,
  env: Env,
): Promise<Response> {
  if (request.method !== "GET") {
    return apiError("method_not_allowed", 405, request, env);
  }
  const rows = await listPublicGithubRepos(env.DB);
  return json({ repos: rows.map(toGithubRepo) }, 200, request, env);
}

export async function handleGithubMyRepos(
  request: Request,
  env: Env,
): Promise<Response> {
  if (request.method !== "GET") {
    return apiError("method_not_allowed", 405, request, env);
  }
  const user = await sessionUser(request, env);
  if (!user) {
    return apiError("unauthorized", 401, request, env, "Sign in to see your repositories.");
  }
  const rows = await listUserGithubRepos(env.DB, user.id);
  return json({ repos: rows.map(toGithubRepo) }, 200, request, env);
}

export async function handleGithubRepoImport(
  request: Request,
  env: Env,
): Promise<Response> {
  if (request.method !== "POST") {
    return apiError("method_not_allowed", 405, request, env);
  }
  const user = await sessionUser(request, env);
  if (!user) {
    return apiError("unauthorized", 401, request, env, "Sign in to import a repository.");
  }
  if (!user.github_login) {
    return apiError(
      "github_login_required",
      403,
      request,
      env,
      "Sign in with GitHub to import repositories.",
    );
  }

  const payload = await readJsonBody(request);
  const fullName = field(payload, "fullName", 140);
  if (!REPO_PATTERN.test(fullName)) {
    return apiError("invalid_repo", 400, request, env);
  }

  try {
    const repo = await fetchGithubRepo(fullName);
    if (repo.private || repo.owner.toLowerCase() !== user.github_login.toLowerCase()) {
      return apiError(
        "repo_not_owned",
        403,
        request,
        env,
        "Only your own public repositories can be imported.",
      );
    }

    const row = await upsertGithubRepo(env.DB, {
      id: randomToken(16),
      userId: user.id,
      fullName: repo.fullName,
      owner: repo.owner,
      name: repo.name,
      description: repo.description,
      htmlUrl: repo.htmlUrl,
      homepage: repo.homepage,
      language: repo.language,
      stars: repo.stars,
      forks: repo.forks,
      topics: repo.topics,
      now: iso(Date.now()),
    });

    return json({ repo: toGithubRepo(row) }, 200, request, env);
  } catch (error) {
    console.error("github_repo_import_failed", error);
    return apiError("github_unavailable", 502, request, env);
  }
}

export async function handleGithubRepoUpdate(
  request: Request,
  env: Env,
  id: string,
): Promise<Response> {
  const user = await sessionUser(request, env);
  if (!user) {
    return apiError("unauthorized", 401, request, env, "Sign in to manage your repositories.");
  }
  if (!id || id.length > 80) {
    return apiError("not_found", 404, request, env);
  }

  if (request.method === "DELETE") {
    const removed = await deleteGithubRepo(env.DB, id, user.id);
    if (!removed) return apiError("not_found", 404, request, env);
    return json({ ok: true }, 200, request, env);
  }

  if (request.method !== "PATCH") {
    return apiError("method_not_allowed", 405, request, env);
  }

  const payload = await readJsonBody(request);
  if (!payload || typeof payload !== "object") {
    return apiError("invalid_body", 400, request, env);
  }
  const isPublic = (payload as { public?: unknown }).public;
  if (typeof isPublic !== "boolean") {
    return apiError("invalid_body", 400, request, env);
  }

  const row = await setGithubRepoPublic(
    env.DB,
    id,
    user.id,
    isPublic,
    iso(Date.now()),
  );
  if (!row) return apiError("not_found", 404, request, env);
  return json({ repo: toGithubRepo(row) }, 200, request, env);
}

export function githubUser(user: SessionRow) {
  return toPublicUser(user);
}
