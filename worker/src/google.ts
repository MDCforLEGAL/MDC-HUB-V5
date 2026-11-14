import type { Env } from "./env";
import type { OAuthIdentity } from "./db";

const AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";

export function googleConfigured(env: Env): boolean {
  return Boolean(env.GOOGLE_CLIENT_ID?.trim() && env.GOOGLE_CLIENT_SECRET?.trim());
}

export function buildGoogleAuthorizeUrl(env: Env, state: string, redirectUri: string): string {
  const url = new URL(AUTHORIZE_URL);
  url.searchParams.set("client_id", env.GOOGLE_CLIENT_ID ?? "");
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", state);
  url.searchParams.set("access_type", "online");
  url.searchParams.set("include_granted_scopes", "true");
  url.searchParams.set("prompt", "select_account");
  return url.toString();
}

export async function exchangeGoogleCode(
  env: Env,
  code: string,
  redirectUri: string,
): Promise<string> {
  const body = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID ?? "",
    client_secret: env.GOOGLE_CLIENT_SECRET ?? "",
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
  });

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    throw new Error(`google_token_${response.status}`);
  }

  const payload = (await response.json()) as { access_token?: string };
  if (!payload.access_token) throw new Error("google_token_missing");
  return payload.access_token;
}

export async function fetchGoogleProfile(accessToken: string): Promise<OAuthIdentity> {
  const response = await fetch(USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`google_user_${response.status}`);
  }

  const profile = (await response.json()) as {
    sub?: string;
    email?: string;
    email_verified?: boolean;
    name?: string;
    picture?: string;
  };

  if (!profile.sub) throw new Error("google_user_incomplete");
  if (profile.email_verified === false) throw new Error("google_email_unverified");

  const email = typeof profile.email === "string" ? profile.email.trim() : "";
  const localPart = email.split("@")[0]?.trim() || "";
  const username = localPart || `google_${profile.sub.slice(0, 8)}`;
  const displayName = (profile.name || localPart || "Google user").trim().slice(0, 80);

  return {
    id: profile.sub,
    username,
    displayName,
    avatarUrl:
      typeof profile.picture === "string" && profile.picture.startsWith("https://")
        ? profile.picture
        : null,
  };
}
