import { loginAccount } from "../../../../lib/db";

export async function POST(req) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return Response.json({ error: "Correo y contraseña son obligatorios." }, { status: 400 });
    }
    const normalizedEmail = email.trim().toLowerCase();
    const profile = await loginAccount(normalizedEmail, password);
    return Response.json({ profile });
  } catch (err) {
    console.error("ERROR LOGIN:", err.message);
    return Response.json({ error: err.message, needsVerification: !!err.needsVerification }, { status: err.status || 500 });
  }
}
