-- ============================================================
-- Hub de Obras – QUERIES para o BFF
-- Cada query é nomeada e otimizada para servir um endpoint
-- ============================================================

-- ============================================================
-- Q1: GET /bff/paradas
-- Retorna todas as paradas com embarcação, obra e GMUD
-- O BFF monta o JSON final com coletores como array
-- ============================================================

-- Q1a: Paradas + Embarcação + Breakdown + Progresso + GMUD
SELECT
    p.parada_id                                     AS paradaId,
    e.nome                                          AS embarcacao,
    e.hero_image_key                                AS heroImageKey,
    p.fel_codigo                                    AS fel,
    f.categoria                                     AS categoriaFel,
    p.condicao,
    FORMAT(p.inicio_rp, 'dd/MM/yy')                 AS inicioRP,
    FORMAT(p.termino_rp, 'dd/MM/yy')                AS terminoRP,
    p.dur_rp                                        AS durRP,
    p.realizado_brl_m,
    p.outlook_brl_m,
    -- Percentuais: NULL → "-", senão formata "XX%"
    CASE WHEN p.re_perc IS NULL THEN '-' ELSE CONCAT(CAST(CAST(p.re_perc AS INT) AS VARCHAR), '%') END AS re,
    CASE WHEN p.em_perc IS NULL THEN '-' ELSE CONCAT(CAST(CAST(p.em_perc AS INT) AS VARCHAR), '%') END AS em,
    CASE WHEN p.co_perc IS NULL THEN '-' ELSE CONCAT(CAST(CAST(p.co_perc AS INT) AS VARCHAR), '%') END AS co,
    CASE WHEN p.es_perc IS NULL THEN '-' ELSE CONCAT(CAST(CAST(p.es_perc AS INT) AS VARCHAR), '%') END AS es,
    CASE WHEN p.nc_perc IS NULL THEN '-' ELSE CONCAT(CAST(CAST(p.nc_perc AS INT) AS VARCHAR), '%') END AS nc,
    -- Obra (progresso)
    op.mat_realizado, op.mat_total,
    op.ser_realizado, op.ser_total,
    op.fac_realizado, op.fac_total,
    -- GMUD
    g.total       AS gmud_tot,
    g.aprovadas   AS gmud_aprov,
    g.adicao      AS gmud_add,
    g.exclusao    AS gmud_exc,
    g.alteracao   AS gmud_alt,
    g.quebra      AS gmud_qbr
FROM hub.fato_parada p
    INNER JOIN hub.dim_embarcacao e   ON e.id = p.embarcacao_id
    INNER JOIN hub.dim_fase_fel  f    ON f.codigo = p.fel_codigo
    LEFT  JOIN hub.fato_obra_progresso op ON op.parada_id = p.parada_id
    LEFT  JOIN hub.fato_gmud g           ON g.parada_id  = p.parada_id
ORDER BY p.termino_rp DESC;


-- Q1b: Coletores por parada (o BFF agrupa por parada_id)
SELECT
    pc.parada_id  AS paradaId,
    pc.coletor_codigo AS codigo
FROM hub.parada_coletor pc
ORDER BY pc.parada_id, pc.coletor_codigo;


-- ============================================================
-- Q2: GET /bff/updates
-- Retorna notificações agrupáveis por data e tipo
-- ============================================================

SELECT
    id,
    titulo,
    meta_info    AS meta,
    texto        AS [text],
    usuario      AS [user],
    FORMAT(data_hora, 'HH:mm') AS [time],
    CASE
        WHEN tipo = 'pessoal' THEN 'Para mim'
        ELSE FORMAT(data_hora, 'dd ''de'' MMMM ''de'' yyyy', 'pt-BR')
    END AS dateLabel,
    tipo,
    data_hora
FROM hub.fato_notificacao
ORDER BY
    CASE WHEN tipo = 'pessoal' THEN 1 ELSE 0 END,
    data_hora DESC;


-- ============================================================
-- Q3: GET /bff/capex (Visão Geral)
-- Retorna dados consolidados para o CapexDashboard
-- ============================================================

-- Q3a: Outlook do ano
SELECT
    ano,
    outlook_brl_m,
    variacao_orcamento_perc,
    total_obras,
    obras_executadas
FROM hub.dim_capex_ano
WHERE ano = 2026;

-- Q3b: Tipos de obra
SELECT
    t.codigo     AS id,
    t.valor_brl_m,
    t.percentual
FROM hub.fato_capex_tipo_obra t
    INNER JOIN hub.dim_capex_ano a ON a.id = t.capex_ano_id
WHERE a.ano = 2026
ORDER BY t.valor_brl_m DESC;

-- Q3c: Composição (Serviços, Material, Facilidades)
SELECT
    c.categoria   AS label,
    c.percentual,
    c.valor_brl_m,
    c.variacao_perc
FROM hub.fato_capex_composicao c
    INNER JOIN hub.dim_capex_ano a ON a.id = c.capex_ano_id
WHERE a.ano = 2026
ORDER BY c.percentual DESC;

-- Q3d: Subsistemas
SELECT
    s.nome,
    s.codigo,
    s.valor_brl_m,
    s.percentual
FROM hub.fato_capex_subsistema s
    INNER JOIN hub.dim_capex_ano a ON a.id = s.capex_ano_id
WHERE a.ano = 2026
ORDER BY s.valor_brl_m DESC;

-- Q3e: Gráfico Capex Por Ano (série temporal)
SELECT
    ano   AS [year],
    valor_brl_m AS value
FROM hub.fato_capex_historico_anual
ORDER BY ano;
