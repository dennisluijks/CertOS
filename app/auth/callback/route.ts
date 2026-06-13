import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/error`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/auth/error`);
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(`${origin}/auth/error`);
  }

  // Check of profiel al bestaat
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("user_id, global_role")
    .eq("user_id", user.id)
    .single();

  if (existingProfile) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const role = (existingProfile as any).global_role;
    if (role === "client") {
      return NextResponse.redirect(`${origin}/portal`);
    }
    return NextResponse.redirect(`${origin}/dashboard`);
  }

  // Check openstaande uitnodiging
  const userEmail = user.email ?? "";
  const { data: invitation } = await supabase
    .from("invitations")
    .select("id, workspace_id, tenant_id")
    .eq("email", userEmail)
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (invitation) {
    await supabase.from("profiles").insert({
      user_id: user.id,
      email: userEmail,
      full_name: user.user_metadata?.full_name ?? null,
      global_role: "client",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const inv = invitation as any;
    await supabase.from("tenant_members").insert({
      tenant_id: inv.tenant_id,
      user_id: user.id,
      role: "client",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    await supabase
      .from("invitations")
      .update({ status: "accepted" } as never)
      .eq("email", userEmail)
      .eq("status", "open");

    return NextResponse.redirect(`${origin}/portal`);
  }

  // Nieuwe coördinator
  await supabase.from("profiles").insert({
    user_id: user.id,
    email: userEmail,
    full_name: user.user_metadata?.full_name ?? null,
    global_role: "coordinator",
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);

  return NextResponse.redirect(`${origin}/auth/onboarding`);
}
