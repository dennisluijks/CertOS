import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProjectDetailClient from "./ProjectDetailClient";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function TrajectDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: myProfile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("user_id", user.id)
    .single();

  // Fetch workspace
  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id, name, accent_color")
    .limit(1)
    .single();
  if (!workspace) redirect("/auth/onboarding");

  // Fetch project + verify workspace membership
  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .eq("workspace_id", workspace.id)
    .single();

  if (!project) notFound();

  // Fetch tenant
  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, name, contact, email")
    .eq("id", project.tenant_id)
    .single();

  // Fetch all related data
  const [
    { data: phases },
    { data: controls },
    { data: documents },
    { data: findings },
    { data: risks },
    { data: hours },
    { data: logEntries },
    { data: expiries },
    { data: tenantMembers },
    { data: tenantContacts },
  ] = await Promise.all([
    supabase
      .from("phases")
      .select("*")
      .eq("project_id", id)
      .order("position"),
    supabase
      .from("controls")
      .select("*")
      .eq("project_id", id)
      .order("code"),
    supabase
      .from("documents")
      .select("*")
      .eq("project_id", id),
    supabase
      .from("findings")
      .select("*")
      .eq("project_id", id),
    supabase
      .from("risks")
      .select("*")
      .eq("project_id", id),
    supabase
      .from("hours")
      .select("*")
      .eq("project_id", id)
      .order("date", { ascending: false }),
    supabase
      .from("log_entries")
      .select("*")
      .eq("project_id", id)
      .order("date", { ascending: false }),
    supabase
      .from("expiries")
      .select("*")
      .eq("project_id", id)
      .order("date"),
    supabase
      .from("tenant_members")
      .select("user_id, role, profiles(full_name, email)")
      .eq("tenant_id", project.tenant_id),
    supabase
      .from("tenant_contacts")
      .select("id, name, email")
      .eq("tenant_id", project.tenant_id)
      .order("name"),
  ]);

  // Fetch tasks for all phases
  const phaseIds = (phases ?? []).map(p => p.id);
  const { data: tasks } = phaseIds.length > 0
    ? await supabase
        .from("tasks")
        .select("*")
        .in("phase_id", phaseIds)
        .order("position")
    : { data: [] };

  return (
    <ProjectDetailClient
      project={project}
      tenant={tenant ?? null}
      workspace={workspace}
      phases={phases ?? []}
      tasks={tasks ?? []}
      controls={controls ?? []}
      documents={documents ?? []}
      findings={findings ?? []}
      risks={risks ?? []}
      hours={hours ?? []}
      logEntries={logEntries ?? []}
      expiries={expiries ?? []}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tenantMembers={(tenantMembers ?? []) as any}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tenantContacts={(tenantContacts ?? []) as any}
      coordinatorName={myProfile?.full_name ?? myProfile?.email ?? "Ik"}
    />
  );
}
