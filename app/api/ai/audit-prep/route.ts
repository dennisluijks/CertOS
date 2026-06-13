import { requireCoordinator, getAIClient } from "@/lib/ai";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const auth = await requireCoordinator(req);
  if (auth instanceof Response) return auth;

  const body = await req.json();
  const { projectSummary } = body;

  if (!projectSummary) {
    return Response.json({ error: "Geen projectsamenvatting" }, { status: 400 });
  }

  try {
    const client = getAIClient();
    const message = await client.messages.create({
      model: "claude-sonnet-4-5-20251001",
      max_tokens: 1500,
      messages: [{
        role: "user",
        content: `Je bent een auditor-coach die een coördinerend consultant voorbereidt op de audit.
Schrijf in het Nederlands, geen em dashes. Maximaal 400 woorden.

Gebaseerd op de projectdata: (1) welke maatregelen zijn nog niet aantoonbaar maar zouden dat moeten zijn,
(2) welk bewijs ontbreekt er waarschijnlijk nog,
(3) de 3 vragen die een auditor bijna zeker zal stellen,
(4) wat er in de laatste week voor de audit nog geregeld moet worden.

Projectdata:
${JSON.stringify(projectSummary, null, 2)}`,
      }],
    });

    const text = message.content.filter(b => b.type === "text").map(b => b.text).join("\n");
    return Response.json({ text });
  } catch (e) {
    return Response.json({ error: "AI niet beschikbaar: " + (e as Error).message }, { status: 500 });
  }
}
