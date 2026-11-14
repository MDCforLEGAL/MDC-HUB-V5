import { randomToken, sha256Hex } from "./crypto";
import {
  createSession,
  findSessionUser,
  pruneExpired,
  toPublicUser,
  uniqueOAuthUsername,
  upsertOAuthUser,
} from "./db";
import type { Env } from "./env";
import { firebaseConfigured, verifyFirebaseIdToken } from "./firebase";
import { apiError, json } from "./http";

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_FIREBASE_TOKEN_BYTES = 8192;

function iso(timestamp: number): string {
  return new Date(timestamp).toISOString();
}

export async function handleFirebaseLogin(request: Request, env: Env): Promise<Response> {
  if (request.method !== "POST") {
    return apiError("method_not_allowed", 405, request, env);
  }
  if (!firebaseConfigured(env)) {
    return apiError(
      "auth_not_configured",
      503,
      request,
      env,
      "Google sign-in is not configured on this API yet.",
    );
  }

  const declaredLength = Number(request.headers.get("Content-Length") ?? "0");
  if (declaredLength > MAX_FIREBASE_TOKEN_BYTES) {
    return apiError("body_too_large", 413, request, env);
  }

  let payload: unknown;
  try {
    const body = await request.text();
    if (body.length > MAX_FIREBASE_TOKEN_BYTES) {
      return apiError("body_too_large", 413, request, env);
    }
    payload = JSON.parse(body);
  } catch {
    return apiError("invalid_body", 400, request, env);
  }

  const idToken =
    payload &&
    typeof payload === "object" &&
    typeof (payload as { idToken?: unknown }).idToken === "string"
      ? (payload as { idToken: string }).idToken.trim()
      : "";
  if (!idToken || idToken.length > MAX_FIREBASE_TOKEN_BYTES) {
    return apiError("invalid_token", 401, request, env);
  }

  let profile;
  try {
    profile = await verifyFirebaseIdToken(env, idToken);
  } catch (error) {
    console.error("firebase_token_failed", error);
    return apiError("invalid_token", 401, request, env, "Google sign-in could not be verified.");
  }

  try {
    const now = Date.now();
    const username = await uniqueOAuthUsername(env.DB, "google", profile.id, profile.username);
    const user = await upsertOAuthUser(
      env.DB,
      "google",
      { ...profile, username },
      "member",
      iso(now),
    );

    const token = randomToken(32);
    const tokenHash = await sha256Hex(token);
    const expiresAt = iso(now + SESSION_TTL_MS);
    await createSession(env.DB, tokenHash, user.id, iso(now), expiresAt);

    const session = await findSessionUser(env.DB, tokenHash, iso(now));
    if (!session) {
      return apiError("server_error", 500, request, env);
    }

    await pruneExpired(env.DB, iso(now)).catch((error) =>
      console.error("prune_failed", error),
    );

    return json({ token, expiresAt, user: toPublicUser(session) }, 200, request, env);
  } catch (error) {
    console.error("firebase_session_failed", error);
    return apiError("server_error", 500, request, env);
  }
}
