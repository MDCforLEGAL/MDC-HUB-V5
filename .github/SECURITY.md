# Security Policy

## Supported versions

Security fixes are applied to the current `main` branch and the deployed
MDC HUB site/API. Older commits and forks are not supported unless they are
explicitly maintained by the project.

## Reporting a vulnerability

Please do **not** open a public issue for a security problem.

Use GitHub's private vulnerability reporting:

1. Open the repository's **Security** tab.
2. Choose **Report a vulnerability**.
3. Include the affected route or component, reproduction steps, impact, and
   any proof of concept that is safe to share.

If private reporting is unavailable, contact the maintainer through the
GitHub profile linked on the repository before disclosing anything publicly.

## Scope

Reports are especially useful for:

- authentication, session handling and the recovery login;
- role checks and account protection;
- D1 queries, authorization bypasses and data exposure;
- secret handling, CORS and request validation;
- dependency or supply-chain issues.

## Secrets

Never commit API tokens, OAuth client secrets, recovery codes, session tokens
or D1 credentials. Production secrets belong in GitHub Actions secrets and
Cloudflare Worker secrets, never in source, client code or build output.

### Session tokens

The browser keeps the session token in memory and persists only AES-GCM
ciphertext. The non-extractable AES key is stored in IndexedDB, so reading
`localStorage` alone does not reveal a usable token. Legacy plaintext tokens
are migrated to encrypted storage on the next page load.

### Firebase web API keys

`src/lib/firebase.ts` contains a Firebase **web** API key. Google documents
Firebase web API keys as public project identifiers, not authorization
secrets; access is controlled by Firebase Security Rules, App Check and API
key restrictions. GitHub secret scanning can still report them as public
leaks.

Before dismissing such an alert, verify in Google Cloud Console that the key
is restricted to the Firebase APIs this site uses and to the deployed
origins, and rotate any old key that is no longer needed. Never place a
service-account JSON key, OAuth client secret or Admin SDK credential in the
client source.
