import { saveProfileToDb } from "../../../../lib/db";

export async function POST(req) {
  try {
    const { email, password, profile } = await req.json();
    if (!email || !password || !profile) {
      return Response.json({ error: "Faltan datos." }, { status: 400 });
    }
    await saveProfileToDb(email.trim().toLowerCase(), password, profile);
    return Response.json({ ok: true });
  } catch (err) {
    console.error("ERROR GUARDANDO PERFIL:", err.message);
    return Response.json({ error: err.message }, { status: err.status || 500 });
  }
}
