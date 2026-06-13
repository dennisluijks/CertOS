import { requireCoordinator, getAIClient, checkAndIncrementAI } from "@/lib/ai";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const auth = await requireCoordinator(req);
  if (auth instanceof Response) return auth;

  const rawBody = await req.text();
  if (rawBody.length > 10_000) {
    return Response.json({ error: "Verzoek te groot" }, { status: 413 });
  }
  const body = JSON.parse(rawBody);
  const { code, norm } = body;

  if (!code || !norm) {
    return Response.json({ error: "code en norm zijn verplicht" }, { status: 400 });
  }

  const rate = await checkAndIncrementAI(auth.workspaceId);
  if (!rate.allowed) {
    return Response.json({ error: "Maandlimiet voor AI-calls bereikt (500/maand)." }, { status: 429 });
  }

  try {
    const client = getAIClient();
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 600,
      messages: [{
        role: "user",
        content: `Je coacht een coördinerende consultant zonder voorkennis van ${norm}.
Leg maatregel "${code}" verder uit in het Nederlands, zonder em dashes, maximaal 160 woorden:
(1) hoe ziet dit er in de praktijk uit bij een mkb-bedrijf,
(2) de 2 meest gemaakte fouten die auditoren afstraffen,
(3) één slimme vraag die de consultant aan de klant kan stellen om kundig over te komen.`,
      }],
    });

    const text = message.content.filter(b => b.type === "text").map(b => b.text).join("\n");
    return Response.json({ text });
  } catch (e) {
    return Response.json({ error: "AI niet beschikbaar: " + (e as Error).message }, { status: 500 });
  }
}
