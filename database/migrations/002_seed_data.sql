-- ============================================================
-- 002_seed_data.sql
-- Dados fictícios para testar o Dashboard CRM
-- Execute APÓS 001_initial_schema.sql
-- ============================================================

-- ============================================================
-- USERS
-- ============================================================
INSERT INTO users (id, name, email, role) VALUES
    ('a1000000-0000-0000-0000-000000000001', 'Ana Souza',       'ana.souza@trivox.ai',     'admin'),
    ('a1000000-0000-0000-0000-000000000002', 'Bruno Lima',      'bruno.lima@trivox.ai',    'agent'),
    ('a1000000-0000-0000-0000-000000000003', 'Carla Mendes',    'carla.mendes@trivox.ai',  'agent'),
    ('a1000000-0000-0000-0000-000000000004', 'Diego Rocha',     'diego.rocha@trivox.ai',   'agent'),
    ('a1000000-0000-0000-0000-000000000005', 'Elena Ferreira',  'elena.ferreira@trivox.ai','agent'),
    ('a1000000-0000-0000-0000-000000000006', 'Felipe Gomes',    'felipe.gomes@trivox.ai',  'viewer')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- AGENTS
-- ============================================================
INSERT INTO agents (id, user_id, name, department, status) VALUES
    ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Agente Ana',    'Suporte Técnico', 'active'),
    ('b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000002', 'Agente Bruno',  'Vendas',          'active'),
    ('b1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000003', 'Agente Carla',  'Financeiro',      'active'),
    ('b1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000004', 'Agente Diego',  'RH',              'maintenance'),
    ('b1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000005', 'Agente Elena',  'Outros',          'inactive')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- CONTACTS (50 contatos)
-- ============================================================
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

-- ============================================================
-- CONVERSATIONS (200 conversas nos últimos 30 dias)
-- Geradas com datas variadas e status distribuídos
-- ============================================================
DO $$
DECLARE
    departments TEXT[] := ARRAY['Suporte Técnico', 'Vendas', 'Financeiro', 'RH', 'Outros'];
    statuses    TEXT[] := ARRAY['resolved', 'resolved', 'resolved', 'pending', 'open'];
    agent_ids   UUID[] := ARRAY[
        'b1000000-0000-0000-0000-000000000001'::UUID,
        'b1000000-0000-0000-0000-000000000002'::UUID,
        'b1000000-0000-0000-0000-000000000003'::UUID,
        'b1000000-0000-0000-0000-000000000004'::UUID,
        'b1000000-0000-0000-0000-000000000005'::UUID
    ];
    i           INT;
    contact_num INT;
    dept        TEXT;
    stat        TEXT;
    agent_id    UUID;
    days_ago    INT;
    start_ts    TIMESTAMPTZ;
    end_ts      TIMESTAMPTZ;
BEGIN
    FOR i IN 1..200 LOOP
        contact_num := (i % 50) + 1;
        dept        := departments[(i % 5) + 1];
        stat        := statuses[(i % 5) + 1];
        agent_id    := agent_ids[(i % 5) + 1];
        days_ago    := i % 30;
        start_ts    := NOW() - (days_ago || ' days')::INTERVAL - ((i % 12) || ' hours')::INTERVAL;
        end_ts      := CASE WHEN stat = 'resolved' THEN start_ts + ((10 + (i % 50)) || ' minutes')::INTERVAL ELSE NULL END;

        INSERT INTO conversations (contact_id, agent_id, status, department, started_at, ended_at, created_at)
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
-- METRICS (7 dias de métricas diárias)
-- ============================================================
DO $$
DECLARE
    i           INT;
    d           DATE;
    conversations_count NUMERIC;
    resolution_rate     NUMERIC;
    avg_response_time   NUMERIC;
BEGIN
    FOR i IN 0..6 LOOP
        d := CURRENT_DATE - i;
        conversations_count := 18 + (i * 3) + (i % 4) * 5;
        resolution_rate     := 72 + (i % 5) * 3;
        avg_response_time   := 38 + (i % 7) * 2;

        INSERT INTO metrics (metric_name, value, date, department)
        VALUES
            ('conversations_total',    conversations_count, d, NULL),
            ('resolution_rate',        resolution_rate,     d, NULL),
            ('avg_response_time_secs', avg_response_time,   d, NULL);

        -- Métricas por departamento
        INSERT INTO metrics (metric_name, value, date, department)
        VALUES
            ('resolutions_by_dept', 30 + (i % 3) * 5, d, 'Suporte Técnico'),
            ('resolutions_by_dept', 25 + (i % 4) * 3, d, 'Vendas'),
            ('resolutions_by_dept', 18 + (i % 2) * 4, d, 'Financeiro'),
            ('resolutions_by_dept', 12 + (i % 3) * 2, d, 'RH'),
            ('resolutions_by_dept', 8  + (i % 2) * 3, d, 'Outros');
    END LOOP;
END $$;
