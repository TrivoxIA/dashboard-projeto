-- ============================================================
-- 003_fix_reseed.sql
-- Corrige os dados de seed:
--   1. Tempo de resposta em segundos (3–8s) em vez de minutos
--   2. Status desacoplado do departamento (todos os depts têm 'resolved')
--   3. Variação realista de conversas por dia nos últimos 7 dias
-- Execute no SQL Editor do Supabase APÓS os scripts 001 e 002
-- ============================================================

-- Limpa dados incorretos
TRUNCATE TABLE metrics       RESTART IDENTITY CASCADE;
DELETE FROM conversations;

-- ============================================================
-- CONVERSATIONS — últimos 7 dias com variação realista
-- ============================================================
DO $$
DECLARE
    -- Distribuição de departamentos com pesos:
    -- Suporte Técnico ~30% (6/20), Vendas ~25% (5/20),
    -- Financeiro ~20% (4/20), RH ~15% (3/20), Outros ~10% (2/20)
    dept_map TEXT[] := ARRAY[
        'Suporte Técnico','Suporte Técnico','Suporte Técnico','Suporte Técnico','Suporte Técnico','Suporte Técnico',
        'Vendas','Vendas','Vendas','Vendas','Vendas',
        'Financeiro','Financeiro','Financeiro','Financeiro',
        'RH','RH','RH',
        'Outros','Outros'
    ];

    -- Status INDEPENDENTE do departamento (~60% resolved, 20% pending, 20% open)
    status_map TEXT[] := ARRAY['resolved','resolved','resolved','pending','open'];

    agent_ids UUID[] := ARRAY[
        'b1000000-0000-0000-0000-000000000001'::UUID,
        'b1000000-0000-0000-0000-000000000002'::UUID,
        'b1000000-0000-0000-0000-000000000003'::UUID,
        'b1000000-0000-0000-0000-000000000004'::UUID,
        'b1000000-0000-0000-0000-000000000005'::UUID
    ];

    -- Volume por dia (índice 0 = 6 dias atrás, índice 6 = hoje)
    -- Seg=45, Ter=38, Qua=52, Qui=41, Sex=60, Sab=25, Dom=15 → escalonado a ~1/5
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
    -- Últimos 7 dias com variação por dia
    FOR day_idx IN 0..6 LOOP
        n := day_counts[day_idx + 1];
        FOR i IN 1..n LOOP
            conv_idx    := conv_idx + 1;
            contact_num := (conv_idx % 50) + 1;
            dept        := dept_map[(conv_idx % 20) + 1];
            stat        := status_map[((conv_idx * 7) % 5) + 1];  -- independente do dept
            agent_id    := agent_ids[(conv_idx % 5) + 1];
            start_ts    := NOW()
                           - ((6 - day_idx) || ' days')::INTERVAL
                           + ((i * 23) || ' minutes')::INTERVAL;
            resp_secs   := 3 + (conv_idx % 6);  -- 3 a 8 segundos
            end_ts      := CASE WHEN stat = 'resolved'
                               THEN start_ts + (resp_secs || ' seconds')::INTERVAL
                               ELSE NULL END;

            INSERT INTO conversations
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

    -- Dias 8–30 (histórico mais antigo, distribuição uniforme)
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

        INSERT INTO conversations
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

-- ============================================================
-- METRICS — 7 dias com variação realista
-- ============================================================
DO $$
DECLARE
    i                   INT;
    d                   DATE;
    -- Contagens diárias espelham day_counts acima (6 dias atrás → hoje)
    day_totals INT[]  := ARRAY[15, 12, 20, 14, 22, 8, 5];
    conv_count          NUMERIC;
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
