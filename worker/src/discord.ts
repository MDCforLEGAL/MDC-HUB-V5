import type { Env } from "./env";
import type { DiscordIdentity } from "./db";

const DEFAULT_API_BASE = "https://discord.com/api";

export function discordConfigured(env: Env): boolean {
  return Boolean(env.DISCORD_CLIENT_ID?.trim() && env.DISCORD_CLIENT_SECRET?.trim());
}

function apiBase(env: Env): string {
  return (env.DISCORD_API_BASE || DEFAULT_API_BASE).replace(/\/+$/, "");
}

export function buildAuthorizeUrl(env: Env, state: string, redirectUri: string): string {
  const url = new URL("https://discord.com/oauth2/authorize");
  url.searchParams.set("client_id", env.DISCORD_CLIENT_ID ?? "");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", "identify");
  url.searchParams.set("state", state);
  url.searchParams.set("prompt", "consent");
  return url.toString();
}

export async function exchangeDiscordCode(
  env: Env,
  code: string,
  redirectUri: string,
): Promise<string> {
  const body = new URLSearchParams({
    client_id: env.DISCORD_CLIENT_ID ?? "",
    client_secret: env.DISCORD_CLIENT_SECRET ?? "",
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
  });

  const response = await fetch(`${apiBase(env)}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    throw new Error(`discord_token_${response.status}`);
  }

  const payload = (await response.json()) as { access_token?: string };
  if (!payload.access_token) throw new Error("discord_token_missing");
  return payload.access_token;
}

function defaultAvatarIndex(id: string): number {
  try {
    return Number((BigInt(id) >> 22n) % 6n);
  } catch {
    return 0;
  }
}

export async function fetchDiscordProfile(env: Env, accessToken: string): Promise<DiscordIdentity> {
  const response = await fetch(`${apiBase(env)}/users/@me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`discord_user_${response.status}`);
  }

  const profile = (await response.json()) as {
    id?: string;
    username?: string;
    global_name?: string | null;
    avatar?: string | null;
  };

  if (!profile.id || !profile.username) throw new Error("discord_user_incomplete");

  return {
    id: profile.id,
    username: profile.username,
    displayName: (profile.global_name || profile.username).trim(),
    avatarUrl: profile.avatar
      ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png?size=160`
      : `https://cdn.discordapp.com/embed/avatars/${defaultAvatarIndex(profile.id)}.png`,
  };
}
