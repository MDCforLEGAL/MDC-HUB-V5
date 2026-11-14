-- Anonymous presence rows power the 7/24 community counters on the home page.
-- A visitor id is random, stored by the browser; signed-in visitors also carry
-- their user id so registered and guest activity can be counted separately.

CREATE TABLE IF NOT EXISTS presence (
  visitor_id TEXT PRIMARY KEY,
  user_id TEXT,
  first_seen INTEGER NOT NULL,
  last_seen INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS presence_last_seen_idx ON presence (last_seen);
CREATE INDEX IF NOT EXISTS presence_user_idx ON presence (user_id);
