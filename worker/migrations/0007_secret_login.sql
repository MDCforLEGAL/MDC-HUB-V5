-- Hashed client keys for the recovery login endpoint. Only failed attempts are stored.
CREATE TABLE IF NOT EXISTS secret_login_attempts (
  key TEXT PRIMARY KEY,
  failures INTEGER NOT NULL,
  reset_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS secret_login_attempts_reset_idx
  ON secret_login_attempts (reset_at);
