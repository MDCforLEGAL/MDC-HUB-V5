export interface UserRow {
  id: string;
  provider: string;
  provider_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  role: string;
  created_at: string;
  last_login_at: string;
}

export interface PublicUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  role: "admin" | "member";
  createdAt: string;
}

export function toPublicUser(row: UserRow): PublicUser {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name || row.username,
    avatarUrl: row.avatar_url,
    role: row.role === "admin" ? "admin" : "member",
    createdAt: row.created_at,
  };
}

export interface DiscordIdentity {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

export async function upsertDiscordUser(
  db: D1Database,
  identity: DiscordIdentity,
  role: "admin" | "member",
  now: string,
): Promise<UserRow> {
  const row = await db
    .prepare(
      `INSERT INTO users
         (id, provider, provider_id, username, display_name, avatar_url, role, created_at, last_login_at)
       VALUES (?, 'discord', ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         username = excluded.username,
         display_name = excluded.display_name,
         avatar_url = excluded.avatar_url,
         last_login_at = excluded.last_login_at,
         role = CASE WHEN excluded.role = 'admin' THEN 'admin' ELSE users.role END
       RETURNING *`,
    )
    .bind(
      `discord:${identity.id}`,
      identity.id,
      identity.username,
      identity.displayName,
      identity.avatarUrl,
      role,
      now,
      now,
    )
    .first<UserRow>();

  if (!row) throw new Error("user_upsert_failed");
  return row;
}

export async function createOAuthState(
  db: D1Database,
  state: string,
  now: string,
  expiresAt: string,
): Promise<void> {
  await db
    .prepare("INSERT INTO oauth_states (state, created_at, expires_at) VALUES (?, ?, ?)")
    .bind(state, now, expiresAt)
    .run();
}

/** Atomically removes and validates a state value, so it can only be used once. */
export async function consumeOAuthState(
  db: D1Database,
  state: string,
  now: string,
): Promise<boolean> {
  const row = await db
    .prepare("DELETE FROM oauth_states WHERE state = ? AND expires_at > ? RETURNING state")
    .bind(state, now)
    .first<{ state: string }>();

  return Boolean(row);
}

export async function createLoginCode(
  db: D1Database,
  codeHash: string,
  userId: string,
  now: string,
  expiresAt: string,
): Promise<void> {
  await db
    .prepare("INSERT INTO login_codes (code_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)")
    .bind(codeHash, userId, now, expiresAt)
    .run();
}

/** Atomically consumes a one-time login code and returns its user id. */
export async function consumeLoginCode(
  db: D1Database,
  codeHash: string,
  now: string,
): Promise<string | null> {
  const row = await db
    .prepare(
      "DELETE FROM login_codes WHERE code_hash = ? AND expires_at > ? RETURNING user_id",
    )
    .bind(codeHash, now)
    .first<{ user_id: string }>();

  return row?.user_id ?? null;
}

export async function createSession(
  db: D1Database,
  tokenHash: string,
  userId: string,
  now: string,
  expiresAt: string,
): Promise<void> {
  await db
    .prepare("INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)")
    .bind(tokenHash, userId, now, expiresAt)
    .run();
}

export interface SessionRow extends UserRow {
  session_expires_at: string;
}

export async function findSessionUser(
  db: D1Database,
  tokenHash: string,
  now: string,
): Promise<SessionRow | null> {
  const row = await db
    .prepare(
      `SELECT u.*, s.expires_at AS session_expires_at
         FROM sessions s
         JOIN users u ON u.id = s.user_id
        WHERE s.token_hash = ? AND s.expires_at > ?`,
    )
    .bind(tokenHash, now)
    .first<SessionRow>();

  return row ?? null;
}

export async function touchSession(
  db: D1Database,
  tokenHash: string,
  expiresAt: string,
): Promise<void> {
  await db.prepare("UPDATE sessions SET expires_at = ? WHERE token_hash = ?").bind(expiresAt, tokenHash).run();
}

export async function deleteSession(db: D1Database, tokenHash: string): Promise<void> {
  await db.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(tokenHash).run();
}

export async function pruneExpired(db: D1Database, now: string): Promise<void> {
  await db.batch([
    db.prepare("DELETE FROM sessions WHERE expires_at <= ?").bind(now),
    db.prepare("DELETE FROM login_codes WHERE expires_at <= ?").bind(now),
    db.prepare("DELETE FROM oauth_states WHERE expires_at <= ?").bind(now),
  ]);
}
