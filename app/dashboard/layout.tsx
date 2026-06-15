export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CoordinatorNav from "@/components/CoordinatorNav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("global_role, full_name, email")
    .eq("user_id", user.id)
    .single();

  if (!profile) redirect("/auth/onboarding");
  if (profile.global_role === "client") redirect("/portal");

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id, name, accent_color, logo_url")
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  const { data: activities } = await supabase
    .from("activities")
    .select("id")
    .eq("read", false)
    .limit(99);

  const unreadCount = activities?.length ?? 0;

  return (
    <div className="cert-layout">
      <CoordinatorNav
        workspaceName={workspace?.name ?? "CertOS"}
        accentColor={workspace?.accent_color ?? "#21A865"}
        logoUrl={workspace?.logo_url}
        unreadActivities={unreadCount}
        userEmail={profile.email}
        userName={profile.full_name}
      />
      <main className="cert-main">
        {children}
      </main>
    </div>
  );
}
