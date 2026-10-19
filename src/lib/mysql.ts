import mysql, { type Pool, type RowDataPacket } from "mysql2/promise";

/**
 * Optional MySQL/MariaDB storage for shared hosting.
 *
 * The whole civic database is stored as one JSON document in a single row and
 * updated inside a transaction with `SELECT … FOR UPDATE`. That keeps the
 * existing `read / mutate` contract, gives cross-process safety and works on
 * cPanel's MariaDB without extra services. For very large deployments, swap
 * this module for a normalised Postgres/Supabase adapter.
 */

export function mysqlEnabled() {
  return Boolean(process.env.MYSQL_HOST && process.env.MYSQL_DATABASE);
}

let pool: Pool | null = null;
let ready: Promise<void> | null = null;

function getPool() {
  if (pool) return pool;
  pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    waitForConnections: true,
    connectionLimit: Number(process.env.MYSQL_POOL || 5),
    charset: "utf8mb4",
    ...(process.env.MYSQL_SSL === "1" ? { ssl: { rejectUnauthorized: false } } : {}),
  });
  return pool;
}

async function ensureStore() {
  if (!ready) {
    ready = (async () => {
      const p = getPool();
      await p.query(
        `CREATE TABLE IF NOT EXISTS civic_store (
           id TINYINT UNSIGNED NOT NULL PRIMARY KEY,
           doc LONGTEXT NOT NULL,
           updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
         ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      );
      await p.query("INSERT IGNORE INTO civic_store (id, doc) VALUES (1, '{}')");
    })();
  }
  return ready;
}

export async function mysqlLoad(): Promise<string | null> {
  await ensureStore();
  const [rows] = await getPool().query<RowDataPacket[]>("SELECT doc FROM civic_store WHERE id = 1");
  return rows.length ? String(rows[0].doc) : null;
}

/** Transactional read-modify-write with a row lock. */
export async function mysqlMutate<T>(fn: (raw: string) => Promise<{ result: T; next: string }>): Promise<T> {
  await ensureStore();
  const conn = await getPool().getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.query<RowDataPacket[]>("SELECT doc FROM civic_store WHERE id = 1 FOR UPDATE");
    const raw = rows.length ? String(rows[0].doc) : "{}";
    const { result, next } = await fn(raw);
    await conn.query("UPDATE civic_store SET doc = ? WHERE id = 1", [next]);
    await conn.commit();
    return result;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

export async function mysqlHealth() {
  await ensureStore();
  const [rows] = await getPool().query<RowDataPacket[]>("SELECT 1 AS ok");
  return Boolean(rows[0]?.ok);
}

export async function mysqlBackup(): Promise<string> {
  const doc = await mysqlLoad();
  return doc || "{}";
}
