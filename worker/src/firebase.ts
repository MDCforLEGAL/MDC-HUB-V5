import type { Env } from "./env";
import type { OAuthIdentity } from "./db";

const JWKS_URL =
  "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";
const KEY_CACHE_MS = 55 * 60 * 1000;
const CLOCK_SKEW_SECONDS = 60;

type FirebaseJwk = JsonWebKey & { kid?: string };

interface CachedKeys {
  fetchedAt: number;
  keys: Map<string, FirebaseJwk>;
}

let cachedKeys: CachedKeys | null = null;

export function firebaseProjectId(env: Env): string | null {
  const projectId = env.FIREBASE_PROJECT_ID?.trim();
  return projectId || null;
}

export function firebaseConfigured(env: Env): boolean {
  return Boolean(firebaseProjectId(env));
}

function decodeBase64Url(value: string): Uint8Array {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function decodeJson<T>(value: string): T {
  return JSON.parse(new TextDecoder().decode(decodeBase64Url(value))) as T;
}

async function loadKeys(forceRefresh: boolean): Promise<Map<string, FirebaseJwk>> {
  if (!forceRefresh && cachedKeys && Date.now() - cachedKeys.fetchedAt < KEY_CACHE_MS) {
    return cachedKeys.keys;
  }

  const response = await fetch(JWKS_URL, { headers: { Accept: "application/json" } });
  if (!response.ok) {
    throw new Error(`firebase_jwks_${response.status}`);
  }

  const payload = (await response.json()) as { keys?: FirebaseJwk[] };
  const keys = new Map<string, FirebaseJwk>();
  for (const key of payload.keys ?? []) {
    if (key.kid) keys.set(key.kid, key);
  }
  if (keys.size === 0) throw new Error("firebase_jwks_empty");

  cachedKeys = { fetchedAt: Date.now(), keys };
  return keys;
}

interface FirebaseClaims {
  iss?: unknown;
  aud?: unknown;
  sub?: unknown;
  exp?: unknown;
  iat?: unknown;
  name?: unknown;
  email?: unknown;
  email_verified?: unknown;
  picture?: unknown;
  firebase?: { sign_in_provider?: unknown };
}

/**
 * Verifies a Firebase ID token with Google's public signing keys.
 * The token is only accepted from the configured project and Google provider.
 */
export async function verifyFirebaseIdToken(env: Env, idToken: string): Promise<OAuthIdentity> {
  const projectId = firebaseProjectId(env);
  if (!projectId) throw new Error("firebase_not_configured");

  const segments = idToken.split(".");
  if (segments.length !== 3) throw new Error("firebase_token_malformed");

  const header = decodeJson<{ alg?: unknown; kid?: unknown }>(segments[0]);
  const claims = decodeJson<FirebaseClaims>(segments[1]);

  if (header.alg !== "RS256" || typeof header.kid !== "string" || !header.kid) {
    throw new Error("firebase_token_header");
  }

  let keys = await loadKeys(false);
  let jwk = keys.get(header.kid);
  if (!jwk) {
    // Google rotates keys; retry once without the cached set.
    keys = await loadKeys(true);
    jwk = keys.get(header.kid);
  }
  if (!jwk) throw new Error("firebase_key_unknown");

  const key = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"],
  );

  const valid = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    key,
    decodeBase64Url(segments[2]),
    new TextEncoder().encode(`${segments[0]}.${segments[1]}`),
  );
  if (!valid) throw new Error("firebase_signature_invalid");

  const now = Math.floor(Date.now() / 1000);
  if (typeof claims.exp !== "number" || claims.exp <= now) {
    throw new Error("firebase_token_expired");
  }
  if (typeof claims.iat !== "number" || claims.iat > now + CLOCK_SKEW_SECONDS) {
    throw new Error("firebase_token_issued_at");
  }
  if (
    claims.iss !== `https://securetoken.google.com/${projectId}` ||
    claims.aud !== projectId
  ) {
    throw new Error("firebase_token_project");
  }
  if (claims.firebase?.sign_in_provider !== "google.com") {
    throw new Error("firebase_token_provider");
  }
  if (typeof claims.sub !== "string" || !claims.sub) {
    throw new Error("firebase_token_subject");
  }
  if (claims.email_verified === false) {
    throw new Error("firebase_email_unverified");
  }

  const email = typeof claims.email === "string" ? claims.email.trim() : "";
  const localPart = email.split("@")[0]?.trim() || "";
  const username = localPart || `google_${claims.sub.slice(0, 8)}`;
  const displayName = (
    (typeof claims.name === "string" && claims.name.trim()) ||
    localPart ||
    "Google user"
  )
    .trim()
    .slice(0, 80);

  return {
    id: claims.sub,
    username,
    displayName,
    avatarUrl:
      typeof claims.picture === "string" && claims.picture.startsWith("https://")
        ? claims.picture
        : null,
  };
}
