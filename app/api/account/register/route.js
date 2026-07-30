import { createAccount, setVerificationCode } from "../../../../lib/db";
import { sendEmail, generateCode } from "../../../../lib/email";

export async function POST(req) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return Response.json({ error: "Correo y contraseña son obligatorios." }, { status: 400 });
    }
    if (password.length < 4) {
      return Response.json({ error: "La contraseña debe tener al menos 4 caracteres." }, { status: 400 });
    }
    const normalizedEmail = email.trim().toLowerCase();

    await createAccount(normalizedEmail, password);
    const code = generateCode();
    await setVerificationCode(normalizedEmail, code);
    await sendEmail(
      normalizedEmail,
      "Tu código de verificación de PM1",
      `<p>Tu código de verificación es:</p><h2 style="letter-spacing:4px">${code}</h2><p>Caduca en 15 minutos.</p>`
    );

    return Response.json({ ok: true, needsVerification: true });
  } catch (err) {
    console.error("ERROR REGISTRO:", err.message);
    return Response.json({ error: err.message }, { status: err.status || 500 });
  }
}
