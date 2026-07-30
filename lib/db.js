import { Pool } from "pg";
import bcrypt from "bcryptjs";

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

// ----------------------------------------------------------------------------
// REGISTROS DE CONVERSACIÓN
// ----------------------------------------------------------------------------
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
// CUENTAS — correo + contraseña, con verificación de correo y recuperación
// de contraseña por código de 6 dígitos.
// ----------------------------------------------------------------------------

export async function createAccount(email, password) {
  const db = getPool();
  const { rows } = await db.query("SELECT email FROM pm1_accounts WHERE email = $1", [email]);
  if (rows.length > 0) {
    const err = new Error("Ya existe una cuenta con este correo.");
    err.status = 409;
    throw err;
  }
  const hash = await bcrypt.hash(password, 10);
  await db.query(
    "INSERT INTO pm1_accounts (email, password_hash, profile_json, email_verified) VALUES ($1, $2, NULL, false)",
    [email, hash]
  );
}

export async function setVerificationCode(email, code, expiresMinutes = 15) {
  const db = getPool();
  const expires = new Date(Date.now() + expiresMinutes * 60000);
  await db.query(
    "UPDATE pm1_accounts SET verification_code = $1, verification_expires = $2 WHERE email = $3",
    [code, expires, email]
  );
}

export async function verifyAccount(email, code) {
  const db = getPool();
  const { rows } = await db.query(
    "SELECT verification_code, verification_expires FROM pm1_accounts WHERE email = $1",
    [email]
  );
  if (rows.length === 0) {
    const err = new Error("Cuenta no encontrada.");
    err.status = 404;
    throw err;
  }
  const { verification_code, verification_expires } = rows[0];
  if (!verification_code || verification_code !== code) {
    const err = new Error("Código incorrecto.");
    err.status = 400;
    throw err;
  }
  if (new Date(verification_expires) < new Date()) {
    const err = new Error("El código ha caducado. Pide uno nuevo.");
    err.status = 400;
    throw err;
  }
  await db.query(
    "UPDATE pm1_accounts SET email_verified = true, verification_code = NULL, verification_expires = NULL WHERE email = $1",
    [email]
  );
}

// Login real — ya no crea cuentas (eso lo hace createAccount). Bloquea el
// acceso si el correo todavía no está verificado.
export async function loginAccount(email, password) {
  const db = getPool();
  const { rows } = await db.query("SELECT * FROM pm1_accounts WHERE email = $1", [email]);
  if (rows.length === 0) {
    const err = new Error("No existe ninguna cuenta con este correo.");
    err.status = 404;
    throw err;
  }
  const account = rows[0];
  const match = await bcrypt.compare(password, account.password_hash);
  if (!match) {
    const err = new Error("Contraseña incorrecta.");
    err.status = 401;
    throw err;
  }
  if (!account.email_verified) {
    const err = new Error("Todavía no has verificado tu correo.");
    err.status = 403;
    err.needsVerification = true;
    throw err;
  }
  return account.profile_json;
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

// No revela si el correo existe o no (evita que alguien compruebe qué
// correos están registrados probando la recuperación de contraseña).
export async function setResetCode(email, code, expiresMinutes = 15) {
  const db = getPool();
  const { rows } = await db.query("SELECT email FROM pm1_accounts WHERE email = $1", [email]);
  if (rows.length === 0) return false;
  const expires = new Date(Date.now() + expiresMinutes * 60000);
  await db.query("UPDATE pm1_accounts SET reset_code = $1, reset_expires = $2 WHERE email = $3", [code, expires, email]);
  return true;
}

export async function resetPassword(email, code, newPassword) {
  const db = getPool();
  const { rows } = await db.query("SELECT reset_code, reset_expires FROM pm1_accounts WHERE email = $1", [email]);
  if (rows.length === 0) {
    const err = new Error("Cuenta no encontrada.");
    err.status = 404;
    throw err;
  }
  const { reset_code, reset_expires } = rows[0];
  if (!reset_code || reset_code !== code) {
    const err = new Error("Código incorrecto.");
    err.status = 400;
    throw err;
  }
  if (new Date(reset_expires) < new Date()) {
    const err = new Error("El código ha caducado. Pide uno nuevo.");
    err.status = 400;
    throw err;
  }
  const hash = await bcrypt.hash(newPassword, 10);
  await db.query(
    "UPDATE pm1_accounts SET password_hash = $1, reset_code = NULL, reset_expires = NULL WHERE email = $2",
    [hash, email]
  );
}
