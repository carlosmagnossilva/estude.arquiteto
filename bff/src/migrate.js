/**
 * migrate.js – Executa DDL + Seed no Azure SQL
 * Roda com: node migrate.js
 * Requer que bff/.env esteja preenchido com SQL_SERVER, SQL_DATABASE, SQL_USER, SQL_PASSWORD
 */

import sql from "mssql";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import "dotenv/config";

const __dirname = dirname(fileURLToPath(import.meta.url));

const config = {
  server:   process.env.SQL_SERVER,
  database: process.env.SQL_DATABASE,
  user:     process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  options: {
    encrypt: true,
    trustServerCertificate: false,
    requestTimeout: 60000,
    connectionTimeout: 30000,
  },
};

// ============================================================
// Lê um arquivo SQL e divide em batches por GO
// (O driver mssql não suporta GO nativamente)
// ============================================================
function parseSqlBatches(filePath) {
  const content = readFileSync(filePath, "utf-8");
  return content
    .split(/^\s*GO\s*$/im)
    .map(b => b
      .split("\n")
      .filter(l => !l.trim().startsWith("--") || l.trim() === "")
      .join("\n")
      .trim()
    )
    .filter(b => b.length > 0);
}

async function runFile(pool, filePath, label) {
  console.log(`\n📄 Executando ${label}...`);
  const batches = parseSqlBatches(filePath);
  console.log(`   ${batches.length} batches encontrados`);

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    try {
      await pool.request().query(batch);
      process.stdout.write(".");
    } catch (err) {
      // Ignora erros de objeto já existente (idempotência)
      const ignorable = [
        "There is already an object named",
        "Cannot insert duplicate key",
        "already exists",
        "Violation of UNIQUE KEY",
      ];
      const msgIgnore = ignorable.some(s => err.message?.includes(s));
      if (msgIgnore) {
        process.stdout.write("s"); // skipped
      } else {
        console.error(`\n❌ Batch ${i + 1} falhou:`);
        console.error("SQL:", batch.substring(0, 200));
        console.error("Erro:", err.message);
      }
    }
  }
  console.log("\n   ✅ Concluído");
}

async function main() {
  if (!config.server) {
    console.error("❌ SQL_SERVER não configurado no .env");
    process.exit(1);
  }

  console.log(`🔌 Conectando a ${config.server}/${config.database}...`);
  let pool;
  try {
    pool = await sql.connect(config);
    console.log("✅ Conectado!");
  } catch (err) {
    console.error("❌ Conexão falhou:", err.message);
    process.exit(1);
  }

  const ddlPath  = resolve(__dirname, "..", "..", "db", "migrations", "01_create_tables.sql");
  const seedPath = resolve(__dirname, "..", "..", "db", "migrations", "02_seed_data.sql");

  await runFile(pool, ddlPath,  "01_create_tables.sql");
  await runFile(pool, seedPath, "02_seed_data.sql");

  // Validação final
  console.log("\n🔍 Validação dos dados carregados:");
  const checks = [
    { label: "Fases FEL",    sql: "SELECT COUNT(*) AS n FROM hub.dim_fase_fel" },
    { label: "Embarcações",  sql: "SELECT COUNT(*) AS n FROM hub.dim_embarcacao" },
    { label: "Paradas",      sql: "SELECT COUNT(*) AS n FROM hub.fato_parada" },
    { label: "Coletores",    sql: "SELECT COUNT(*) AS n FROM hub.parada_coletor" },
    { label: "Obra progresso", sql: "SELECT COUNT(*) AS n FROM hub.fato_obra_progresso" },
    { label: "GMUDs",        sql: "SELECT COUNT(*) AS n FROM hub.fato_gmud" },
    { label: "Capex ano",    sql: "SELECT COUNT(*) AS n FROM hub.dim_capex_ano" },
    { label: "Notificações", sql: "SELECT COUNT(*) AS n FROM hub.fato_notificacao" },
  ];
  for (const c of checks) {
    const result = await pool.request().query(c.sql);
    console.log(`   ${c.label}: ${result.recordset[0].n} registros`);
  }

  await pool.close();
  console.log("\n🎉 Migração concluída com sucesso!");
}

main().catch(e => { console.error(e); process.exit(1); });
