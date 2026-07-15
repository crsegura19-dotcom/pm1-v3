import { buildSystemPrompt, parseAIResponse } from "../../../lib/pm1-engine";
import { logMessage } from "../../../lib/db";
import { waitUntil } from "@vercel/functions";

export async function POST(req) {
  try {
    const { messages, profile, thread } = await req.json();

    // El registro en base de datos NO bloquea la respuesta al usuario — se
    // completa en segundo plano (waitUntil) mientras el chat ya sigue.
    // Antes esto se esperaba con "await", y sumado a la llamada a la IA podía
    // superar el límite de tiempo de la función en Vercel, provocando
    // "Error de conexión" y mensajes duplicados al reintentar.
    const lastUserMsg = messages[messages.length - 1];
    if (lastUserMsg) {
      waitUntil(logMessage(thread?.id, thread?.title, "user", lastUserMsg.content));
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        system: buildSystemPrompt(profile, thread),
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("ERROR ANTHROPIC:", JSON.stringify(data));
      return Response.json({ error: data.error?.message || "Error de la API de Anthropic" }, { status: 500 });
    }

    const rawText = data.content?.map((c) => c.text || "").join("") || "";
    waitUntil(logMessage(thread?.id, thread?.title, "assistant", rawText));

    const parsed = parseAIResponse(rawText);

    return Response.json({ parsed });
  } catch (err) {
    console.error("ERROR SERVIDOR:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
