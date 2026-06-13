import Anthropic from "@anthropic-ai/sdk";

export function getAIClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

const ALLOWED_ORIGINS = [
  "https://cert-os.nl",
  "https://app.cert-os.nl",
  "http://localhost:3000",
  "http://localhost:3001",
];

const AI_MONTHLY_LIMIT = 500;

export async function requireCoordinator(_request: Request): Promise<{ userId: string; workspaceId: string } | Response> {
  // CSRF: reject cross-origin requests in production
  const origin = _request.headers.get("origin");
  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    return new Response(JSON.stringify({ error: "Niet toegestaan" }), { status: 403 });
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: "Niet ingelogd" }), { status: 401 });
  }

  const { data: profile } = await supabase.from("profiles").select("global_role").eq("user_id", user.id).single();
  if (profile?.global_role !== "coordinator") {
    return new Response(JSON.stringify({ error: "Geen toegang" }), { status: 403 });
  }

  const { data: member } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();
  if (!member) {
    return new Response(JSON.stringify({ error: "Geen workspace" }), { status: 404 });
  }

  return { userId: user.id, workspaceId: member.workspace_id };
}

export async function checkAndIncrementAI(workspaceId: string): Promise<{ allowed: boolean; remaining: number }> {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const month = new Date().toISOString().slice(0, 7); // 'YYYY-MM'

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from("ai_usage")
    .select("calls")
    .eq("workspace_id", workspaceId)
    .eq("month", month)
    .single();

  const current = data?.calls ?? 0;
  if (current >= AI_MONTHLY_LIMIT) {
    return { allowed: false, remaining: 0 };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from("ai_usage")
    .upsert({ workspace_id: workspaceId, month, calls: current + 1 }, { onConflict: "workspace_id,month" });

  return { allowed: true, remaining: AI_MONTHLY_LIMIT - current - 1 };
}
