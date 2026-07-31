import { setVerificationCode } from "../../../../lib/db";
import { sendEmail, generateCode } from "../../../../lib/email";

export async function POST(req) {
  try {
    const { email } = await req.json();
    if (!email) {
      return Response.json({ error: "Falta el correo." }, { status: 400 });
    }
    const normalizedEmail = email.trim().toLowerCase();
    const code = generateCode();
    await setVerificationCode(normalizedEmail, code);
    await sendEmail(
      normalizedEmail,
      "Tu nuevo código de verificación de PM1",
      `<p>Tu nuevo código de verificación es:</p><h2 style="letter-spacing:4px">${code}</h2><p>Caduca en 15 minutos.</p>`
    );
    return Response.json({ ok: true });
  } catch (err) {
    console.error("ERROR REENVIANDO CODIGO:", err.message);
    return Response.json({ error: err.message }, { status: err.status || 500 });
  }
}
