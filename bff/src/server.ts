import express, { json, Request, Response } from "express";
import cors from "cors";
import "dotenv/config";

import { buildEnvelope, publishEnvelope, startConsumer, IMessageEnvelope } from "./servicebus.js";
import { validateJwt, AuthenticatedRequest } from "./auth.js";
import { IParada, IUpdateGroup, ICapexData, IBffResponse, IServiceBusMeta } from "@hub/types";

const app = express();
const CORE_SERVICE_URL = process.env.CORE_SERVICE_URL || "http://localhost:5001";

// Helper para chamar o Core Service
async function callCore<T>(endpoint: string): Promise<T | null> {
  try {
    const res = await fetch(`${CORE_SERVICE_URL}${endpoint}`);
    if (!res.ok) return null;
    return await res.json() as T;
  } catch (e: any) {
    console.error(`[BFF] Erro ao chamar Core (${endpoint}):`, e.message);
    return null;
  }
}

app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:3000" }));
app.use(json());

// ------------------------------------------------------------
// DADOS MOCK (fallback quando o banco não está disponível)
// ------------------------------------------------------------
function getMockParadas(): { items: IParada[] } {
  return {
    items: [
      {
        "paradaId": 69,
        "embarcacao": "I. São Sebastião",
        "fel": "FECH",
        "coletores": [100],
        "condicao": "Seco",
        "inicioRP": "03/04/25",
        "terminoRP": "10/05/25",
        "durRP": 37,
        "realizado_brl_m": 18.0,
        "outlook_brl_m": 18.0,
        "re": "100%", "em": "-", "co": "-", "es": "-", "nc": "-",
        "heroImageKey": "rochedo-de-sao-paulo",
        "obra": { "matPerc": 100, "matTot": "1000/1000", "serPerc": 100, "serTot": "100/100", "facPerc": 100, "facTot": "20/20" },
        "gmud": { "tot": 70, "aprov": 70, "add": 40, "exc": 15, "alt": 10, "qbr": 5 }
      },
      {
        "paradaId": 70,
        "embarcacao": "P. Feiticeiras",
        "fel": "FECH",
        "coletores": [103],
        "condicao": "Seco",
        "inicioRP": "26/02/25",
        "terminoRP": "28/02/25",
        "durRP": 2,
        "realizado_brl_m": null,
        "outlook_brl_m": 2.3,
        "re": "-", "em": "30%", "co": "9%", "es": "12%", "nc": "49%",
        "heroImageKey": "parcel-das-feiticeiras",
        "obra": { "matPerc": 100, "matTot": "850/850", "serPerc": 100, "serTot": "45/45", "facPerc": 100, "facTot": "12/12" },
        "gmud": { "tot": 45, "aprov": 45, "add": 20, "exc": 10, "alt": 10, "qbr": 5 }
      },
      {
        "paradaId": 75,
        "embarcacao": "P. Bandolim",
        "fel": "FECH",
        "coletores": [100, 101],
        "condicao": "Molhado",
        "inicioRP": "30/04/25",
        "terminoRP": "06/05/25",
        "durRP": 6,
        "realizado_brl_m": 1.7,
        "outlook_brl_m": 3.1,
        "re": "54%", "em": "7%", "co": "11%", "es": "2%", "nc": "79%",
        "heroImageKey": "parcel-do-bandolim",
        "obra": { "matPerc": 100, "matTot": "500/500", "serPerc": 100, "serTot": "80/80", "facPerc": 100, "facTot": "15/15" },
        "gmud": { "tot": 30, "aprov": 30, "add": 15, "exc": 5, "alt": 8, "qbr": 2 }
      },
      {
        "paradaId": 76,
        "embarcacao": "P. Meros",
        "fel": "FECH",
        "coletores": [301],
        "condicao": "Seco",
        "inicioRP": "26/05/25",
        "terminoRP": "12/06/25",
        "durRP": 17,
        "realizado_brl_m": 13.6,
        "outlook_brl_m": 13.6,
        "re": "100%", "em": "-", "co": "-", "es": "-", "nc": "-",
        "heroImageKey": "parcel-dos-meros",
        "obra": { "matPerc": 100, "matTot": "1200/1200", "serPerc": 100, "serTot": "150/150", "facPerc": 100, "facTot": "30/30" },
        "gmud": { "tot": 85, "aprov": 85, "add": 50, "exc": 20, "alt": 10, "qbr": 5 }
      },
      {
        "paradaId": 79,
        "embarcacao": "I. Trindade",
        "fel": "FEL-4",
        "coletores": [101],
        "condicao": "Seco",
        "inicioRP": "30/09/25",
        "terminoRP": "08/11/25",
        "durRP": 39,
        "realizado_brl_m": 7.1,
        "outlook_brl_m": 9.5,
        "re": "74%", "em": "14%", "co": "4%", "es": "9%", "nc": "73%",
        "heroImageKey": "rochedo-sao-pedro",
        "obra": { "matPerc": 85, "matTot": "850/1000", "serPerc": 70, "serTot": "70/100", "facPerc": 90, "facTot": "18/20" },
        "gmud": { "tot": 60, "aprov": 50, "add": 30, "exc": 10, "alt": 8, "qbr": 2 }
      },
      {
        "paradaId": 82,
        "embarcacao": "P. Timbebas",
        "fel": "FEL-3",
        "coletores": [100, 101, 103],
        "condicao": "Molhado",
        "inicioRP": "06/11/25",
        "terminoRP": "09/02/26",
        "durRP": 95,
        "realizado_brl_m": 6.9,
        "outlook_brl_m": 31.3,
        "re": "22%", "em": "-", "co": "12%", "es": "7%", "nc": "80%",
        "heroImageKey": "parcel-das-timbebas",
        "obra": { "matPerc": 40, "matTot": "400/1000", "serPerc": 15, "serTot": "15/100", "facPerc": 30, "facTot": "6/20" },
        "gmud": { "tot": 40, "aprov": 25, "add": 15, "exc": 5, "alt": 3, "qbr": 2 }
      },
      {
        "paradaId": 83,
        "embarcacao": "P. Bandolim",
        "fel": "FEL-3",
        "coletores": [301],
        "condicao": "Seco",
        "inicioRP": "12/12/25",
        "terminoRP": "25/02/26",
        "durRP": 75,
        "realizado_brl_m": 12.0,
        "outlook_brl_m": 31.6,
        "re": "38%", "em": "3%", "co": "2%", "es": "6%", "nc": "88%",
        "heroImageKey": "parcel-do-bandolim",
        "obra": { "matPerc": 60, "matTot": "600/1000", "serPerc": 30, "serTot": "30/100", "facPerc": 55, "facTot": "11/20" },
        "gmud": { "tot": 70, "aprov": 56, "add": 32, "exc": 14, "alt": 7, "qbr": 3 }
      },
      {
        "paradaId": 88,
        "embarcacao": "P. Feiticeiras",
        "fel": "FEL-1",
        "coletores": [102, 103],
        "condicao": "Seco",
        "inicioRP": "01/07/26",
        "terminoRP": "28/07/26",
        "durRP": 28,
        "realizado_brl_m": 0.0,
        "outlook_brl_m": 0.0,
        "re": "0%", "em": "34%", "co": "0%", "es": "0%", "nc": "67%",
        "heroImageKey": "parcel-das-feiticeiras",
        "obra": { "matPerc": 0, "matTot": "0/1000", "serPerc": 0, "serTot": "0/100", "facPerc": 0, "facTot": "0/20" },
        "gmud": { "tot": 0, "aprov": 0, "add": 0, "exc": 0, "alt": 0, "qbr": 0 }
      },
      {
        "paradaId": 89,
        "embarcacao": "I. Tinharé",
        "fel": "FECH",
        "coletores": [100, 101, 102],
        "condicao": "Molhado",
        "inicioRP": "20/10/25",
        "terminoRP": "09/11/25",
        "durRP": 20,
        "realizado_brl_m": 3.5,
        "outlook_brl_m": 3.5,
        "re": "100%", "em": "-", "co": "-", "es": "-", "nc": "-",
        "heroImageKey": "parcel-das-paredes",
        "obra": { "matPerc": 100, "matTot": "400/400", "serPerc": 100, "serTot": "50/50", "facPerc": 100, "facTot": "10/10" },
        "gmud": { "tot": 25, "aprov": 25, "add": 10, "exc": 8, "alt": 5, "qbr": 2 }
      },
      {
        "paradaId": 97,
        "embarcacao": "P. Manuel Luiz",
        "fel": "FEL-1",
        "coletores": [102, 103, 105],
        "condicao": "Seco",
        "inicioRP": "06/08/26",
        "terminoRP": "02/09/26",
        "durRP": 28,
        "realizado_brl_m": 0.7,
        "outlook_brl_m": 18.1,
        "re": "4%", "em": "22%", "co": "11%", "es": "28%", "nc": "35%",
        "heroImageKey": "parcel-dos-reis",
        "obra": { "matPerc": 5, "matTot": "50/1000", "serPerc": 0, "serTot": "0/100", "facPerc": 0, "facTot": "0/20" },
        "gmud": { "tot": 0, "aprov": 0, "add": 0, "exc": 0, "alt": 0, "qbr": 0 }
      },
      {
        "paradaId": 135,
        "embarcacao": "I. Mosqueiro",
        "fel": "FEL-0",
        "coletores": [102, 103],
        "condicao": "Seco",
        "inicioRP": "01/04/27",
        "terminoRP": "28/04/27",
        "durRP": 28,
        "realizado_brl_m": 0.1,
        "outlook_brl_m": 13.4,
        "re": "1%", "em": "0%", "co": "0%", "es": "2%", "nc": "97%",
        "heroImageKey": "parcel-dos-meros",
        "obra": { "matPerc": 0, "matTot": "0/500", "serPerc": 0, "serTot": "0/50", "facPerc": 0, "facTot": "0/10" },
        "gmud": { "tot": 0, "aprov": 0, "add": 0, "exc": 0, "alt": 0, "qbr": 0 }
      }
    ]
  };
}

