import express, { Request, Response } from "express";
import cors from "cors";
import "dotenv/config";
import { queryParadas, queryUpdates, queryCapex, closePool } from "./db.js";

const app = express();
const port = process.env.PORT || 5001;

app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:4000" }));
app.use(express.json());

// Endpoints internos do Core
app.get("/core/paradas", async (req: Request, res: Response) => {
  try {
    const data = await queryParadas();
    if (!data) return res.status(503).json({ error: "Banco de dados indisponível" });
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
  }
});

app.get("/core/updates", async (req: Request, res: Response) => {
  try {
    const data = await queryUpdates();
    if (!data) return res.status(503).json({ error: "Banco de dados indisponível" });
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
  }
});

app.get("/core/capex", async (req: Request, res: Response) => {
  const ano = parseInt(req.query.ano as string) || 2026;
  try {
    const data = await queryCapex(ano);
    if (!data) return res.status(503).json({ error: "Banco de dados indisponível" });
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
  }
});

app.get("/health", (req: Request, res: Response) => res.json({ status: "ok", service: "hub-core" }));

app.listen(port, () => {
  console.log(`[CORE] Hub Core Service rodando na porta ${port}`);
});

process.on("SIGINT", async () => {
  await closePool();
  process.exit(0);
});
