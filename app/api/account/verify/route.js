import { verifyAccount } from "../../../../lib/db";

export async function POST(req) {
  try {
    const { email, code } = await req.json();
    if (!email || !code) {
      return Response.json({ error: "Faltan datos." }, { status: 400 });
    }
    await verifyAccount(email.trim().toLowerCase(), code.trim());
    return Response.json({ ok: true });
  } catch (err) {
    console.error("ERROR VERIFICACION:", err.message);
    return Response.json({ error: err.message }, { status: err.status || 500 });
  }
}
