import { loginOrRegister } from "../../../../lib/db";

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
    const { profile, isNew } = await loginOrRegister(normalizedEmail, password);
    return Response.json({ profile, isNew });
  } catch (err) {
    console.error("ERROR LOGIN:", err.message);
    return Response.json({ error: err.message }, { status: err.status || 500 });
  }
}
