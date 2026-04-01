-- ============================================================
-- migration_completa_crm.sql
-- Migration única do Dashboard CRM — TrivoxIA
-- Contém todas as fases (001 a 005) prontas para o novo Supabase.
--
-- ATENÇÃO: NÃO recria as tabelas já existentes no banco destino:
--   conversations, documents, n8n_chat_histories
-- A tabela de conversas do CRM foi renomeada para: crm_conversations
--
-- Execute integralmente no SQL Editor do Supabase.
-- ============================================================

-- ── Extensões ────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── ENUMs ────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'agent', 'viewer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE agent_status AS ENUM ('active', 'inactive', 'maintenance');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE conversation_status AS ENUM ('open', 'resolved', 'pending');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- FASE 1 — Schema inicial
-- ============================================================

-- TABELA: users
CREATE TABLE IF NOT EXISTS users (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        TEXT NOT NULL,
    email       TEXT NOT NULL UNIQUE,
    role        user_role NOT NULL DEFAULT 'viewer',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TABELA: agents
CREATE TABLE IF NOT EXISTS agents (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
    name        TEXT NOT NULL,
    department  TEXT NOT NULL,
    status      agent_status NOT NULL DEFAULT 'active',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TABELA: contacts
CREATE TABLE IF NOT EXISTS contacts (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        TEXT NOT NULL,
    email       TEXT,
    phone       TEXT,
    company     TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TABELA: crm_conversations  (renomeada de "conversations")
CREATE TABLE IF NOT EXISTS crm_conversations (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contact_id  UUID REFERENCES contacts(id) ON DELETE SET NULL,
    agent_id    UUID REFERENCES agents(id) ON DELETE SET NULL,
    status      conversation_status NOT NULL DEFAULT 'open',
    department  TEXT NOT NULL,
    started_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at    TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TABELA: metrics
CREATE TABLE IF NOT EXISTS metrics (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_name  TEXT NOT NULL,
    value        NUMERIC NOT NULL,
    date         DATE NOT NULL,
    agent_id     UUID REFERENCES agents(id) ON DELETE SET NULL,
    department   TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_crm_conversations_status     ON crm_conversations(status);
CREATE INDEX IF NOT EXISTS idx_crm_conversations_created_at ON crm_conversations(created_at);
CREATE INDEX IF NOT EXISTS idx_crm_conversations_agent_id   ON crm_conversations(agent_id);
CREATE INDEX IF NOT EXISTS idx_crm_conversations_department ON crm_conversations(department);
CREATE INDEX IF NOT EXISTS idx_metrics_date                 ON metrics(date);
CREATE INDEX IF NOT EXISTS idx_metrics_metric_name          ON metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_agents_status                ON agents(status);

-- RLS
ALTER TABLE users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents             ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts           ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_conversations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrics            ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura autenticada - users"              ON users             FOR SELECT TO authenticated USING (true);
CREATE POLICY "Leitura autenticada - agents"             ON agents            FOR SELECT TO authenticated USING (true);
CREATE POLICY "Leitura autenticada - contacts"           ON contacts          FOR SELECT TO authenticated USING (true);
CREATE POLICY "Leitura autenticada - crm_conversations"  ON crm_conversations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Leitura autenticada - metrics"            ON metrics           FOR SELECT TO authenticated USING (true);

CREATE POLICY "Escrita - crm_conversations" ON crm_conversations
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Update - crm_conversations" ON crm_conversations
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Escrita - agents" ON agents
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Escrita - contacts" ON contacts
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- FASE 2 — Seed de dados (users, agents, contacts, crm_conversations, metrics)
-- ============================================================

-- USERS
INSERT INTO users (id, name, email, role) VALUES
    ('a1000000-0000-0000-0000-000000000001', 'Ana Souza',       'ana.souza@trivox.ai',     'admin'),
    ('a1000000-0000-0000-0000-000000000002', 'Bruno Lima',      'bruno.lima@trivox.ai',    'agent'),
    ('a1000000-0000-0000-0000-000000000003', 'Carla Mendes',    'carla.mendes@trivox.ai',  'agent'),
    ('a1000000-0000-0000-0000-000000000004', 'Diego Rocha',     'diego.rocha@trivox.ai',   'agent'),
    ('a1000000-0000-0000-0000-000000000005', 'Elena Ferreira',  'elena.ferreira@trivox.ai','agent'),
    ('a1000000-0000-0000-0000-000000000006', 'Felipe Gomes',    'felipe.gomes@trivox.ai',  'viewer')
ON CONFLICT (id) DO NOTHING;

-- AGENTS
INSERT INTO agents (id, user_id, name, department, status) VALUES
    ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Agente Ana',    'Suporte Técnico', 'active'),
    ('b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000002', 'Agente Bruno',  'Vendas',          'active'),
    ('b1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000003', 'Agente Carla',  'Financeiro',      'active'),
    ('b1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000004', 'Agente Diego',  'RH',              'maintenance'),
    ('b1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000005', 'Agente Elena',  'Outros',          'inactive')
ON CONFLICT (id) DO NOTHING;

-- CONTACTS (50 contatos)
INSERT INTO contacts (id, name, email, phone, company) VALUES
    ('c0000000-0000-0000-0000-000000000001', 'Roberto Alves',       'roberto@empresa1.com',   '+5511999001001', 'Tech Solutions'),
    ('c0000000-0000-0000-0000-000000000002', 'Mariana Costa',       'mariana@empresa2.com',   '+5511999001002', 'Inovação Ltda'),
    ('c0000000-0000-0000-0000-000000000003', 'Paulo Nascimento',    'paulo@empresa3.com',     '+5511999001003', 'DataBridge'),
    ('c0000000-0000-0000-0000-000000000004', 'Juliana Ribeiro',     'juliana@empresa4.com',   '+5511999001004', 'CloudSys'),
    ('c0000000-0000-0000-0000-000000000005', 'Thiago Santos',       'thiago@empresa5.com',    '+5511999001005', 'SoftMaker'),
    ('c0000000-0000-0000-0000-000000000006', 'Camila Oliveira',     'camila@empresa6.com',    '+5511999001006', 'WebBuild'),
    ('c0000000-0000-0000-0000-000000000007', 'Lucas Martins',       'lucas@empresa7.com',     '+5511999001007', 'AppDev'),
    ('c0000000-0000-0000-0000-000000000008', 'Fernanda Lima',       'fernanda@empresa8.com',  '+5511999001008', 'Digital Hub'),
    ('c0000000-0000-0000-0000-000000000009', 'Rafael Pereira',      'rafael@empresa9.com',    '+5511999001009', 'MicroSoft BR'),
    ('c0000000-0000-0000-0000-000000000010', 'Beatriz Souza',       'beatriz@empresa10.com',  '+5511999001010', 'NetWork Co'),
    ('c0000000-0000-0000-0000-000000000011', 'Gustavo Ferreira',    'gustavo@empresa11.com',  '+5511999001011', 'InfoSys'),
    ('c0000000-0000-0000-0000-000000000012', 'Patricia Gomes',      'patricia@empresa12.com', '+5511999001012', 'TechVenture'),
    ('c0000000-0000-0000-0000-000000000013', 'Eduardo Carvalho',    'eduardo@empresa13.com',  '+5511999001013', 'StartupX'),
    ('c0000000-0000-0000-0000-000000000014', 'Larissa Rodrigues',   'larissa@empresa14.com',  '+5511999001014', 'GrowthLab'),
    ('c0000000-0000-0000-0000-000000000015', 'Vinicius Barbosa',    'vinicius@empresa15.com', '+5511999001015', 'ScaleUp'),
    ('c0000000-0000-0000-0000-000000000016', 'Amanda Cardoso',      'amanda@empresa16.com',   '+5511999001016', 'FintechPay'),
    ('c0000000-0000-0000-0000-000000000017', 'Henrique Araújo',     'henrique@empresa17.com', '+5511999001017', 'BankTech'),
    ('c0000000-0000-0000-0000-000000000018', 'Renata Monteiro',     'renata@empresa18.com',   '+5511999001018', 'CreditPlus'),
    ('c0000000-0000-0000-0000-000000000019', 'Anderson Teixeira',   'anderson@empresa19.com', '+5511999001019', 'InsureTech'),
    ('c0000000-0000-0000-0000-000000000020', 'Simone Castro',       'simone@empresa20.com',   '+5511999001020', 'HRForce'),
    ('c0000000-0000-0000-0000-000000000021', 'Marcos Dias',         'marcos@empresa21.com',   '+5511999001021', 'TalentHub'),
    ('c0000000-0000-0000-0000-000000000022', 'Natália Correia',     'natalia@empresa22.com',  '+5511999001022', 'PeopleOps'),
    ('c0000000-0000-0000-0000-000000000023', 'Rodrigo Neves',       'rodrigo@empresa23.com',  '+5511999001023', 'RecrutaFast'),
    ('c0000000-0000-0000-0000-000000000024', 'Daniela Freitas',     'daniela@empresa24.com',  '+5511999001024', 'TrainingCo'),
    ('c0000000-0000-0000-0000-000000000025', 'Matheus Cunha',       'matheus@empresa25.com',  '+5511999001025', 'SkillBoost'),
    ('c0000000-0000-0000-0000-000000000026', 'Isabela Pinto',       'isabela@empresa26.com',  '+5511999001026', 'EduTech'),
    ('c0000000-0000-0000-0000-000000000027', 'Leonardo Melo',       'leonardo@empresa27.com', '+5511999001027', 'LearnFast'),
    ('c0000000-0000-0000-0000-000000000028', 'Priscila Lopes',      'priscila@empresa28.com', '+5511999001028', 'CourseHub'),
    ('c0000000-0000-0000-0000-000000000029', 'Caio Fernandes',      'caio@empresa29.com',     '+5511999001029', 'StudyMax'),
    ('c0000000-0000-0000-0000-000000000030', 'Aline Borges',        'aline@empresa30.com',    '+5511999001030', 'KnowledgeBase'),
    ('c0000000-0000-0000-0000-000000000031', 'Leandro Barros',      'leandro@empresa31.com',  '+5511999001031', 'SalesPro'),
    ('c0000000-0000-0000-0000-000000000032', 'Tatiana Moreira',     'tatiana@empresa32.com',  '+5511999001032', 'CRMTech'),
    ('c0000000-0000-0000-0000-000000000033', 'Fábio Ramos',         'fabio@empresa33.com',    '+5511999001033', 'LeadGen'),
    ('c0000000-0000-0000-0000-000000000034', 'Vanessa Sousa',       'vanessa@empresa34.com',  '+5511999001034', 'ConvertX'),
    ('c0000000-0000-0000-0000-000000000035', 'Alex Machado',        'alex@empresa35.com',     '+5511999001035', 'FunnelMax'),
    ('c0000000-0000-0000-0000-000000000036', 'Claudia Vieira',      'claudia@empresa36.com',  '+5511999001036', 'PipelinePro'),
    ('c0000000-0000-0000-0000-000000000037', 'Nelson Azevedo',      'nelson@empresa37.com',   '+5511999001037', 'DealClose'),
    ('c0000000-0000-0000-0000-000000000038', 'Sandra Campos',       'sandra@empresa38.com',   '+5511999001038', 'QuoteMaster'),
    ('c0000000-0000-0000-0000-000000000039', 'Sérgio Guimarães',    'sergio@empresa39.com',   '+5511999001039', 'ProposalAI'),
    ('c0000000-0000-0000-0000-000000000040', 'Elisa Carvalho',      'elisa@empresa40.com',    '+5511999001040', 'ContractHub'),
    ('c0000000-0000-0000-0000-000000000041', 'Jonas Mendonça',      'jonas@empresa41.com',    '+5511999001041', 'LegalTech'),
    ('c0000000-0000-0000-0000-000000000042', 'Helena Nogueira',     'helena@empresa42.com',   '+5511999001042', 'CompliancePro'),
    ('c0000000-0000-0000-0000-000000000043', 'Diogo Cavalcante',    'diogo@empresa43.com',    '+5511999001043', 'AuditSys'),
    ('c0000000-0000-0000-0000-000000000044', 'Monica Paiva',        'monica@empresa44.com',   '+5511999001044', 'TaxAssist'),
    ('c0000000-0000-0000-0000-000000000045', 'Tiago Sampaio',       'tiago@empresa45.com',    '+5511999001045', 'AccountingAI'),
    ('c0000000-0000-0000-0000-000000000046', 'Luciana Brito',       'luciana@empresa46.com',  '+5511999001046', 'FinanceFlow'),
    ('c0000000-0000-0000-0000-000000000047', 'Bruno Fonseca',       'brunof@empresa47.com',   '+5511999001047', 'BudgetWise'),
    ('c0000000-0000-0000-0000-000000000048', 'Gabriela Pires',      'gabriela@empresa48.com', '+5511999001048', 'CostControl'),
    ('c0000000-0000-0000-0000-000000000049', 'Diego Andrade',       'diegoa@empresa49.com',   '+5511999001049', 'ExpenseTrack'),
    ('c0000000-0000-0000-0000-000000000050', 'Sabrina Torres',      'sabrina@empresa50.com',  '+5511999001050', 'InvoicePro')
ON CONFLICT (id) DO NOTHING;

-- CRM_CONVERSATIONS + METRICS (seed corrigido da fase 3)
DO $$
DECLARE
    dept_map TEXT[] := ARRAY[
        'Suporte Técnico','Suporte Técnico','Suporte Técnico','Suporte Técnico','Suporte Técnico','Suporte Técnico',
        'Vendas','Vendas','Vendas','Vendas','Vendas',
        'Financeiro','Financeiro','Financeiro','Financeiro',
        'RH','RH','RH',
        'Outros','Outros'
    ];
    status_map TEXT[] := ARRAY['resolved','resolved','resolved','pending','open'];
    agent_ids UUID[] := ARRAY[
        'b1000000-0000-0000-0000-000000000001'::UUID,
        'b1000000-0000-0000-0000-000000000002'::UUID,
        'b1000000-0000-0000-0000-000000000003'::UUID,
        'b1000000-0000-0000-0000-000000000004'::UUID,
        'b1000000-0000-0000-0000-000000000005'::UUID
    ];
    day_counts INT[] := ARRAY[15, 12, 20, 14, 22, 8, 5];
    day_idx     INT;
    i           INT;
    conv_idx    INT := 0;
    n           INT;
    contact_num INT;
    dept        TEXT;
    stat        TEXT;
    agent_id    UUID;
    start_ts    TIMESTAMPTZ;
    end_ts      TIMESTAMPTZ;
    resp_secs   INT;
BEGIN
    FOR day_idx IN 0..6 LOOP
        n := day_counts[day_idx + 1];
        FOR i IN 1..n LOOP
            conv_idx    := conv_idx + 1;
            contact_num := (conv_idx % 50) + 1;
            dept        := dept_map[(conv_idx % 20) + 1];
            stat        := status_map[((conv_idx * 7) % 5) + 1];
            agent_id    := agent_ids[(conv_idx % 5) + 1];
            start_ts    := NOW()
                           - ((6 - day_idx) || ' days')::INTERVAL
                           + ((i * 23) || ' minutes')::INTERVAL;
            resp_secs   := 3 + (conv_idx % 6);
            end_ts      := CASE WHEN stat = 'resolved'
                               THEN start_ts + (resp_secs || ' seconds')::INTERVAL
                               ELSE NULL END;

            INSERT INTO crm_conversations
                (contact_id, agent_id, status, department, started_at, ended_at, created_at)
            VALUES (
                ('c0000000-0000-0000-0000-0000000000' || LPAD(contact_num::TEXT, 2, '0'))::UUID,
                agent_id,
                stat::conversation_status,
                dept,
                start_ts,
                end_ts,
                start_ts
            );
        END LOOP;
    END LOOP;

    FOR i IN 1..104 LOOP
        conv_idx    := conv_idx + 1;
        contact_num := (conv_idx % 50) + 1;
        dept        := dept_map[(conv_idx % 20) + 1];
        stat        := status_map[((conv_idx * 7) % 5) + 1];
        agent_id    := agent_ids[(conv_idx % 5) + 1];
        start_ts    := NOW()
                       - ((7 + (i % 23)) || ' days')::INTERVAL
                       - ((i % 12) || ' hours')::INTERVAL;
        resp_secs   := 3 + (conv_idx % 6);
        end_ts      := CASE WHEN stat = 'resolved'
                           THEN start_ts + (resp_secs || ' seconds')::INTERVAL
                           ELSE NULL END;

        INSERT INTO crm_conversations
            (contact_id, agent_id, status, department, started_at, ended_at, created_at)
        VALUES (
            ('c0000000-0000-0000-0000-0000000000' || LPAD(contact_num::TEXT, 2, '0'))::UUID,
            agent_id,
            stat::conversation_status,
            dept,
            start_ts,
            end_ts,
            start_ts
        );
    END LOOP;
END $$;

-- METRICS
DO $$
DECLARE
    i          INT;
    d          DATE;
    day_totals INT[] := ARRAY[15, 12, 20, 14, 22, 8, 5];
    conv_count NUMERIC;
BEGIN
    FOR i IN 0..6 LOOP
        d          := CURRENT_DATE - (6 - i);
        conv_count := day_totals[i + 1];

        INSERT INTO metrics (metric_name, value, date, department) VALUES
            ('conversations_total',    conv_count,         d, NULL),
            ('resolution_rate',        60 + (i % 5) * 3,  d, NULL),
            ('avg_response_time_secs', 4 + (i % 3),        d, NULL);

        INSERT INTO metrics (metric_name, value, date, department) VALUES
            ('resolutions_by_dept', ROUND(conv_count * 0.30), d, 'Suporte Técnico'),
            ('resolutions_by_dept', ROUND(conv_count * 0.25), d, 'Vendas'),
            ('resolutions_by_dept', ROUND(conv_count * 0.20), d, 'Financeiro'),
            ('resolutions_by_dept', ROUND(conv_count * 0.15), d, 'RH'),
            ('resolutions_by_dept', ROUND(conv_count * 0.10), d, 'Outros');
    END LOOP;
END $$;

-- ============================================================
-- FASE 4 — Settings
-- ============================================================

CREATE TABLE IF NOT EXISTS settings (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  key         text        UNIQUE NOT NULL,
  value       text,
  updated_at  timestamptz DEFAULT now()
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "settings_select" ON settings
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "settings_upsert" ON settings
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

INSERT INTO settings (key, value) VALUES
  ('n8n_webhook_url',          ''),
  ('n8n_api_key',              ''),
  ('notifications_enabled',    'true'),
  ('theme',                    'dark'),
  ('show_kpi_conversations',   'true'),
  ('show_kpi_agents',          'true'),
  ('show_kpi_resolution',      'true'),
  ('show_kpi_response_time',   'true')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- FASE 5 — Flows (integração n8n)
-- ============================================================

CREATE TABLE IF NOT EXISTS flows (
  id                    UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  name                  TEXT        NOT NULL,
  description           TEXT,
  type                  TEXT        NOT NULL CHECK (type IN ('webhook', 'scheduled', 'manual')),
  status                TEXT        NOT NULL DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'error')),
  webhook_url           TEXT,
  cron_expression       TEXT,
  field_mapping         JSONB       DEFAULT '{}',
  config                JSONB       DEFAULT '{}',
  total_executions      INTEGER     DEFAULT 0,
  successful_executions INTEGER     DEFAULT 0,
  last_executed_at      TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS flow_executions (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  flow_id       UUID        REFERENCES flows(id) ON DELETE CASCADE,
  status        TEXT        NOT NULL CHECK (status IN ('success', 'error', 'running')),
  duration_ms   INTEGER,
  payload       JSONB,
  response      JSONB,
  error_message TEXT,
  executed_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE flows           ENABLE ROW LEVEL SECURITY;
ALTER TABLE flow_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "flows_read"  ON flows FOR SELECT TO authenticated USING (true);
CREATE POLICY "flows_write" ON flows FOR ALL    TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "flow_executions_read"  ON flow_executions FOR SELECT TO authenticated USING (true);
CREATE POLICY "flow_executions_write" ON flow_executions FOR ALL    TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_flow_executions_flow_id     ON flow_executions(flow_id);
CREATE INDEX IF NOT EXISTS idx_flow_executions_status      ON flow_executions(status);
CREATE INDEX IF NOT EXISTS idx_flow_executions_executed_at ON flow_executions(executed_at DESC);

INSERT INTO flows (name, description, type, status, webhook_url, total_executions, successful_executions, last_executed_at, field_mapping) VALUES
  ('Recepção WhatsApp',
   'Recebe mensagens do WhatsApp via API Oficial (Meta) e registra no CRM',
   'webhook', 'active', '/api/webhooks/whatsapp-incoming',
   1247, 1230, NOW() - INTERVAL '3 minutes',
   '{"from": "contato.telefone", "body": "conversa.mensagem", "type": "conversa.tipo"}'::jsonb),

  ('Notificação Follow-up',
   'Envia alerta para agentes quando conversa fica pendente por mais de 30 minutos',
   'scheduled', 'active', NULL,
   856, 849, NOW() - INTERVAL '30 minutes',
   '{}'::jsonb),

  ('Qualificação de Leads',
   'Classifica leads automaticamente com base nas respostas do formulário',
   'webhook', 'active', '/api/webhooks/lead-qualify',
   432, 418, NOW() - INTERVAL '1 hour',
   '{"email": "contato.email", "nome": "contato.nome", "score": "contato.qualificacao"}'::jsonb),

  ('Sync Contatos CRM',
   'Sincroniza contatos entre o CRM e planilha do Google Sheets',
   'scheduled', 'inactive', NULL,
   120, 115, NOW() - INTERVAL '2 days',
   '{}'::jsonb),

  ('Alerta de SLA',
   'Notifica gestores quando tempo de resposta ultrapassa o SLA definido',
   'scheduled', 'error', NULL,
   340, 280, NOW() - INTERVAL '15 minutes',
   '{}'::jsonb),

  ('Envio de Pesquisa NPS',
   'Dispara pesquisa de satisfação após resolução de conversa',
   'webhook', 'active', '/api/webhooks/nps-trigger',
   198, 195, NOW() - INTERVAL '2 hours',
   '{"conversation_id": "conversa.id", "contact_id": "contato.id"}'::jsonb);

INSERT INTO flow_executions (flow_id, status, duration_ms, payload, error_message, executed_at)
SELECT
  f.id,
  CASE WHEN random() > 0.05 THEN 'success' ELSE 'error' END,
  (random() * 2000 + 200)::integer,
  '{"from": "+5511999001001", "body": "Olá, preciso de ajuda", "type": "text"}'::jsonb,
  CASE WHEN random() > 0.95 THEN 'Timeout na conexão com o banco de dados' ELSE NULL END,
  NOW() - (random() * INTERVAL '7 days')
FROM flows f, generate_series(1, 30)
WHERE f.name = 'Recepção WhatsApp';

INSERT INTO flow_executions (flow_id, status, duration_ms, payload, error_message, executed_at)
SELECT
  f.id,
  CASE WHEN random() > 0.08 THEN 'success' ELSE 'error' END,
  (random() * 1500 + 100)::integer,
  '{"email": "lead@empresa.com", "nome": "João Silva", "score": 85}'::jsonb,
  CASE WHEN random() > 0.92 THEN 'Falha ao conectar com o serviço externo' ELSE NULL END,
  NOW() - (random() * INTERVAL '7 days')
FROM flows f, generate_series(1, 20)
WHERE f.name = 'Qualificação de Leads';

-- ============================================================
-- FIM — migration_completa_crm.sql
-- Tabelas criadas: users, agents, contacts, crm_conversations,
--                  metrics, settings, flows, flow_executions
-- Tabelas preservadas (já existentes no destino):
--   conversations, documents, n8n_chat_histories
-- ============================================================
