import { createClient } from "@/lib/supabase/server";
import ActiecentrumClient from "./ActiecentrumClient";

export default async function ActiecentrumPage() {
  const supabase = await createClient();

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id")
    .limit(1)
    .single();

  if (!workspace) {
    return (
      <div>
        <div style={{ fontSize: 22, fontWeight: 800, color: "var(--color-navy)", letterSpacing: "-0.02em", marginBottom: 8 }}>
          Actiecentrum
        </div>
        <div style={{ color: "var(--color-slate)", fontSize: 13.5 }}>Geen workspace gevonden.</div>
      </div>
    );
  }

  const wsId = workspace.id;

  const [
    { data: projects },
    { data: tenants },
    { data: phases },
    { data: tasks },
    { data: documents },
    { data: findings },
    { data: activities },
    { data: profiles },
  ] = await Promise.all([
    supabase.from("projects").select("id, tenant_id, norm").eq("workspace_id", wsId),
    supabase.from("tenants").select("id, name").eq("workspace_id", wsId),
    supabase.from("phases").select("id, project_id").eq("workspace_id", wsId),
    supabase
      .from("tasks")
      .select("id, phase_id, name, done, owner, due, assignee_user_id")
      .eq("workspace_id", wsId)
      .eq("done", false)
      .not("due", "is", null)
      .order("due", { ascending: true }),
    supabase
      .from("documents")
      .select("id, project_id, name, status, owner, due")
      .eq("workspace_id", wsId)
      .lt("status", 3)
      .not("due", "is", null)
      .order("due", { ascending: true }),
    supabase
      .from("findings")
      .select("id, project_id, description, owner, due, status")
      .eq("workspace_id", wsId)
      .lt("status", 2)
      .not("due", "is", null)
      .order("due", { ascending: true }),
    supabase
      .from("activities")
      .select("id, project_id, actor_user_id, kind, description, read, created_at")
      .eq("workspace_id", wsId)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase.from("profiles").select("user_id, full_name, email").eq("workspace_id", wsId).limit(100),
  ]);

  const tenantMap = Object.fromEntries((tenants ?? []).map(t => [t.id, t.name]));
  const phaseToProject = Object.fromEntries((phases ?? []).map(p => [p.id, p.project_id]));
  const projectTenant = Object.fromEntries((projects ?? []).map(p => [p.id, p.tenant_id]));

  return (
    <ActiecentrumClient
      wsId={wsId}
      tasks={(tasks ?? []).map(t => ({
        ...t,
        project_id: phaseToProject[t.phase_id],
        tenant_name: tenantMap[projectTenant[phaseToProject[t.phase_id]]] ?? "—",
      }))}
      documents={(documents ?? []).map(d => ({
        ...d,
        tenant_name: tenantMap[projectTenant[d.project_id]] ?? "—",
      }))}
      findings={(findings ?? []).map(f => ({
        ...f,
        tenant_name: tenantMap[projectTenant[f.project_id]] ?? "—",
      }))}
      activities={activities ?? []}
      profiles={profiles ?? []}
    />
  );
}
