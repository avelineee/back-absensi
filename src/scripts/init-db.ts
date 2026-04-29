import "dotenv/config";
import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "../db.js";

async function main() {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const sqlPath = join(__dirname, "..", "..", "..", "database.sql");
  console.log(`Menjalankan ${sqlPath} ...`);
  const sql = await readFile(sqlPath, "utf-8");
  await pool.query(sql);
  console.log("Skema dan data awal berhasil dibuat.");
  await pool.end();
}

main().catch((err) => {
  console.error("Gagal init DB:", err);
  process.exit(1);
});
