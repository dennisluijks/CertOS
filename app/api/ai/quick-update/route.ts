import { requireCoordinator, getAIClient, checkAndIncrementAI } from "@/lib/ai";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const auth = await requireCoordinator(req);
  if (auth instanceof Response) return auth;

  const rawBody = await req.text();
  if (rawBody.length > 20_000) {
    return Response.json({ error: "Verzoek te groot" }, { status: 413 });
  }
  const body = JSON.parse(rawBody);
  const { projectSummary, customMessage } = body;

  if (!projectSummary) {
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
      max_tokens: 400,
      messages: [{
        role: "user",
        content: `Schrijf een korte WhatsApp-statusupdate voor de klant over dit certificeringstraject.
Maximaal 5 regels, vriendelijk en zakelijk. Gebruik jij-vorm. Geen em dashes. Emojis mogen.
${customMessage ? `Extra bericht van de consultant: ${customMessage}` : ""}

Projectdata:
Klant: ${projectSummary.klant}
Norm: ${projectSummary.norm}
Voortgang: ${projectSummary.voortgang_pct}%
Dagen tot audit: ${projectSummary.dagen_tot_audit ?? "onbekend"}
Open taken: ${projectSummary.beheersmaatregelen?.niet_gestart?.slice(0, 3).join(", ") ?? "geen"}`,
      }],
    });

    const text = message.content.filter(b => b.type === "text").map(b => b.text).join("\n");
    return Response.json({ text });
  } catch (e) {
    return Response.json({ error: "AI niet beschikbaar: " + (e as Error).message }, { status: 500 });
  }
}
