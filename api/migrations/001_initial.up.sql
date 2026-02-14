-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Users
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    display_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    is_moderator BOOLEAN NOT NULL DEFAULT FALSE,
    is_banned BOOLEAN NOT NULL DEFAULT FALSE,
    family_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_family ON users (family_id);

-- Lesson Plans
CREATE TABLE lesson_plans (
    id TEXT PRIMARY KEY,
    author_id TEXT NOT NULL REFERENCES users(id),
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    grade_level VARCHAR(50) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    activity_type VARCHAR(50) NOT NULL,
    duration_minutes INTEGER NOT NULL,
    materials TEXT[] NOT NULL DEFAULT '{}',
    instructions TEXT NOT NULL,
    objectives TEXT[] NOT NULL DEFAULT '{}',
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    scope VARCHAR(20) NOT NULL DEFAULT 'community',
    quarantine_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    vote_count INTEGER NOT NULL DEFAULT 0,
    view_count INTEGER NOT NULL DEFAULT 0,
    fork_count INTEGER NOT NULL DEFAULT 0,
    forked_from_id TEXT,
    family_id TEXT,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_lesson_plans_author ON lesson_plans (author_id);
CREATE INDEX idx_lesson_plans_status ON lesson_plans (status);
CREATE INDEX idx_lesson_plans_scope ON lesson_plans (scope);
CREATE INDEX idx_lesson_plans_quarantine ON lesson_plans (quarantine_status);
CREATE INDEX idx_lesson_plans_grade_level ON lesson_plans (grade_level);
CREATE INDEX idx_lesson_plans_subject ON lesson_plans (subject);
CREATE INDEX idx_lesson_plans_vote_count ON lesson_plans (vote_count);
CREATE INDEX idx_lesson_plans_published_at ON lesson_plans (published_at);
CREATE INDEX idx_lesson_plans_family ON lesson_plans (family_id);
-- Trigram index for duplicate detection
CREATE INDEX idx_lesson_plans_title_trgm ON lesson_plans USING gin (title gin_trgm_ops);

-- Tags
CREATE TABLE tags (
    id TEXT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    usage_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Lesson Plan Tags (junction)
CREATE TABLE lesson_plan_tags (
    lesson_plan_id TEXT NOT NULL REFERENCES lesson_plans(id) ON DELETE CASCADE,
    tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (lesson_plan_id, tag_id)
);

-- Votes
CREATE TABLE votes (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    lesson_plan_id TEXT NOT NULL REFERENCES lesson_plans(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, lesson_plan_id)
);

-- Comments
CREATE TABLE comments (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    lesson_plan_id TEXT NOT NULL REFERENCES lesson_plans(id) ON DELETE CASCADE,
    parent_comment_id TEXT,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_comments_lesson_plan ON comments (lesson_plan_id);
CREATE INDEX idx_comments_parent ON comments (parent_comment_id);

-- Moderation Queue
CREATE TABLE moderation_queue (
    id TEXT PRIMARY KEY,
    content_type VARCHAR(50) NOT NULL,
    content_id TEXT NOT NULL,
    reported_by TEXT REFERENCES users(id),
    reason TEXT,
    auto_flagged BOOLEAN NOT NULL DEFAULT FALSE,
    moderator_id TEXT REFERENCES users(id),
    resolution VARCHAR(20),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_moderation_queue_content ON moderation_queue (content_type, content_id);
CREATE INDEX idx_moderation_queue_unresolved ON moderation_queue (resolution);

-- Moderation Criteria
CREATE TABLE moderation_criteria (
    id TEXT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    evaluation_type VARCHAR(20) NOT NULL DEFAULT 'auto',
    evaluation_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Moderation Results
CREATE TABLE moderation_results (
    id TEXT PRIMARY KEY,
    lesson_plan_id TEXT NOT NULL REFERENCES lesson_plans(id) ON DELETE CASCADE,
    criterion_id TEXT NOT NULL REFERENCES moderation_criteria(id) ON DELETE CASCADE,
    passed BOOLEAN NOT NULL,
    reason TEXT,
    evaluated_by TEXT,
    evaluated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (lesson_plan_id, criterion_id)
);

CREATE INDEX idx_moderation_results_plan ON moderation_results (lesson_plan_id);

-- Collections
CREATE TABLE collections (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_public BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_collections_user ON collections (user_id);

-- Collection Items
CREATE TABLE collection_items (
    id TEXT PRIMARY KEY,
    collection_id TEXT NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    lesson_plan_id TEXT NOT NULL REFERENCES lesson_plans(id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (collection_id, lesson_plan_id)
);

-- Refresh Tokens
CREATE TABLE refresh_tokens (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens (user_id);
CREATE INDEX idx_refresh_tokens_hash ON refresh_tokens (token_hash);

-- Seed default moderation criteria
INSERT INTO moderation_criteria (id, name, description, evaluation_type, evaluation_order) VALUES
    ('crit_required_fields', 'Required Fields', 'Title >= 5 chars, description >= 20 chars, at least 1 objective', 'auto', 1),
    ('crit_text_length', 'Text Length', 'Instructions must be >= 50 characters', 'auto', 2),
    ('crit_profanity', 'Profanity Filter', 'Content must not contain profanity or inappropriate language', 'auto', 3),
    ('crit_duplicate', 'Duplicate Detection', 'Title similarity check via trigram to prevent duplicate content', 'auto', 4);
