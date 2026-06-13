import { createClient } from "@/lib/supabase/server";
import DocumentenClient from "./DocumentenClient";

export default async function PortalDocumentenPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Toegewezen documenten voor deze user (RLS filtert automatisch)
  const { data: documents } = await supabase
    .from("documents")
    .select("*")
    .eq("assignee_user_id", user.id)
    .order("due", { ascending: true, nullsFirst: false });

  const projectIds = [...new Set((documents ?? []).map(d => d.project_id))];
  const [{ data: projects }, { data: tenants }] = await Promise.all([
    projectIds.length
      ? supabase.from("projects").select("id, norm, tenant_id").in("id", projectIds)
      : Promise.resolve({ data: [] }),
    supabase.from("tenants").select("id, name"),
  ]);

  const projectMap = Object.fromEntries((projects ?? []).map(p => [p.id, p]));
  const tenantMap = Object.fromEntries((tenants ?? []).map(t => [t.id, t.name]));

  return (
    <DocumentenClient
      documents={documents ?? []}
      projectMap={projectMap}
      tenantMap={tenantMap}
    />
  );
}
