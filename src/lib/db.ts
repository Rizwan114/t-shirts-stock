import bcrypt from "bcryptjs";

const useTurso = !!process.env.TURSO_DATABASE_URL;

interface Database {
  execute(stmtOrSql: string | { sql: string; args?: (string | number | null | Uint8Array)[] }): Promise<{
    rows: Record<string, unknown>[];
    rowsAffected: number;
    lastInsertRowid: number | bigint;
  }>;
}

let db: Database | null = null;

async function getTursoDb(): Promise<Database> {
  const { createClient } = await import("@libsql/client/http");
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  return {
    async execute(stmtOrSql: string | { sql: string; args?: (string | number | null | Uint8Array)[] }) {
      const result = typeof stmtOrSql === "string"
        ? await client.execute(stmtOrSql)
        : await client.execute(stmtOrSql);
      return {
        rows: result.rows,
        rowsAffected: result.rowsAffected,
        lastInsertRowid: result.lastInsertRowid ?? 0,
      };
    },
  };
}

async function getLocalDb(): Promise<Database> {
  const initSqlJs = (await import("sql.js")).default;
  const fs = await import("fs");
  const path = await import("path");

  const DB_FILENAME = "tshirts-stock.db";
  const WASM_FILENAME = "sql-wasm.wasm";
  const dbPath = path.join(process.cwd(), DB_FILENAME);
  const wasmPath = path.join(process.cwd(), "node_modules", "sql.js", "dist", WASM_FILENAME);

  let wasmBinary: Buffer;
  try {
    wasmBinary = fs.readFileSync(wasmPath);
  } catch {
    const res = await fetch(`https://cdn.jsdelivr.net/npm/sql.js@1.14.1/dist/${WASM_FILENAME}`);
    const arr = await res.arrayBuffer();
    wasmBinary = Buffer.from(arr);
  }

  const sqlInstance = await initSqlJs({ wasmBinary });

  let sqlDb: import("sql.js").Database;
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    sqlDb = new sqlInstance.Database(buffer);
  } else {
    sqlDb = new sqlInstance.Database();
  }

  function persist() {
    try {
      const data = sqlDb.export();
      const buffer = Buffer.from(data);
      const tmpPath = dbPath + ".tmp";
      fs.writeFileSync(tmpPath, buffer);
      fs.renameSync(tmpPath, dbPath);
    } catch (err) {
      console.error("[DB] Failed to persist database:", err);
    }
  }

  process.on("exit", () => persist());
  process.on("SIGINT", () => { persist(); process.exit(0); });
  process.on("SIGTERM", () => { persist(); process.exit(0); });

  return {
    execute(stmtOrSql: string | { sql: string; args?: (string | number | null | Uint8Array)[] }) {
      const sqlStr = typeof stmtOrSql === "string" ? stmtOrSql : stmtOrSql.sql;
      const args = typeof stmtOrSql === "string" ? [] : (stmtOrSql.args || []);

      const isSelect = sqlStr.trim().toUpperCase().startsWith("SELECT");

      if (isSelect) {
        const stmt = sqlDb.prepare(sqlStr);
        stmt.bind(args as (string | number | null)[]);
        const rows: Record<string, unknown>[] = [];
        while (stmt.step()) {
          rows.push(stmt.getAsObject());
        }
        stmt.free();
        return Promise.resolve({ rows, rowsAffected: 0, lastInsertRowid: 0 });
      }

      sqlDb.run(sqlStr, args as (string | number | null)[]);
      const changesResult = sqlDb.exec("SELECT changes() as changes, last_insert_rowid() as id");
      const changes = (changesResult[0]?.values[0]?.[0] as number) || 0;
      const lastInsertRowid = (changesResult[0]?.values[0]?.[1] as number) || 0;

      persist();
      return Promise.resolve({ rows: [], rowsAffected: changes, lastInsertRowid });
    },
  };
}

async function getQueryDb(): Promise<Database> {
  if (db) return db;
  db = useTurso ? await getTursoDb() : await getLocalDb();
  return db;
}

export async function initializeDb(): Promise<void> {
  const c = await getQueryDb();

  await c.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await c.execute(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      barcode TEXT UNIQUE NOT NULL,
      size TEXT NOT NULL,
      color TEXT NOT NULL DEFAULT 'White',
      stock INTEGER NOT NULL DEFAULT 0,
      price REAL NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await c.execute(`
    CREATE TABLE IF NOT EXISTS stock_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      note TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    )
  `);

  const countResult = await c.execute("SELECT COUNT(*) as count FROM users");
  const count = countResult.rows[0]?.count || 0;
  if (Number(count) === 0) {
    const hashed = bcrypt.hashSync("admin123", 10);
    await c.execute({
      sql: "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
      args: ["admin", hashed, "admin"],
    });
  }
}

let initDone = false;

export async function getDb(): Promise<Database> {
  const c = await getQueryDb();
  if (!initDone) {
    await initializeDb();
    initDone = true;
  }
  return c;
}

export function saveDb(): void {}

export async function queryAll<T = Record<string, unknown>>(_database: unknown, sql: string, params: unknown[] = []): Promise<T[]> {
  const c = await getQueryDb();
  const result = await c.execute({ sql, args: params as (string | number | null)[] });
  return result.rows as T[];
}

export async function queryOne<T = Record<string, unknown>>(_database: unknown, sql: string, params: unknown[] = []): Promise<T | null> {
  const rows = await queryAll<T>(_database, sql, params);
  return rows.length > 0 ? rows[0] : null;
}

export async function run(_database: unknown, sql: string, params: unknown[] = []): Promise<{ changes: number; lastInsertRowid: number }> {
  const c = await getQueryDb();
  const result = await c.execute({ sql, args: params as (string | number | null)[] });
  return {
    changes: Number(result.rowsAffected),
    lastInsertRowid: Number(result.lastInsertRowid),
  };
}
