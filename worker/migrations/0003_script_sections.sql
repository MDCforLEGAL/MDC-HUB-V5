-- Separate the official MDC library from member uploads. Existing admin
-- publications were the MDC HUB scripts, so they move to the MDC section.

ALTER TABLE community_scripts ADD COLUMN section TEXT NOT NULL DEFAULT 'community';

UPDATE community_scripts
   SET section = 'mdc'
 WHERE user_id IN (SELECT id FROM users WHERE role = 'admin');

CREATE INDEX IF NOT EXISTS community_scripts_section_idx
  ON community_scripts (section, created_at DESC);
