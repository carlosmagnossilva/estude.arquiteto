-- ============================================================
-- Hub de Obras – SEED DATA
-- Popula todas as tabelas com os dados do mockup
-- Ambiente: rg-hubdeobras-dev
-- ============================================================

-- ============================================================
--  D I M E N S Õ E S
-- ============================================================

-- dim_fase_fel
INSERT INTO hub.dim_fase_fel (codigo, descricao, ordem, categoria) VALUES
  ('FEL-0', 'Identificação',    0, 'futura'),
  ('FEL-1', 'Avaliação',        1, 'futura'),
  ('FEL-2', 'Definição',        2, 'futura'),
  ('FEL-3', 'Execução',         3, 'andamento'),
  ('FEL-4', 'Operação Assistida', 4, 'andamento'),
  ('FECH',  'Fechamento',       5, 'encerrada');
GO

-- dim_coletor
INSERT INTO hub.dim_coletor (codigo, descricao) VALUES
  (100, 'Manutenção Corretiva'),
  (101, 'Manutenção Preventiva'),
  (102, 'Inspeção Submarina (UWS)'),
  (103, 'Docagem / Dique Seco'),
  (105, 'Modificação / Melhoria'),
  (301, 'Projeto Especial');
GO

-- dim_embarcacao
SET IDENTITY_INSERT hub.dim_embarcacao ON;
INSERT INTO hub.dim_embarcacao (id, sigla, nome, hero_image_key) VALUES
  (1,  'ISS', 'I. São Sebastião',  'rochedo-de-sao-paulo'),
  (2,  'PFT', 'P. Feiticeiras',    'parcel-das-feiticeiras'),
  (3,  'PDB', 'P. Bandolim',       'parcel-do-bandolim'),
  (4,  'PDM', 'P. Meros',          'parcel-dos-meros'),
  (5,  'ITR', 'I. Trindade',       'rochedo-sao-pedro'),
  (6,  'PDT', 'P. Timbebas',       'parcel-das-timbebas'),
  (7,  'ITH', 'I. Tinharé',        'parcel-das-paredes'),
  (8,  'PML', 'P. Manuel Luiz',    'parcel-dos-reis'),
  (9,  'IMQ', 'I. Mosqueiro',      'parcel-dos-meros');
SET IDENTITY_INSERT hub.dim_embarcacao OFF;
GO

-- ============================================================
--  F A T O S   O P E R A C I O N A I S
-- ============================================================

-- fato_parada: 11 paradas do mockup
-- Nota: re/em/co/es/nc armazenados como DECIMAL. "-" vira NULL.
INSERT INTO hub.fato_parada
  (parada_id, embarcacao_id, fel_codigo, condicao, inicio_rp, termino_rp, dur_rp,
   realizado_brl_m, outlook_brl_m, re_perc, em_perc, co_perc, es_perc, nc_perc)
