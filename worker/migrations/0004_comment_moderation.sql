-- Comment moderation: admins can hide or restore comments without deleting them.

ALTER TABLE script_comments ADD COLUMN moderated_by TEXT;
ALTER TABLE script_comments ADD COLUMN moderated_at TEXT;

CREATE INDEX IF NOT EXISTS script_comments_visible_idx
  ON script_comments (script_id, hidden, created_at DESC);
