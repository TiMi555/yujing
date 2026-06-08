-- Yujing MVP schema

CREATE TABLE IF NOT EXISTS concept_keys (
  id SERIAL PRIMARY KEY,
  key VARCHAR(128) NOT NULL UNIQUE,
  canonical_name VARCHAR(256) NOT NULL,
  category VARCHAR(64) NOT NULL,
  synonyms JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stories (
  id SERIAL PRIMARY KEY,
  concept_key VARCHAR(128) NOT NULL REFERENCES concept_keys(key),
  version INT NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  title VARCHAR(256) NOT NULL,
  category VARCHAR(64) NOT NULL,
  concept_name VARCHAR(256) NOT NULL,
  story_content TEXT NOT NULL,
  academic_definition TEXT NOT NULL,
  metaphor_mappings JSONB NOT NULL DEFAULT '[]'::jsonb,
  reading_minutes INT NOT NULL DEFAULT 3,
  unlock_count INT NOT NULL DEFAULT 0,
  cover_image_url VARCHAR(512),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_stories_active_concept
  ON stories (concept_key) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_stories_unlock ON stories (unlock_count DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stories_created ON stories (created_at DESC);

CREATE TABLE IF NOT EXISTS generation_locks (
  concept_key VARCHAR(128) PRIMARY KEY,
  status VARCHAR(32) NOT NULL DEFAULT 'generating',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  openid VARCHAR(128) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_unlocks (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  device_id VARCHAR(64),
  story_id INT NOT NULL REFERENCES stories(id),
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT user_unlocks_user_story UNIQUE (user_id, story_id),
  CONSTRAINT user_unlocks_device_story UNIQUE (device_id, story_id)
);

CREATE INDEX IF NOT EXISTS idx_user_unlocks_user ON user_unlocks (user_id);
CREATE INDEX IF NOT EXISTS idx_user_unlocks_device ON user_unlocks (device_id);

CREATE TABLE IF NOT EXISTS generation_failures (
  id SERIAL PRIMARY KEY,
  concept_key VARCHAR(128),
  raw_input TEXT,
  error_message TEXT NOT NULL,
  raw_llm_output TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
