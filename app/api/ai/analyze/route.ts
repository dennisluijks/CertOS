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
      max_tokens: 1200,
      messages: [{
        role: "user",
        content: `Je bent een ervaren certificeringscoach die een coördinerende consultant helpt.
Analyseer dit certificeringstraject en geef praktisch advies in het Nederlands.
Geen em dashes. Maximaal 350 woorden.

Geef: (1) de 3 belangrijkste risico's of aandachtspunten op dit moment,
(2) de 2 taken die het meeste impact hebben als ze nu worden opgepakt,
(3) één concreet advies voor de komende week.

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
