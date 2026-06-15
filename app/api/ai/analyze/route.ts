import { requireCoordinator, getAIClient, checkAndIncrementAI } from "@/lib/ai";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const auth = await requireCoordinator(req);
  if (auth instanceof Response) return auth;

  const rawBody = await req.text();
  if (rawBody.length > 50_000) {
    return Response.json({ error: "Verzoek te groot" }, { status: 413 });
  }
  const body = JSON.parse(rawBody);
  const { summary } = body;

  if (!summary) {
    return Response.json({ error: "Geen projectsamenvatting" }, { status: 400 });
  }

  const rate = await checkAndIncrementAI(auth.workspaceId);
  if (!rate.allowed) {
    return Response.json({ error: "Maandlimiet voor AI-calls bereikt (500/maand)." }, { status: 429 });
  }

  try {
    const client = getAIClient();
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
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
${summary}`,
      }],
    });

    const text = message.content.filter(b => b.type === "text").map(b => b.text).join("\n");
    return Response.json({ text });
  } catch (e) {
    return Response.json({ error: "AI niet beschikbaar: " + (e as Error).message }, { status: 500 });
  }
}
