import { Pool } from "pg";
import bcrypt from "bcryptjs";

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

// ----------------------------------------------------------------------------
// CUENTAS — el progreso ya no vive solo en el localStorage del navegador.
// Autenticación simple (correo + contraseña con hash), suficiente para que
// nadie pierda su progreso al cambiar de dispositivo o borrar datos, sin
// montar un sistema de sesiones/tokens completo.
// ----------------------------------------------------------------------------

// Si el correo no existe, crea la cuenta con esa contraseña (primer uso).
// Si existe, verifica la contraseña y devuelve el perfil guardado.
export async function loginOrRegister(email, password) {
  const db = getPool();
  const { rows } = await db.query("SELECT * FROM pm1_accounts WHERE email = $1", [email]);

  if (rows.length === 0) {
    const hash = await bcrypt.hash(password, 10);
    await db.query(
      "INSERT INTO pm1_accounts (email, password_hash, profile_json) VALUES ($1, $2, $3)",
      [email, hash, null]
    );
    return { profile: null, isNew: true };
  }

  const account = rows[0];
  const match = await bcrypt.compare(password, account.password_hash);
  if (!match) {
    const err = new Error("Contraseña incorrecta para este correo.");
    err.status = 401;
    throw err;
  }
  return { profile: account.profile_json, isNew: false };
}

export async function saveProfileToDb(email, password, profile) {
  const db = getPool();
  const { rows } = await db.query("SELECT password_hash FROM pm1_accounts WHERE email = $1", [email]);
  if (rows.length === 0) {
    const err = new Error("Cuenta no encontrada.");
    err.status = 404;
    throw err;
  }
  const match = await bcrypt.compare(password, rows[0].password_hash);
  if (!match) {
    const err = new Error("Contraseña incorrecta.");
    err.status = 401;
    throw err;
  }
  await db.query(
    "UPDATE pm1_accounts SET profile_json = $1, updated_at = now() WHERE email = $2",
    [JSON.stringify(profile), email]
  );
}
