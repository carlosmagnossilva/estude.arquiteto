import sql, { config as SqlConfig, ConnectionPool } from "mssql";
import "dotenv/config";
import { IParada, IUpdateGroup, ICapexData } from "@hub/types";

const config: SqlConfig = {
  server:   process.env.SQL_SERVER || "",
  database: process.env.SQL_DATABASE || "",
  user:     process.env.SQL_USER || "",
  password: process.env.SQL_PASSWORD || "",
  options: {
    encrypt: true,
    trustServerCertificate: false,
    requestTimeout: 15000,
    connectTimeout: 15000,
  },
  pool: {
    max: 5,
    min: 1,
    idleTimeoutMillis: 30000,
  },
};

let _pool: ConnectionPool | null = null;

export async function getPool(): Promise<ConnectionPool | null> {
  if (!config.server || !config.database) return null;
  if (!_pool) {
    try {
      _pool = await sql.connect(config);
      console.log(`[DB-CORE] Conectado a ${config.server}`);
    } catch (err: any) {
      console.error("[DB-CORE] Falha na conexão:", err.message);
      _pool = null;
    }
  }
  return _pool;
}

export async function closePool() {
  if (_pool) {
    await _pool.close();
    _pool = null;
  }
}

// QUERIES SQL (migradas do BFF)

const SQL_PARADAS = `
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
    CASE WHEN p.re_perc IS NULL THEN '-' ELSE CONCAT(CAST(CAST(p.re_perc AS INT) AS VARCHAR), '%') END AS re,
    CASE WHEN p.em_perc IS NULL THEN '-' ELSE CONCAT(CAST(CAST(p.em_perc AS INT) AS VARCHAR), '%') END AS em,
    CASE WHEN p.co_perc IS NULL THEN '-' ELSE CONCAT(CAST(CAST(p.co_perc AS INT) AS VARCHAR), '%') END AS co,
    CASE WHEN p.es_perc IS NULL THEN '-' ELSE CONCAT(CAST(CAST(p.es_perc AS INT) AS VARCHAR), '%') END AS es,
    CASE WHEN p.nc_perc IS NULL THEN '-' ELSE CONCAT(CAST(CAST(p.nc_perc AS INT) AS VARCHAR), '%') END AS nc,
    op.mat_realizado, op.mat_total,
    op.ser_realizado, op.ser_total,
    op.fac_realizado, op.fac_total,
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
`;

const SQL_COLETORES = `
SELECT parada_id AS paradaId, coletor_codigo AS codigo
FROM hub.parada_coletor
ORDER BY parada_id, coletor_codigo;
`;

const SQL_NOTIFICACOES = `
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
`;

const SQL_CAPEX_ANO = `SELECT ano, outlook_brl_m, variacao_orcamento_perc, total_obras, obras_executadas FROM hub.dim_capex_ano WHERE ano = @ano;`;
const SQL_CAPEX_TIPOS = `SELECT t.codigo AS id, t.valor_brl_m, t.percentual FROM hub.fato_capex_tipo_obra t INNER JOIN hub.dim_capex_ano a ON a.id = t.capex_ano_id WHERE a.ano = @ano ORDER BY t.valor_brl_m DESC;`;
const SQL_CAPEX_COMPOSICAO = `SELECT c.categoria AS label, c.percentual, c.valor_brl_m, c.variacao_perc FROM hub.fato_capex_composicao c INNER JOIN hub.dim_capex_ano a ON a.id = c.capex_ano_id WHERE a.ano = @ano ORDER BY c.percentual DESC;`;
const SQL_CAPEX_SUBSISTEMAS = `SELECT s.nome, s.codigo, s.valor_brl_m, s.percentual FROM hub.fato_capex_subsistema s INNER JOIN hub.dim_capex_ano a ON a.id = s.capex_ano_id WHERE a.ano = @ano ORDER BY s.valor_brl_m DESC;`;
const SQL_CAPEX_HISTORICO = `SELECT ano AS [year], valor_brl_m AS value FROM hub.fato_capex_historico_anual ORDER BY ano;`;

