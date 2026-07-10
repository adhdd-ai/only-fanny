-- Complete database schema

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Agencies
CREATE TABLE agencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT DEFAULT 'Amber Agency',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Creators
CREATE TABLE creators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID REFERENCES agencies(id),
    display_name TEXT DEFAULT 'Amber',
    persona_settings JSONB DEFAULT '{}',
    automation_level TEXT DEFAULT 'draft_only',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default
INSERT INTO agencies (name) VALUES ('Amber Agency');
INSERT INTO creators (agency_id, display_name) 
SELECT id, 'Amber' FROM agencies LIMIT 1;

-- Fans
CREATE TABLE fans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID REFERENCES creators(id),
    platform_fan_id TEXT UNIQUE,
    display_name TEXT,
    real_name TEXT,
    location TEXT,
    age INTEGER,
    occupation TEXT,
    value_score NUMERIC DEFAULT 0,
    risk_score NUMERIC DEFAULT 0,
    preferences JSONB DEFAULT '{}',
    schedule JSONB DEFAULT '{}',
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Threads
CREATE TABLE fan_threads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID REFERENCES creators(id),
    fan_id UUID REFERENCES fans(id),
    status TEXT DEFAULT 'open',
    current_stage TEXT DEFAULT 'opening',
    priority_score NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    thread_id UUID REFERENCES fan_threads(id),
    sender_type TEXT,
    direction TEXT,
    content TEXT,
    status TEXT DEFAULT 'sent',
    sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- Memories
CREATE TABLE fan_memories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fan_id UUID REFERENCES fans(id),
    memory_type TEXT,
    content TEXT,
    confidence NUMERIC DEFAULT 0.9,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Decisions
CREATE TABLE ai_decisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    thread_id UUID REFERENCES fan_threads(id),
    decision_type TEXT,
    confidence NUMERIC,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create test fan
INSERT INTO fans (creator_id, platform_fan_id, display_name, real_name, location)
SELECT c.id, 'test_user', 'TestUser', 'Mike', 'Texas'
FROM creators c LIMIT 1;

INSERT INTO fan_threads (creator_id, fan_id, current_stage)
SELECT c.id, f.id, 'opening'
FROM creators c, fans f
WHERE f.platform_fan_id = 'test_user';