function getMockUpdates(): { groups: IUpdateGroup[] } {
  return {
    groups: [
      {
        dateLabel: "26 de Novembro de 2025",
        items: [
          { title: "Serviço Atualizado", meta: "029 | A. Abrolhos | FEL-2", text: "Foi adicionado 2 materiais vinculados a linha de serviço.", user: "Daniel Santos", time: "11:15" },
          { title: "Parada Cancelada", meta: "033 | I. São sebastião | FEL 1", text: "Justificativa anexada", user: "Leonardo Silva", time: "09:09" }
        ]
      },
      {
        dateLabel: "25 de Novembro de 2025",
        items: [
          { title: "Nova GMUD aberta", meta: "026 | P. dos Reis | FEL-4", text: "Foi adicionado 2 materiais vinculados a linha de serviço.", user: "Guilherme Abreu", time: "11:15" }
        ]
      },
      {
        dateLabel: "Para mim",
        items: [
          { title: "Pendência atribuída", meta: "160 | P. dos Reis | FEL-4", text: "Você foi mencionado em uma atualização.", user: "Sistema", time: "08:40" }
        ]
      }
    ]
  };
}

// ------------------------------------------------------------
// CACHE (DEV): último payload consumido da fila
// ------------------------------------------------------------
let lastParadasFromQueue: { items: IParada[] } | null = null;
let lastParadasMeta: IServiceBusMeta | null = null;

