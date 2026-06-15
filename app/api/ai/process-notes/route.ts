import { requireCoordinator, getAIClient, checkAndIncrementAI } from "@/lib/ai";
import { NextRequest } from "next/server";

export interface ProcessedNotes {
  tasks_to_create: Array<{
    name: string;
    owner: string;
    due: string | null;
    phase_name: string;
  }>;
  tasks_to_complete: string[];
  status_updates: Array<{
    control_code: string;
    new_status: 0 | 1 | 2 | 3;
    note: string;
  }>;
  audit_date: string | null;
  log_entry: string;
  summary: string;
}

export async function POST(req: NextRequest) {
  const auth = await requireCoordinator(req);
  if (auth instanceof Response) return auth;

  const rawBody = await req.text();
  if (rawBody.length > 100_000) {
    return Response.json({ error: "Verzoek te groot" }, { status: 413 });
  }
  const body = JSON.parse(rawBody);
  const { notes, project_context: projectContext } = body;

  if (!notes?.trim()) {
    return Response.json({ error: "Geen gespreksverslag" }, { status: 400 });
  }

  const rate = await checkAndIncrementAI(auth.workspaceId);
  if (!rate.allowed) {
    return Response.json({ error: "Maandlimiet voor AI-calls bereikt (500/maand)." }, { status: 429 });
  }

  try {
    const client = getAIClient();

    const systemPrompt = `Je bent een assistent die gespreksverslagen van certificeringstrajecten analyseert.
Je output is altijd geldig JSON, niets anders. Geen uitleg, geen markdown, alleen JSON.

De context:
- Norm: ${projectContext?.norm ?? "onbekend"}
- Klant: ${projectContext?.tenant ?? "onbekend"}
- Fase: ${projectContext?.currentPhase ?? "onbekend"}
- Auditdatum: ${projectContext?.auditDate ?? "onbekend"}
- Openstaande taken: ${JSON.stringify(projectContext?.openTasks ?? [])}
- Beheersmaatregelen: ${JSON.stringify(projectContext?.controls ?? [])}

Verwerk het gespreksverslag en retourneer dit JSON-schema:
{
  "tasks_to_create": [
    { "name": "taaknaam", "owner": "naam of lege string", "due": "YYYY-MM-DD of null", "phase_name": "fasenaam" }
  ],
  "tasks_to_complete": ["exacte taaknaam die afgerond is"],
  "status_updates": [
    { "control_code": "VCU-1.1", "new_status": 1, "note": "reden voor statuswijziging" }
  ],
  "audit_date": "YYYY-MM-DD of null",
  "log_entry": "Samenvatting van het gesprek als logboekregel",
  "summary": "Eén zin: wat is het belangrijkste resultaat van dit gesprek"
}

Gebruik status 0=Niet gestart, 1=In uitvoering, 2=Geïmplementeerd, 3=Aantoonbaar.
Maak alleen tasks_to_create als er expliciet actiepunten zijn benoemd.
Maak status_updates alleen als er duidelijke voortgang of statuswijzigingen zijn besproken.
Zet audit_date alleen als er expliciet een (nieuwe) auditdatum is besproken, anders null.`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{
        role: "user",
        content: `Verwerk dit gespreksverslag:\n\n${notes}`,
      }],
    });

    const raw = message.content.filter(b => b.type === "text").map(b => b.text).join("");

    let parsed: ProcessedNotes;
    try {
      parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
    } catch {
      return Response.json({ error: "AI retourneerde geen geldig JSON", raw }, { status: 500 });
    }

    return Response.json(parsed);
  } catch (e) {
    return Response.json({ error: "AI niet beschikbaar: " + (e as Error).message }, { status: 500 });
  }
}
