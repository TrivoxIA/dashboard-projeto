-- ── 004_settings.sql ────────────────────────────────────────────
-- Tabela de configurações chave-valor e dados de usuários internos

-- Tabela de configurações do sistema
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

-- Configurações padrão
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
