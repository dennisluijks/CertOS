import { createClient } from "@/lib/supabase/server";
import TenantsClient from "./TenantsClient";

export default async function KlantenPage() {
  const supabase = await createClient();

  const { data: workspace } = await supabase.from("workspaces").select("id").limit(1).single();
  if (!workspace) return <div>Geen workspace</div>;

  const [{ data: tenants }, { data: projects }] = await Promise.all([
    supabase.from("tenants").select("*").eq("workspace_id", workspace.id).order("name"),
    supabase.from("projects").select("id, tenant_id, norm").eq("workspace_id", workspace.id),
  ]);

  return (
    <TenantsClient
      workspaceId={workspace.id}
      initialTenants={tenants ?? []}
      projectCounts={Object.fromEntries(
        (tenants ?? []).map(t => [
          t.id,
          (projects ?? []).filter(p => p.tenant_id === t.id).length,
        ])
      )}
    />
  );
}
