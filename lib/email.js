export async function sendEmail(to, subject, html) {
  // DIAGNÓSTICO TEMPORAL — quitar en cuanto se resuelva el problema del envío.
  const key = process.env.RESEND_API_KEY;
  console.error(
    "DEBUG_RESEND_KEY:",
    key ? `presente, longitud ${key.length}, empieza por "${key.slice(0, 5)}", termina por "${key.slice(-3)}"` : "AUSENTE — no llega ninguna variable RESEND_API_KEY a esta función"
  );

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "PM1 <noreply@pm1ai.com>",
      to,
      subject,
      html,
    }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    console.error("DEBUG_RESEND_RESPONSE:", res.status, JSON.stringify(data));
    throw new Error(data.message || "No se pudo enviar el correo.");
  }
}

// Código de 6 dígitos — más fácil de escribir a mano en el móvil que un
// enlace largo, y suficiente para algo de corta duración (15 minutos).
export function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}