VALUES
  -- FECH (Encerradas)
  (69,  1, 'FECH',  'Seco',    '2025-04-03', '2025-05-10', 37,
   18.0,  18.0,  100.00, NULL,   NULL,   NULL,   NULL),

  (70,  2, 'FECH',  'Seco',    '2025-02-26', '2025-02-28',  2,
   NULL,   2.3,  NULL,   30.00,   9.00,  12.00,  49.00),

  (75,  3, 'FECH',  'Molhado', '2025-04-30', '2025-05-06',  6,
    1.7,   3.1,  54.00,   7.00,  11.00,   2.00,  79.00),

  (76,  4, 'FECH',  'Seco',    '2025-05-26', '2025-06-12', 17,
   13.6,  13.6, 100.00, NULL,   NULL,   NULL,   NULL),

  (89,  7, 'FECH',  'Molhado', '2025-10-20', '2025-11-09', 20,
    3.5,   3.5, 100.00, NULL,   NULL,   NULL,   NULL),

  -- FEL-4 (Em andamento)
  (79,  5, 'FEL-4', 'Seco',    '2025-09-30', '2025-11-08', 39,
    7.1,   9.5,  74.00,  14.00,   4.00,   9.00,  73.00),

  -- FEL-3 (Em andamento)
  (82,  6, 'FEL-3', 'Molhado', '2025-11-06', '2026-02-09', 95,
    6.9,  31.3,  22.00, NULL,   12.00,   7.00,  80.00),

  (83,  3, 'FEL-3', 'Seco',    '2025-12-12', '2026-02-25', 75,
   12.0,  31.6,  38.00,   3.00,   2.00,   6.00,  88.00),

  -- FEL-1 (Futuras)
  (88,  2, 'FEL-1', 'Seco',    '2026-07-01', '2026-07-28', 28,
    0.0,   0.0,   0.00,  34.00,   0.00,   0.00,  67.00),

  (97,  8, 'FEL-1', 'Seco',    '2026-08-06', '2026-09-02', 28,
    0.7,  18.1,   4.00,  22.00,  11.00,  28.00,  35.00),

  -- FEL-0 (Futuras)
  (135, 9, 'FEL-0', 'Seco',    '2027-04-01', '2027-04-28', 28,
    0.1,  13.4,   1.00,   0.00,   0.00,   2.00,  97.00);
GO

-- parada_coletor: Relação N:N
INSERT INTO hub.parada_coletor (parada_id, coletor_codigo) VALUES
  -- Parada 69
  (69, 100),
  -- Parada 70
  (70, 103),
  -- Parada 75
  (75, 100), (75, 101),
  -- Parada 76
  (76, 301),
  -- Parada 79
  (79, 101),
  -- Parada 82
  (82, 100), (82, 101), (82, 103),
  -- Parada 83
  (83, 301),
  -- Parada 88
  (88, 102), (88, 103),
  -- Parada 89
  (89, 100), (89, 101), (89, 102),
  -- Parada 97
  (97, 102), (97, 103), (97, 105),
  -- Parada 135
  (135, 102), (135, 103);
GO

-- fato_obra_progresso (1 por parada)
-- Formato: mat_realizado/mat_total, ser_realizado/ser_total, fac_realizado/fac_total
INSERT INTO hub.fato_obra_progresso
  (parada_id, mat_realizado, mat_total, ser_realizado, ser_total, fac_realizado, fac_total)
VALUES
  (69,  1000, 1000,  100, 100,  20, 20),   -- FECH – 100%
  (70,   850,  850,   45,  45,  12, 12),   -- FECH – 100%
  (75,   500,  500,   80,  80,  15, 15),   -- FECH – 100%
  (76,  1200, 1200,  150, 150,  30, 30),   -- FECH – 100%
  (89,   400,  400,   50,  50,  10, 10),   -- FECH – 100%
  (79,   850, 1000,   70, 100,  18, 20),   -- FEL-4 – parcial
  (82,   400, 1000,   15, 100,   6, 20),   -- FEL-3 – parcial
  (83,   600, 1000,   30, 100,  11, 20),   -- FEL-3 – parcial
  (88,     0, 1000,    0, 100,   0, 20),   -- FEL-1 – zerado
  (97,    50, 1000,    0, 100,   0, 20),   -- FEL-1 – quase zerado
  (135,    0,  500,    0,  50,   0, 10);   -- FEL-0 – zerado
GO

-- fato_gmud (1 por parada)
INSERT INTO hub.fato_gmud
  (parada_id, total, aprovadas, adicao, exclusao, alteracao, quebra)
VALUES
  (69,  70, 70, 40, 15, 10,  5),   -- FECH
  (70,  45, 45, 20, 10, 10,  5),   -- FECH
  (75,  30, 30, 15,  5,  8,  2),   -- FECH
  (76,  85, 85, 50, 20, 10,  5),   -- FECH
  (89,  25, 25, 10,  8,  5,  2),   -- FECH
  (79,  60, 50, 30, 10,  8,  2),   -- FEL-4
  (82,  40, 25, 15,  5,  3,  2),   -- FEL-3
  (83,  70, 56, 32, 14,  7,  3),   -- FEL-3
  (88,   0,  0,  0,  0,  0,  0),   -- FEL-1 – zerado
  (97,   0,  0,  0,  0,  0,  0),   -- FEL-1 – zerado
  (135,  0,  0,  0,  0,  0,  0);   -- FEL-0 – zerado
