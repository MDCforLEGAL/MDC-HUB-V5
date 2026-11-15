export interface Env {
  /** D1 database binding (see wrangler.jsonc). */
  DB: D1Database;

  /** Public Discord application id. */
  DISCORD_CLIENT_ID?: string;
  /** Discord application secret, stored with `wrangler secret put`. */
  DISCORD_CLIENT_SECRET?: string;

  /** Firebase project id used to verify Google ID tokens. */
  FIREBASE_PROJECT_ID?: string;

  /** Server-side recovery code for the hidden login. Set with `wrangler secret put`. */
  SECRET_LOGIN_CODE?: string;
  /** Account that receives the recovery session; defaults to the protected owner account. */
  SECRET_LOGIN_USER_ID?: string;

  /** Comma separated browser origins allowed to call this API. */
  SITE_ORIGINS?: string;
  /** Static site URL that receives the browser after a successful login. */
  SITE_REDIRECT_URL?: string;
  /** Comma separated Discord user ids that get the admin role. */
  ADMIN_DISCORD_IDS?: string;
  /** Comma separated Discord usernames (with or without @) that get the admin role. */
  ADMIN_USERNAMES?: string;

  /** Override for local tests; defaults to https://discord.com/api. */
  DISCORD_API_BASE?: string;
}
