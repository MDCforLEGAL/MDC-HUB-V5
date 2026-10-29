# MDC HUB API (Cloudflare Worker + D1)

Discord-only account service for the static MDC HUB site. The Worker owns the
Discord client secret, exchanges the OAuth code, stores users and issues bearer
sessions. The site never talks to Discord directly.

## Files

| Path | Purpose |
| --- | --- |
| `src/index.ts` | Router, OAuth flow, CORS, session endpoints |
| `src/discord.ts` | Authorize URL, token exchange, profile fetch |
| `src/db.ts` | D1 queries (users, sessions, login codes, OAuth states) |
| `src/crypto.ts` | Random tokens, SHA-256 hashing, constant-time compare |
| `src/http.ts` | CORS, JSON, cookie and redirect helpers |
| `migrations/0001_auth.sql` | D1 schema |
| `wrangler.jsonc` | Bindings, public vars, D1 id |

## Flow

1. The site opens `GET /auth/discord`.
2. The Worker creates a single-use `state`, stores it in D1 and in an HttpOnly
   `mdc_oauth` cookie, then redirects to Discord (`identify` scope only).
3. Discord returns to `/auth/discord/callback`. The Worker checks the cookie and
   D1 state, exchanges the code, reads `/users/@me`, upserts the user and creates
   a 60-second one-time login code.
4. The Worker redirects to `SITE_REDIRECT_URL#mdc_auth=<code>`. The static site
   reads the fragment, calls `POST /auth/exchange` and stores the returned bearer
   token in `localStorage`.
5. `GET /api/me` and `POST /auth/logout` authenticate with
   `Authorization: Bearer <token>`. Only the token hash is stored in D1.

## Local testing

```bash
npm run db:migrate:local
npm run worker:dev
curl -s http://127.0.0.1:8787/health
```

Without Discord credentials the API reports `"discord": false` and
`/auth/discord` returns `503 auth_not_configured`; the other endpoints still run.
For a full local round trip, add a real Discord application and its redirect URI:

```bash
cp worker/.dev.vars.example worker/.dev.vars
# fill DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET
npm run worker:dev
```

The redirect URI must exactly match the deployed origin, for example
`http://127.0.0.1:8787/auth/discord/callback` locally and
`https://<worker>.<subdomain>.workers.dev/auth/discord/callback` in production.

## Configuration

Set these in `wrangler.jsonc`:

- `DISCORD_CLIENT_ID` — public application id.
- `SITE_ORIGINS` — comma separated browser origins, no paths.
- `SITE_REDIRECT_URL` — the static site URL that receives the login code.
- `ADMIN_DISCORD_IDS` — comma separated Discord ids that become `admin`.

Store the secret outside the repository:

```bash
npx wrangler secret put DISCORD_CLIENT_SECRET --config worker/wrangler.jsonc
```

`DISCORD_API_BASE` is an optional override for automated tests; leave it unset in
production.

## Troubleshooting

| Symptom | Cause |
| --- | --- |
| Login dialog: “Account service not connected yet” | `public/config.json` has no `apiBaseUrl` |
| Login dialog: “Discord login is not active yet” | `/health` says `discord: false`; client id or secret missing |
| `503 auth_not_configured` | `DISCORD_CLIENT_ID` or `DISCORD_CLIENT_SECRET` missing |
| Discord shows `redirect_uri` mismatch | The registered redirect URI differs from `/auth/discord/callback` on the deployed origin |
| Browser blocks the API call | The site origin is missing from `SITE_ORIGINS` |
| `invalid_code` after login | The 60-second code expired or was already used; start again |
| `state` error | The state cookie was blocked, expired, or the login started in another tab |

## Notes

- No email, password, SMTP or paid auth service is involved. Discord is free and
  D1/Workers free quotas (100k requests/day, 5 GB D1) are far above this site's
  needs.
- There is no built-in rate limiter. Tokens are 256-bit random values and login
  codes expire in 60 seconds, so brute force is impractical; add a Cloudflare WAF
  rule if the API is ever targeted.
- Sessions live in D1, so revoking one deletes a row and does not require any
  client-side secret rotation.