app.get("/health", (req, res) => res.json({ ok: true }));

// GET /bff/paradas — Core Service > Service Bus > Mock
app.get("/bff/paradas", validateJwt, async (req: AuthenticatedRequest, res: Response) => {
  // 1. Tenta o Core Service (Business Logic + DB)
  const fromCore = await callCore<{ items: IParada[] }>("/core/paradas");
  if (fromCore) {
    return res.json({ meta: { source: "database" }, ...fromCore });
  }

  // 2. Tenta cache do Service Bus
  if (lastParadasFromQueue) {
    return res.json({
      meta: { source: "servicebus", lastConsumed: lastParadasMeta || null },
      ...lastParadasFromQueue
    });
  }

  // 3. Fallback para mock local
  return res.json({ meta: { source: "mock" }, ...getMockParadas() });
});

// GET /bff/updates — Core Service > Mock
app.get("/bff/updates", validateJwt, async (req: AuthenticatedRequest, res: Response) => {
  const fromCore = await callCore<{ groups: IUpdateGroup[] }>("/core/updates");
  if (fromCore) {
    return res.json({ meta: { source: "database" }, ...fromCore });
  }
  return res.json({ meta: { source: "mock" }, ...getMockUpdates() });
});

// GET /bff/capex — Core Service > Mock (hardcoded no CapexDashboard)
app.get("/bff/capex", validateJwt, async (req: AuthenticatedRequest, res: Response) => {
  const ano = parseInt(req.query.ano as string) || 2026;
  const fromCore = await callCore<ICapexData>(`/core/capex?ano=${ano}`);
  if (fromCore) {
    return res.json({ meta: { source: "database" }, ...fromCore });
  }
  // Fallback: dados mínimos para o CapexDashboard funcionar
  return res.json({
    meta: { source: "mock" },
    outlook: { ano: 2026, outlook_brl_m: 265.6, variacao_orcamento_perc: -3.0, total_obras: 47, obras_executadas: 23 },
    tipos: [
      { id: 'MC', valor_brl_m: 45.1, percentual: 40 },
      { id: 'DE', valor_brl_m: 69.2, percentual: 25 },
      { id: 'DI', valor_brl_m: 11.2, percentual: 20 },
      { id: 'PP', valor_brl_m: 128.8, percentual: 10 },
      { id: 'UP', valor_brl_m: 11.3, percentual: 5 },
    ],
    composicao: [
      { label: 'Material', percentual: 60, valor_brl_m: 149.8, variacao_perc: -4 },
      { label: 'Serviços', percentual: 25, valor_brl_m: 62.4, variacao_perc: 1 },
      { label: 'Facilidades', percentual: 15, valor_brl_m: 37.4, variacao_perc: -3 },
    ],
    subsistemas: [
      { nome: 'Propulsão', codigo: '630.001', valor_brl_m: 22, percentual: 85 },
      { nome: 'Motor Principal de Diesel', codigo: '600.001', valor_brl_m: 17, percentual: 70 },
      { nome: 'Geradores principais', codigo: '610.001', valor_brl_m: 12, percentual: 55 },
      { nome: 'Convés', codigo: '540.002', valor_brl_m: 5, percentual: 25 },
      { nome: 'Side Thrusters', codigo: '630.005', valor_brl_m: 3, percentual: 15 },
    ],
    historico: [
      { year: 2025, value: 197.3 },
      { year: 2026, value: 279.7 },
      { year: 2027, value: 203.7 },
      { year: 2028, value: 192.8 },
      { year: 2029, value: 177.7 },
    ]
  });
});

