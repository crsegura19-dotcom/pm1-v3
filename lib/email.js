export async function sendEmail(to, subject, html) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
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
    throw new Error(data.message || "No se pudo enviar el correo.");
  }
}

// Código de 6 dígitos — más fácil de escribir a mano en el móvil que un
// enlace largo, y suficiente para algo de corta duración (15 minutos).
export function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}
