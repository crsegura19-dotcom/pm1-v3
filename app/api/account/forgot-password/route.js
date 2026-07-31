import { setResetCode } from "../../../../lib/db";
import { sendEmail, generateCode } from "../../../../lib/email";

export async function POST(req) {
  try {
    const { email } = await req.json();
    if (!email) {
      return Response.json({ error: "Falta el correo." }, { status: 400 });
    }
    const normalizedEmail = email.trim().toLowerCase();
    const code = generateCode();
    const exists = await setResetCode(normalizedEmail, code);
    if (exists) {
      await sendEmail(
        normalizedEmail,
        "Recupera tu contraseña de PM1",
        `<p>Tu código para restablecer la contraseña es:</p><h2 style="letter-spacing:4px">${code}</h2><p>Caduca en 15 minutos. Si no lo has pedido tú, ignora este correo.</p>`
      );
    }
    // Siempre respondemos igual, exista o no la cuenta — por seguridad.
    return Response.json({ ok: true });
  } catch (err) {
    console.error("ERROR FORGOT PASSWORD:", err.message);
    return Response.json({ error: "No se pudo procesar la solicitud." }, { status: 500 });
  }
}