GO

-- ============================================================
--  F A T O S   F I N A N C E I R O S  (Capex)
-- ============================================================

-- dim_capex_ano: Outlook 2026
SET IDENTITY_INSERT hub.dim_capex_ano ON;
INSERT INTO hub.dim_capex_ano (id, ano, outlook_brl_m, variacao_orcamento_perc, total_obras, obras_executadas) VALUES
  (1, 2026, 265.6, -3.00, 47, 23);
SET IDENTITY_INSERT hub.dim_capex_ano OFF;
GO

-- fato_capex_tipo_obra: 5 tipos para 2026
INSERT INTO hub.fato_capex_tipo_obra (capex_ano_id, codigo, valor_brl_m, percentual) VALUES
  (1, 'MC',  45.1, 40.00),
  (1, 'DE',  69.2, 25.00),
  (1, 'DI',  11.2, 20.00),
  (1, 'PP', 128.8, 10.00),
  (1, 'UP',  11.3,  5.00);
GO

-- fato_capex_subsistema: Top 5 subsistemas 2026
INSERT INTO hub.fato_capex_subsistema (capex_ano_id, nome, codigo, valor_brl_m, percentual) VALUES
  (1, 'Propulsão',                    '630.001', 22.0, 85),
  (1, 'Motor Principal de Diesel',    '600.001', 17.0, 70),
  (1, 'Geradores principais',         '610.001', 12.0, 55),
  (1, 'Convés',                       '540.002',  5.0, 25),
  (1, 'Side Thrusters',               '630.005',  3.0, 15);
GO

-- fato_capex_composicao: Serviços / Material / Facilidades
INSERT INTO hub.fato_capex_composicao (capex_ano_id, categoria, percentual, valor_brl_m, variacao_perc) VALUES
  (1, 'Serviços',     25.00,  62.4,  1.00),
  (1, 'Material',     60.00, 149.8, -4.00),
  (1, 'Facilidades',  15.00,  37.4, -3.00);
GO

-- fato_capex_historico_anual: Série 5 anos para gráfico AreaChart
INSERT INTO hub.fato_capex_historico_anual (ano, valor_brl_m) VALUES
  (2025, 197.3),
  (2026, 279.7),
  (2027, 203.7),
  (2028, 192.8),
  (2029, 177.7);
GO

-- ============================================================
--  N O T I F I C A Ç Õ E S
-- ============================================================

INSERT INTO hub.fato_notificacao (titulo, meta_info, texto, usuario, data_hora, tipo) VALUES
  ('Serviço Atualizado',
   '029 | A. Abrolhos | FEL-2',
   'Foi adicionado 2 materiais vinculados a linha de serviço.',
   'Daniel Santos',
   '2025-11-26 11:15:00', 'geral'),

  ('Parada Cancelada',
   '033 | I. São sebastião | FEL 1',
   'Justificativa anexada',
   'Leonardo Silva',
   '2025-11-26 09:09:00', 'geral'),

  ('Nova GMUD aberta',
   '026 | P. dos Reis | FEL-4',
   'Foi adicionado 2 materiais vinculados a linha de serviço.',
   'Guilherme Abreu',
   '2025-11-25 11:15:00', 'geral'),

  ('Pendência atribuída',
   '160 | P. dos Reis | FEL-4',
   'Você foi mencionado em uma atualização.',
   'Sistema',
   '2025-11-25 08:40:00', 'pessoal');
GO

PRINT '✅ Seed completo: 6 fases, 6 coletores, 9 embarcações, 11 paradas, 21 coletores-ponte, 11 progressos, 11 GMUDs, 1 Capex ano, 5 tipos, 5 subsistemas, 3 composições, 5 pontos históricos, 4 notificações.';
GO
