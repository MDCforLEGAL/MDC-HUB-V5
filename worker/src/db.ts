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
  verified: boolean;
  scripts: number;
}

/** Published scripts needed before a member earns the community blue check. */
export const VERIFIED_SCRIPTS_THRESHOLD = 5;

export function isVerifiedAuthor(role: string, scriptCount: number): boolean {
  return role === "admin" || scriptCount >= VERIFIED_SCRIPTS_THRESHOLD;
}

export function toPublicUser(row: UserRow & { script_count?: number }): PublicUser {
  const scripts = Number(row.script_count ?? 0);

  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name || row.username,
    avatarUrl: row.avatar_url,
    role: row.role === "admin" ? "admin" : "member",
    createdAt: row.created_at,
    verified: isVerifiedAuthor(row.role, scripts),
    scripts,
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
  script_count?: number;
}

export async function findSessionUser(
  db: D1Database,
  tokenHash: string,
  now: string,
): Promise<SessionRow | null> {
  const row = await db
    .prepare(
      `SELECT u.*, s.expires_at AS session_expires_at,
              (SELECT COUNT(*) FROM community_scripts c
                WHERE c.user_id = u.id AND c.hidden = 0) AS script_count
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

/* ------------------------------------------------------------------ */
/* Community scripts, reactions and comments                           */
/* ------------------------------------------------------------------ */

export interface PublicAuthor {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  role: "admin" | "member";
  verified: boolean;
  scripts: number;
}

export interface CommunityScriptRow {
  id: string;
  user_id: string;
  title: string;
  game: string;
  description: string;
  code: string;
  tags: string;
  created_at: string;
  updated_at: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  role: string;
  likes: number;
  dislikes: number;
  comments: number;
  author_scripts: number;
}

export interface PublicCommunityScript {
  id: string;
  title: string;
  game: string;
  description: string;
  code: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  author: PublicAuthor;
  likes: number;
  dislikes: number;
  comments: number;
}

function parseTags(value: string): string[] {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((tag): tag is string => typeof tag === "string").slice(0, 5);
  } catch {
    return [];
  }
}

export function toPublicAuthor(
  row: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    role: string;
  },
  scriptCount = 0,
): PublicAuthor {
  const scripts = Number(scriptCount ?? 0);

  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name || row.username,
    avatarUrl: row.avatar_url,
    role: row.role === "admin" ? "admin" : "member",
    verified: isVerifiedAuthor(row.role, scripts),
    scripts,
  };
}

export function toPublicCommunityScript(row: CommunityScriptRow): PublicCommunityScript {
  return {
    id: row.id,
    title: row.title,
    game: row.game,
    description: row.description,
    code: row.code,
    tags: parseTags(row.tags),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    author: toPublicAuthor(
      {
        id: row.user_id,
        username: row.username,
        display_name: row.display_name,
        avatar_url: row.avatar_url,
        role: row.role,
      },
      Number(row.author_scripts ?? 0),
    ),
    likes: Number(row.likes ?? 0),
    dislikes: Number(row.dislikes ?? 0),
    comments: Number(row.comments ?? 0),
  };
}

const COMMUNITY_SELECT = `
  SELECT s.id, s.user_id, s.title, s.game, s.description, s.code, s.tags,
         s.created_at, s.updated_at,
         u.username, u.display_name, u.avatar_url, u.role,
         (SELECT COUNT(*) FROM script_reactions r
           WHERE r.script_id = s.id AND r.value = 1) AS likes,
         (SELECT COUNT(*) FROM script_reactions r
           WHERE r.script_id = s.id AND r.value = -1) AS dislikes,
         (SELECT COUNT(*) FROM script_comments c
           WHERE c.script_id = s.id AND c.hidden = 0) AS comments,
         (SELECT COUNT(*) FROM community_scripts mine
           WHERE mine.user_id = s.user_id AND mine.hidden = 0) AS author_scripts
    FROM community_scripts s
    JOIN users u ON u.id = s.user_id
   WHERE s.hidden = 0`;

export interface NewCommunityScript {
  id: string;
  userId: string;
  title: string;
  game: string;
  description: string;
  code: string;
  tags: string[];
  now: string;
}

export async function createCommunityScript(
  db: D1Database,
  script: NewCommunityScript,
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO community_scripts
         (id, user_id, title, game, description, code, tags, hidden, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
    )
    .bind(
      script.id,
      script.userId,
      script.title,
      script.game,
      script.description,
      script.code,
      JSON.stringify(script.tags),
      script.now,
      script.now,
    )
    .run();
}

export async function listCommunityScripts(
  db: D1Database,
  limit = 200,
): Promise<CommunityScriptRow[]> {
  const result = await db
    .prepare(`${COMMUNITY_SELECT} ORDER BY s.created_at DESC LIMIT ?`)
    .bind(limit)
    .all<CommunityScriptRow>();

  return result.results ?? [];
}

export async function findCommunityScript(
  db: D1Database,
  id: string,
): Promise<CommunityScriptRow | null> {
  return (
    (await db
      .prepare(`${COMMUNITY_SELECT} AND s.id = ?`)
      .bind(id)
      .first<CommunityScriptRow>()) ?? null
  );
}

export async function deleteCommunityScript(db: D1Database, id: string): Promise<void> {
  await db.batch([
    db.prepare("DELETE FROM script_comments WHERE script_id = ?").bind(id),
    db.prepare("DELETE FROM script_reactions WHERE script_id = ?").bind(id),
    db.prepare("DELETE FROM community_scripts WHERE id = ?").bind(id),
  ]);
}

export interface SocialCounts {
  scriptId: string;
  likes: number;
  dislikes: number;
  comments: number;
}

export async function socialCounts(
  db: D1Database,
  ids: string[],
): Promise<SocialCounts[]> {
  if (ids.length === 0) return [];
  const placeholders = ids.map(() => "?").join(",");

  const [reactionRows, commentRows] = await Promise.all([
    db
      .prepare(
        `SELECT script_id, SUM(CASE WHEN value = 1 THEN 1 ELSE 0 END) AS likes,
                SUM(CASE WHEN value = -1 THEN 1 ELSE 0 END) AS dislikes
           FROM script_reactions
          WHERE script_id IN (${placeholders})
          GROUP BY script_id`,
      )
      .bind(...ids)
      .all<{ script_id: string; likes: number; dislikes: number }>(),
    db
      .prepare(
        `SELECT script_id, COUNT(*) AS total
           FROM script_comments
          WHERE hidden = 0 AND script_id IN (${placeholders})
          GROUP BY script_id`,
      )
      .bind(...ids)
      .all<{ script_id: string; total: number }>(),
  ]);

  const comments = new Map<string, number>();
  for (const row of commentRows.results ?? []) {
    comments.set(row.script_id, Number(row.total ?? 0));
  }

  const merged = new Map<string, SocialCounts>();
  for (const id of ids) {
    merged.set(id, { scriptId: id, likes: 0, dislikes: 0, comments: comments.get(id) ?? 0 });
  }
  for (const row of reactionRows.results ?? []) {
    merged.set(row.script_id, {
      scriptId: row.script_id,
      likes: Number(row.likes ?? 0),
      dislikes: Number(row.dislikes ?? 0),
      comments: comments.get(row.script_id) ?? 0,
    });
  }

  return ids.map((id) => merged.get(id)!).filter(Boolean);
}

/** Reactions of a single user, keyed by script id. */
export async function myReactions(
  db: D1Database,
  userId: string,
  ids: string[],
): Promise<Map<string, number>> {
  const reactions = new Map<string, number>();
  if (ids.length === 0) return reactions;

  const placeholders = ids.map(() => "?").join(",");
  const result = await db
    .prepare(
      `SELECT script_id, value FROM script_reactions
        WHERE user_id = ? AND script_id IN (${placeholders})`,
    )
    .bind(userId, ...ids)
    .all<{ script_id: string; value: number }>();

  for (const row of result.results ?? []) {
    reactions.set(row.script_id, Number(row.value));
  }
  return reactions;
}

/** value is 1 (like), -1 (dislike) or 0 (remove the reaction). */
export async function setReaction(
  db: D1Database,
  scriptId: string,
  userId: string,
  value: number,
  now: string,
): Promise<void> {
  if (value === 0) {
    await db
      .prepare("DELETE FROM script_reactions WHERE script_id = ? AND user_id = ?")
      .bind(scriptId, userId)
      .run();
    return;
  }

  await db
    .prepare(
      `INSERT INTO script_reactions (script_id, user_id, value, created_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(script_id, user_id) DO UPDATE SET
         value = excluded.value,
         created_at = excluded.created_at`,
    )
    .bind(scriptId, userId, value, now)
    .run();
}

export interface CommentRow {
  id: string;
  script_id: string;
  user_id: string;
  body: string;
  created_at: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  role: string;
  author_scripts: number;
}

export async function listComments(
  db: D1Database,
  scriptId: string,
  limit = 100,
): Promise<CommentRow[]> {
  const result = await db
    .prepare(
      `SELECT c.id, c.script_id, c.user_id, c.body, c.created_at,
              u.username, u.display_name, u.avatar_url, u.role,
              (SELECT COUNT(*) FROM community_scripts mine
                WHERE mine.user_id = c.user_id AND mine.hidden = 0) AS author_scripts
         FROM script_comments c
         JOIN users u ON u.id = c.user_id
        WHERE c.script_id = ? AND c.hidden = 0
        ORDER BY c.created_at DESC
        LIMIT ?`,
    )
    .bind(scriptId, limit)
    .all<CommentRow>();

  return result.results ?? [];
}

export async function findComment(
  db: D1Database,
  id: string,
): Promise<CommentRow | null> {
  return (
    (await db
      .prepare(
        `SELECT c.id, c.script_id, c.user_id, c.body, c.created_at,
                u.username, u.display_name, u.avatar_url, u.role
           FROM script_comments c
           JOIN users u ON u.id = c.user_id
          WHERE c.id = ?`,
      )
      .bind(id)
      .first<CommentRow>()) ?? null
  );
}

export async function createComment(
  db: D1Database,
  comment: { id: string; scriptId: string; userId: string; body: string; now: string },
): Promise<void> {
  await db
    .prepare(
      "INSERT INTO script_comments (id, script_id, user_id, body, hidden, created_at) VALUES (?, ?, ?, ?, 0, ?)",
    )
    .bind(comment.id, comment.scriptId, comment.userId, comment.body, comment.now)
    .run();
}

export async function deleteComment(
  db: D1Database,
  id: string,
  userId: string,
  isAdmin: boolean,
): Promise<"ok" | "forbidden" | "not_found"> {
  const row = await db
    .prepare("SELECT user_id FROM script_comments WHERE id = ?")
    .bind(id)
    .first<{ user_id: string }>();

  if (!row) return "not_found";
  if (!isAdmin && row.user_id !== userId) return "forbidden";

  await db.prepare("DELETE FROM script_comments WHERE id = ?").bind(id).run();
  return "ok";
}
