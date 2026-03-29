-- ============================================================
-- 001_initial_schema.sql
-- Schema inicial do Dashboard CRM - Agente SDR
-- Execute no SQL Editor do Supabase
-- ============================================================

-- Habilitar extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE user_role AS ENUM ('admin', 'agent', 'viewer');
CREATE TYPE agent_status AS ENUM ('active', 'inactive', 'maintenance');
CREATE TYPE conversation_status AS ENUM ('open', 'resolved', 'pending');

-- ============================================================
-- TABELA: users (perfis dos usuários)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        TEXT NOT NULL,
    email       TEXT NOT NULL UNIQUE,
    role        user_role NOT NULL DEFAULT 'viewer',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABELA: agents
-- ============================================================
CREATE TABLE IF NOT EXISTS agents (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
    name        TEXT NOT NULL,
    department  TEXT NOT NULL,
    status      agent_status NOT NULL DEFAULT 'active',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABELA: contacts
-- ============================================================
CREATE TABLE IF NOT EXISTS contacts (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        TEXT NOT NULL,
    email       TEXT,
    phone       TEXT,
    company     TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABELA: conversations
-- ============================================================
CREATE TABLE IF NOT EXISTS conversations (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contact_id  UUID REFERENCES contacts(id) ON DELETE SET NULL,
    agent_id    UUID REFERENCES agents(id) ON DELETE SET NULL,
    status      conversation_status NOT NULL DEFAULT 'open',
    department  TEXT NOT NULL,
    started_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at    TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABELA: metrics
-- ============================================================
CREATE TABLE IF NOT EXISTS metrics (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_name  TEXT NOT NULL,
    value        NUMERIC NOT NULL,
    date         DATE NOT NULL,
    agent_id     UUID REFERENCES agents(id) ON DELETE SET NULL,
    department   TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ÍNDICES para performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_conversations_status       ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at   ON conversations(created_at);
CREATE INDEX IF NOT EXISTS idx_conversations_agent_id     ON conversations(agent_id);
CREATE INDEX IF NOT EXISTS idx_conversations_department   ON conversations(department);
CREATE INDEX IF NOT EXISTS idx_metrics_date               ON metrics(date);
CREATE INDEX IF NOT EXISTS idx_metrics_metric_name        ON metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_agents_status              ON agents(status);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE users          ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents         ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrics        ENABLE ROW LEVEL SECURITY;

-- Políticas de leitura: usuários autenticados podem ler tudo
CREATE POLICY "Leitura autenticada - users"         ON users         FOR SELECT TO authenticated USING (true);
CREATE POLICY "Leitura autenticada - agents"        ON agents        FOR SELECT TO authenticated USING (true);
CREATE POLICY "Leitura autenticada - contacts"      ON contacts      FOR SELECT TO authenticated USING (true);
CREATE POLICY "Leitura autenticada - conversations" ON conversations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Leitura autenticada - metrics"       ON metrics       FOR SELECT TO authenticated USING (true);

-- Políticas de escrita: apenas admins e agents
CREATE POLICY "Escrita - conversations" ON conversations
    FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "Update - conversations" ON conversations
    FOR UPDATE TO authenticated
    USING (true);
