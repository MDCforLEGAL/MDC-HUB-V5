-- Community features: scripts published from the site, likes/dislikes and comments.

CREATE TABLE IF NOT EXISTS community_scripts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  game TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  code TEXT NOT NULL,
  tags TEXT NOT NULL DEFAULT '[]',
  hidden INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS community_scripts_created_idx
  ON community_scripts (created_at DESC);

CREATE INDEX IF NOT EXISTS community_scripts_user_idx
  ON community_scripts (user_id);

-- One row per user and script; value is 1 (like) or -1 (dislike).
CREATE TABLE IF NOT EXISTS script_reactions (
  script_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  value INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (script_id, user_id)
);

CREATE INDEX IF NOT EXISTS script_reactions_script_idx
  ON script_reactions (script_id);

CREATE TABLE IF NOT EXISTS script_comments (
  id TEXT PRIMARY KEY,
  script_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  body TEXT NOT NULL,
  hidden INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS script_comments_script_idx
  ON script_comments (script_id, created_at DESC);
