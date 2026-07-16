import { fetchLogs } from "../../lib/db";

export const dynamic = "force-dynamic";

export default async function AdminPage({ searchParams }) {
  const key = searchParams?.key;

  if (!process.env.ADMIN_PASSWORD || key !== process.env.ADMIN_PASSWORD) {
    return (
      <div style={styles.wrap}>
        <p style={styles.locked}>Acceso restringido. Añade <code>?key=tu_contraseña</code> al final de la URL.</p>
      </div>
    );
  }

  let logs = [];
  let error = null;
  try {
    logs = await fetchLogs(300);
  } catch (err) {
    error = err.message;
  }

  return (
    <div style={styles.wrap}>
      <h1 style={styles.title}>PM1 — Registros</h1>
      <p style={styles.sub}>{logs.length} mensajes más recientes (de todos los usuarios y combates)</p>

      {error && <p style={styles.error}>Error al consultar la base de datos: {error}</p>}

      {logs.map((log) => (
        <div key={log.id} style={styles.card}>
          <div style={styles.meta}>
            <span>{new Date(log.created_at).toLocaleString("es-ES")}</span>
            <span> · {log.thread_title || "sin título"}</span>
            <span style={{ color: log.role === "user" ? "#93c5fd" : "#c8f542", marginLeft: 8 }}>
              {log.role === "user" ? "USUARIO" : "PM1"}
            </span>
          </div>
          <div style={styles.content}>{log.content}</div>
        </div>
      ))}

      {logs.length === 0 && !error && <p style={styles.sub}>Todavía no hay ningún mensaje registrado.</p>}
    </div>
  );
}

const styles = {
  wrap: { background: "#0a0a0a", color: "#e8e8e8", minHeight: "100vh", padding: "32px 24px", fontFamily: "'Space Grotesk', sans-serif" },
  locked: { color: "#888", fontSize: 14 },
  title: { color: "#c8f542", fontFamily: "'Space Mono', monospace", fontSize: 22, marginBottom: 4 },
  sub: { color: "#555", fontSize: 12, marginBottom: 20 },
  error: { color: "#f87171", fontSize: 13, marginBottom: 16 },
  card: { background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 8, padding: "12px 14px", marginBottom: 10, maxWidth: 800 },
  meta: { fontSize: 11, color: "#555", fontFamily: "'Space Mono', monospace", marginBottom: 6 },
  content: { fontSize: 13.5, lineHeight: 1.6, whiteSpace: "pre-wrap" },
};
