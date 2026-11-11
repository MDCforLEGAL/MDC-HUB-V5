-- Public profile bio and links.
ALTER TABLE users ADD COLUMN bio TEXT NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN links TEXT NOT NULL DEFAULT '[]';
