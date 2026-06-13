import { createClient } from "@/lib/supabase/server";
import TakenClient from "./TakenClient";

export default async function PortalTakenPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Haal alle taken op die aan deze user zijn toegewezen (RLS filtert automatisch)
  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, name, done, due, phase_id, workspace_id, assignee_user_id, owner")
    .eq("assignee_user_id", user.id)
    .eq("done", false)
    .order("due", { ascending: true, nullsFirst: false });

  const phaseIds = [...new Set((tasks ?? []).map(t => t.phase_id))];
  const { data: phases } = phaseIds.length
    ? await supabase.from("phases").select("id, project_id, name")
    : { data: [] };

  const projectIds = [...new Set((phases ?? []).map(p => p.project_id))];
  const [{ data: projects }, { data: tenants }] = await Promise.all([
    projectIds.length
      ? supabase.from("projects").select("id, norm, tenant_id, audit_date").in("id", projectIds)
      : Promise.resolve({ data: [] }),
    supabase.from("tenants").select("id, name"),
  ]);

  // Haal comments op voor taken van deze user
  const taskIds = (tasks ?? []).map(t => t.id);
  const { data: comments } = taskIds.length
    ? await supabase.from("task_comments").select("*").in("task_id", taskIds).order("created_at")
    : { data: [] };

  const phaseMap = Object.fromEntries((phases ?? []).map(p => [p.id, p]));
  const projectMap = Object.fromEntries((projects ?? []).map(p => [p.id, p]));
  const tenantMap = Object.fromEntries((tenants ?? []).map(t => [t.id, t.name]));

  return (
    <TakenClient
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tasks={(tasks ?? []) as any}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      phaseMap={phaseMap as any}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      projectMap={projectMap as any}
      tenantMap={tenantMap}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      comments={(comments ?? []) as any}
      userId={user.id}
    />
  );
}
