import { Pool } from "pg";

// Conexión reutilizada entre invocaciones (evita abrir una conexión nueva
// en cada request, que agotaría el límite de conexiones de Neon rápido).
let pool;
function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });
  }
  return pool;
}

// Nunca debe romper el chat si falla — registrar es secundario a que la
// conversación funcione. Por eso el error solo se registra en consola.
export async function logMessage(threadId, threadTitle, role, content) {
  if (!content) return;
  try {
    const db = getPool();
    await db.query(
      "INSERT INTO pm1_logs (thread_id, thread_title, role, content) VALUES ($1, $2, $3, $4)",
      [threadId || null, threadTitle || null, role, content]
    );
  } catch (err) {
    console.error("ERROR GUARDANDO LOG:", err.message);
  }
}

export async function fetchLogs(limit = 300) {
  const db = getPool();
  const { rows } = await db.query(
    "SELECT id, created_at, thread_id, thread_title, role, content FROM pm1_logs ORDER BY created_at DESC LIMIT $1",
    [limit]
  );
  return rows;
}
