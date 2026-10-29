export interface Env {
  /** D1 database binding (see wrangler.jsonc). */
  DB: D1Database;

  /** Public Discord application id. */
  DISCORD_CLIENT_ID?: string;
  /** Discord application secret, stored with `wrangler secret put`. */
  DISCORD_CLIENT_SECRET?: string;

  /** Comma separated browser origins allowed to call this API. */
  SITE_ORIGINS?: string;
  /** Static site URL that receives the browser after a successful login. */
  SITE_REDIRECT_URL?: string;
  /** Comma separated Discord user ids that get the admin role. */
  ADMIN_DISCORD_IDS?: string;

  /** Override for local tests; defaults to https://discord.com/api. */
  DISCORD_API_BASE?: string;
}