export async function queryParadas(): Promise<{ items: IParada[] } | null> {
  const pool = await getPool();
  if (!pool) return null;
  const [paradasResult, coletoresResult] = await Promise.all([
    pool.request().query(SQL_PARADAS),
    pool.request().query(SQL_COLETORES),
  ]);
  const coletoresMap: Record<number, string[]> = {};
  for (const row of coletoresResult.recordset) {
    if (!coletoresMap[row.paradaId]) coletoresMap[row.paradaId] = [];
    coletoresMap[row.paradaId].push(row.codigo);
  }
  const items: IParada[] = paradasResult.recordset.map((r) => ({
    paradaId:        r.paradaId,
    embarcacao:      r.embarcacao,
    heroImageKey:    r.heroImageKey,
    fel:             r.fel,
    coletores:       (coletoresMap[r.paradaId] || []).map(Number),
    condicao:        r.condicao,
    inicioRP:        r.inicioRP,
    terminoRP:       r.terminoRP,
    durRP:           r.durRP,
    realizado_brl_m: r.realizado_brl_m,
    outlook_brl_m:   r.outlook_brl_m,
    re: r.re, em: r.em, co: r.co, es: r.es, nc: r.nc,
    obra: {
      matPerc: r.mat_total > 0 ? Math.round((r.mat_realizado / r.mat_total) * 100) : 0,
      matTot:  `${r.mat_realizado}/${r.mat_total}`,
      serPerc: r.ser_total > 0 ? Math.round((r.ser_realizado / r.ser_total) * 100) : 0,
      serTot:  `${r.ser_realizado}/${r.ser_total}`,
      facPerc: r.fac_total > 0 ? Math.round((r.fac_realizado / r.fac_total) * 100) : 0,
      facTot:  `${r.fac_realizado}/${r.fac_total}`,
    },
    gmud: {
      tot:   r.gmud_tot   ?? 0,
      aprov: r.gmud_aprov ?? 0,
      add:   r.gmud_add   ?? 0,
      exc:   r.gmud_exc   ?? 0,
      alt:   r.gmud_alt   ?? 0,
      qbr:   r.gmud_qbr   ?? 0,
    },
  }));
  return { items };
}

export async function queryUpdates(): Promise<{ groups: IUpdateGroup[] } | null> {
  const pool = await getPool();
  if (!pool) return null;
  const result = await pool.request().query(SQL_NOTIFICACOES);
  const groupMap = new Map<string, any[]>();
  for (const row of result.recordset) {
    const label = row.dateLabel;
    if (!groupMap.has(label)) groupMap.set(label, []);
    groupMap.get(label)!.push({
      title: row.titulo,
      meta:  row.meta,
      text:  row.text,
      user:  row.user,
      time:  row.time,
    });
  }
  return { groups: Array.from(groupMap, ([dateLabel, items]) => ({ dateLabel, items })) };
}

export async function queryCapex(ano: number = 2026): Promise<ICapexData | null> {
  const pool = await getPool();
  if (!pool) return null;
  const [outlookRes, tiposRes, composicaoRes, subsRes, histRes] = await Promise.all([
    pool.request().input("ano", sql.Int, ano).query(SQL_CAPEX_ANO),
    pool.request().input("ano", sql.Int, ano).query(SQL_CAPEX_TIPOS),
    pool.request().input("ano", sql.Int, ano).query(SQL_CAPEX_COMPOSICAO),
    pool.request().input("ano", sql.Int, ano).query(SQL_CAPEX_SUBSISTEMAS),
    pool.request().query(SQL_CAPEX_HISTORICO),
  ]);
  return {
    outlook:     outlookRes.recordset[0] || null,
    tipos:       tiposRes.recordset,
    composicao:  composicaoRes.recordset,
    subsistemas: subsRes.recordset,
    historico:   histRes.recordset,
  };
}
