import { resetPassword } from "../../../../lib/db";

export async function POST(req) {
  try {
    const { email, code, newPassword } = await req.json();
    if (!email || !code || !newPassword) {
      return Response.json({ error: "Faltan datos." }, { status: 400 });
    }
    if (newPassword.length < 4) {
      return Response.json({ error: "La contraseña debe tener al menos 4 caracteres." }, { status: 400 });
    }
    await resetPassword(email.trim().toLowerCase(), code.trim(), newPassword);
    return Response.json({ ok: true });
  } catch (err) {
    console.error("ERROR RESET PASSWORD:", err.message);
    return Response.json({ error: err.message }, { status: err.status || 500 });
  }
}
