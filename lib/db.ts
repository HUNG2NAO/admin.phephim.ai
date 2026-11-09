import { Pool, type PoolClient } from "pg";

const globalPool = globalThis as typeof globalThis & { __phephimAdminPool?: Pool };

export function getPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is missing");
  if (!globalPool.__phephimAdminPool) {
    globalPool.__phephimAdminPool = new Pool({
      connectionString,
      max: 3,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 7_000,
      ssl: connectionString.includes("sslmode=") ? undefined : { rejectUnauthorized: true },
      application_name: "phephim-admin",
    });
  }
  return globalPool.__phephimAdminPool;
}

export async function withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK").catch((rollbackError) => console.error("Rollback failed:", rollbackError));
    throw error;
  } finally {
    client.release();
  }
}
