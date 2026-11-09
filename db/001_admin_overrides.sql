-- Run once after backing up the existing Neon database.
-- Do NOT alter existing Toolnet tables, published videos or movie sources.
CREATE SCHEMA IF NOT EXISTS phe_admin;

CREATE TABLE IF NOT EXISTS phe_admin.movie_overrides (
    slug TEXT PRIMARY KEY,
    title_override TEXT,
    poster_override TEXT,
    hidden BOOLEAN NOT NULL DEFAULT FALSE,
    version BIGINT NOT NULL DEFAULT 0,
    updated_by TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT title_override_length CHECK (title_override IS NULL OR char_length(title_override) BETWEEN 1 AND 180),
    CONSTRAINT poster_override_https CHECK (poster_override IS NULL OR poster_override LIKE 'https://%')
);

CREATE TABLE IF NOT EXISTS phe_admin.movie_audit_log (
    id BIGSERIAL PRIMARY KEY,
    slug TEXT NOT NULL,
    actor_id TEXT NOT NULL,
    action TEXT NOT NULL,
    before_json JSONB NOT NULL,
    after_json JSONB NOT NULL,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_movie_audit_slug_time ON phe_admin.movie_audit_log (slug, changed_at DESC);