// Publica o snapshot atual (mock) na fila SGO (DEV)
app.post("/bff/paradas/publish", async (req: Request, res: Response) => {
  try {
    const queueName = process.env.SB_QUEUE_SGO;
    const connStr = process.env.SB_SEND_CONNECTION_STRING;
    const producer = process.env.SB_PRODUCER || "HubBFF";
    if (!queueName) throw new Error("SB_QUEUE_SGO não configurada");
    if (!connStr) throw new Error("SB_SEND_CONNECTION_STRING não configurada");

    const payload = getMockParadas();
    const envelope = buildEnvelope({
      queueName,
      producer,
      schemaName: "ParadasSnapshot",
      schemaVersion: "1.0",
      payload
    });

    const ids = await publishEnvelope({ connectionString: connStr, queueName, envelope });
    return res.json({ ok: true, queueName, ...ids });
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: e instanceof Error ? e.message : String(e) });
  }
});

// Endpoint de debug: retorna o último envelope consumido (meta + data)
app.get("/bff/paradas/last-consumed", (req: Request, res: Response) => {
  return res.json({ ok: true, meta: lastParadasMeta, data: lastParadasFromQueue });
});

// Consumer DEV: lê da fila SGO e atualiza cache
let consumerHandle: { stop: () => Promise<void> } | null = null;
function tryStartDevConsumer() {
  const connStr = process.env.SB_LISTEN_CONNECTION_STRING;
  const queueName = process.env.SB_QUEUE_SGO;

  // Se não configurou, segue sem consumer (front continuará usando mock local)
  if (!connStr || !queueName) {
    console.log("[SB] Consumer não iniciado (faltou SB_LISTEN_CONNECTION_STRING ou SB_QUEUE_SGO)");
    return;
  }

  const supportedSchemas = new Set(["ParadasSnapshot@1.0"]);
  consumerHandle = startConsumer({
    connectionString: connStr,
    queueName,
    supportedSchemas,
    onValidEnvelope: async (env: IMessageEnvelope, msg: any) => {
      lastParadasFromQueue = env.payload;
      lastParadasMeta = {
        messageId: msg.messageId,
        correlationId: msg.correlationId,
        deliveryCount: msg.deliveryCount,
        enqueuedTimeUtc: msg.enqueuedTimeUtc,
        occurredAt: env.occurredAt,
        producer: env.producer,
        schemaName: env.schemaName,
        schemaVersion: env.schemaVersion
      };
      console.log(`[SB] Consumed ${msg.messageId} (${env.schemaName}@${env.schemaVersion})`);
    },
    onError: (err) => console.error("[SB] Consumer error:", err)
  });

  console.log(`[SB] Consumer ativo na fila ${queueName}`);
}

const port = process.env.PORT_BFF || 4000;
app.listen(port, () => {
  console.log(`BFF on http://localhost:${port}`);
  
  if (process.env.SB_CONSUMER_ENABLED !== "false") {
    tryStartDevConsumer();
  } else {
    console.log("[SB] Consumer interno desativado por flag SB_CONSUMER_ENABLED");
  }
});

process.on("SIGINT", async () => {
  if (consumerHandle?.stop) await consumerHandle.stop();
  process.exit(0);
});
