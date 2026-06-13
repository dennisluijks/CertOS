import Anthropic from "@anthropic-ai/sdk";

export function getAIClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

export async function requireCoordinator(request: Request): Promise<{ userId: string; workspaceId: string } | Response> {
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

  const { data: workspace } = await supabase.from("workspaces").select("id").limit(1).single();
  if (!workspace) {
    return new Response(JSON.stringify({ error: "Geen workspace" }), { status: 404 });
  }

  return { userId: user.id, workspaceId: workspace.id };
}
