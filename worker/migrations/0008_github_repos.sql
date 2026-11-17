-- GitHub repository cards imported by signed-in members.
-- A repo is only visible on the public site after its owner publishes it.

ALTER TABLE users ADD COLUMN github_login TEXT;

CREATE TABLE IF NOT EXISTS github_repos (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  full_name TEXT NOT NULL,
  owner TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  html_url TEXT NOT NULL,
  homepage TEXT,
  language TEXT,
  stars INTEGER NOT NULL DEFAULT 0,
  forks INTEGER NOT NULL DEFAULT 0,
  topics TEXT NOT NULL DEFAULT '[]',
  is_public INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS github_repos_user_name_idx
  ON github_repos (user_id, full_name);

CREATE INDEX IF NOT EXISTS github_repos_public_idx
  ON github_repos (is_public, updated_at DESC);
