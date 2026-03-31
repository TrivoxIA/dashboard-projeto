-- ── 005_flows.sql ───────────────────────────────────────────────

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

CREATE INDEX idx_flow_executions_flow_id    ON flow_executions(flow_id);
CREATE INDEX idx_flow_executions_status     ON flow_executions(status);
CREATE INDEX idx_flow_executions_executed_at ON flow_executions(executed_at DESC);

-- ── Seed: fluxos de exemplo ──────────────────────────────────────
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

-- ── Seed: execuções do fluxo "Recepção WhatsApp" ─────────────────
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

-- ── Seed: execuções do fluxo "Qualificação de Leads" ─────────────
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
