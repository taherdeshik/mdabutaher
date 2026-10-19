/**
 * Database helper for shared hosting (cPanel).
 *
 *   node --env-file=.env scripts/db.mjs migrate            # data/db.json → MySQL
 *   node --env-file=.env scripts/db.mjs backup out.json    # MySQL → JSON file
 *   node --env-file=.env scripts/db.mjs restore in.json    # JSON file → MySQL
 *   node --env-file=.env scripts/db.mjs ping               # connection check
 *
 * Env: MYSQL_HOST MYSQL_PORT MYSQL_USER MYSQL_PASSWORD MYSQL_DATABASE [MYSQL_SSL=1]
 */
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import mysql from "mysql2/promise";

const DB_PATH = process.env.CIVIC_DATA_FILE || path.join(process.cwd(), "data", "db.json");

function pool() {
  if (!process.env.MYSQL_HOST || !process.env.MYSQL_DATABASE) {
    console.error("✗ MYSQL_HOST / MYSQL_DATABASE সেট করা নেই। .env ফাইল ব্যবহার করুন।");
    process.exit(1);
  }
  return mysql.createPool({
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    charset: "utf8mb4",
    connectionLimit: 2,
    ...(process.env.MYSQL_SSL === "1" ? { ssl: { rejectUnauthorized: false } } : {}),
  });
}

async function ensure(p) {
  await p.query(
    `CREATE TABLE IF NOT EXISTS civic_store (
       id TINYINT UNSIGNED NOT NULL PRIMARY KEY,
       doc LONGTEXT NOT NULL,
       updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
     ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  );
  await p.query("INSERT IGNORE INTO civic_store (id, doc) VALUES (1, '{}')");
}

async function readJson(file) {
  const raw = await fs.readFile(file, "utf8");
  const data = JSON.parse(raw);
  if (!data || typeof data !== "object") throw new Error("ফাইলটি বৈধ JSON নয়");
  return data;
}

async function getDoc(p) {
  const [rows] = await p.query("SELECT doc FROM civic_store WHERE id = 1");
  return rows.length ? String(rows[0].doc) : "{}";
}

async function putDoc(p, doc) {
  await p.query("UPDATE civic_store SET doc = ? WHERE id = 1", [JSON.stringify(doc)]);
}

const [command = "ping", arg] = process.argv.slice(2);
const p = pool();

try {
  await ensure(p);

  if (command === "ping") {
    const [rows] = await p.query("SELECT 1 AS ok");
    console.log(`✓ MySQL সংযোগ সফল (${process.env.MYSQL_DATABASE})`, rows[0]?.ok === 1 ? "" : rows);
  } else if (command === "migrate") {
    const file = arg || DB_PATH;
    const doc = await readJson(file);
    const existing = await getDoc(p);
    if (existing && existing !== "{}" && !process.argv.includes("--force")) {
      console.error(`✗ civic_store-এ আগে থেকেই ডেটা আছে। ওভাররাইট করতে --force দিন।`);
      process.exit(1);
    }
    doc.meta = { ...(doc.meta || {}), seeded: true };
    // Sessions belong to the old host; everyone signs in again after migration.
    delete doc.adminSessions;
    await putDoc(p, doc);
    console.log(`✓ ${file} → MySQL (${Object.keys(doc).length} টপ-লেভেল কী)`);
  } else if (command === "backup") {
    const file = arg || `backup-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.json`;
    const raw = await getDoc(p);
    await fs.mkdir(path.dirname(path.resolve(file)), { recursive: true });
    await fs.writeFile(file, raw, "utf8");
    console.log(`✓ ব্যাকআপ সংরক্ষিত: ${file} (${(Buffer.byteLength(raw) / 1024).toFixed(1)} KB)`);
  } else if (command === "restore") {
    if (!arg) {
      console.error("✗ ব্যবহার: node scripts/db.mjs restore backup.json");
      process.exit(1);
    }
    const doc = await readJson(arg);
    doc.meta = { ...(doc.meta || {}), seeded: true };
    await putDoc(p, doc);
    console.log(`✓ ${arg} → MySQL পুনরুদ্ধার সম্পন্ন`);
  } else {
    console.error("অজানা কমান্ড:", command);
    process.exit(1);
  }
} catch (error) {
  console.error("✗", error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await p.end().catch(() => undefined);
}
