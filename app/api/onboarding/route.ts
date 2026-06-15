import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  // Verifieer sessie via normale client
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }

  const { name, accentColor } = await req.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "Naam verplicht" }, { status: 400 });
  }

  // Directe admin client — bypassed RLS volledig
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: workspace, error: wsErr } = await admin
    .from("workspaces")
    .insert({
      name: name.trim(),
      owner_user_id: user.id,
      accent_color: accentColor ?? "#21A865",
    })
    .select("id")
    .single();

  if (wsErr || !workspace) {
    return NextResponse.json(
      { error: "workspace: " + (wsErr?.message ?? "onbekend") },
      { status: 500 }
    );
  }

  const { error: memErr } = await admin
    .from("workspace_members")
    .insert({ workspace_id: workspace.id, user_id: user.id, role: "owner" });

  if (memErr) {
    return NextResponse.json(
      { error: "member: " + memErr.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ workspaceId: workspace.id });
}
