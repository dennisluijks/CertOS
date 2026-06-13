-- ============================================================
-- CertOS: RLS helper-functies en policies
-- ============================================================

-- ============================================================
-- HELPER FUNCTIES (security definer = draaien als eigenaar)
-- ============================================================

create or replace function is_workspace_member(ws_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from workspace_members
    where workspace_id = ws_id
      and user_id = auth.uid()
  );
$$;

create or replace function is_tenant_client(p_tenant_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from tenant_members
    where tenant_id = p_tenant_id
      and user_id = auth.uid()
  );
$$;

create or replace function client_can_see_project(p_project_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from projects pr
    join tenant_members tm on tm.tenant_id = pr.tenant_id
    where pr.id = p_project_id
      and tm.user_id = auth.uid()
      and pr.client_visible = true
  );
$$;

-- Helper: haal workspace_id op voor een project (security definer)
create or replace function get_project_workspace_id(p_project_id uuid)
returns uuid
language sql
security definer
stable
as $$
  select workspace_id from projects where id = p_project_id;
$$;

-- Helper: haal workspace_id op voor een fase (via project)
create or replace function get_phase_workspace_id(p_phase_id uuid)
returns uuid
language sql
security definer
stable
as $$
  select pr.workspace_id
  from phases ph
  join projects pr on pr.id = ph.project_id
  where ph.id = p_phase_id;
$$;

-- Helper: haal workspace_id op voor een taak (via fase → project)
create or replace function get_task_workspace_id(p_task_id uuid)
returns uuid
language sql
security definer
stable
as $$
  select pr.workspace_id
  from tasks t
  join phases ph on ph.id = t.phase_id
  join projects pr on pr.id = ph.project_id
  where t.id = p_task_id;
$$;

-- ============================================================
-- ROW LEVEL SECURITY INSCHAKELEN
-- ============================================================

alter table workspaces        enable row level security;
alter table workspace_members enable row level security;
alter table profiles          enable row level security;
alter table tenants           enable row level security;
alter table tenant_members    enable row level security;
alter table invitations       enable row level security;
alter table projects          enable row level security;
alter table phases            enable row level security;
alter table tasks             enable row level security;
alter table task_comments     enable row level security;
alter table controls          enable row level security;
alter table documents         enable row level security;
alter table findings          enable row level security;
alter table risks             enable row level security;
alter table hours             enable row level security;
alter table log_entries       enable row level security;
alter table expiries          enable row level security;
alter table activities        enable row level security;

-- ============================================================
-- POLICIES: WORKSPACES
-- ============================================================

create policy "Coordinator: eigen workspace lezen"
  on workspaces for select
  using (is_workspace_member(id));

create policy "Coordinator: eigen workspace aanpassen"
  on workspaces for update
  using (owner_user_id = auth.uid());

create policy "Workspace aanmaken bij registratie"
  on workspaces for insert
  with check (owner_user_id = auth.uid());

-- ============================================================
-- POLICIES: WORKSPACE_MEMBERS
-- ============================================================

create policy "Coordinator: leden eigen workspace zien"
  on workspace_members for select
  using (is_workspace_member(workspace_id));

create policy "Coordinator: leden beheren"
  on workspace_members for insert
  with check (is_workspace_member(workspace_id));

create policy "Coordinator: leden verwijderen"
  on workspace_members for delete
  using (is_workspace_member(workspace_id));

-- ============================================================
-- POLICIES: PROFILES
-- ============================================================

create policy "Eigen profiel lezen"
  on profiles for select
  using (user_id = auth.uid());

create policy "Coordinator: profielen van workspace-leden zien"
  on profiles for select
  using (
    exists (
      select 1 from workspace_members wm1
      join workspace_members wm2 on wm2.workspace_id = wm1.workspace_id
      where wm1.user_id = auth.uid()
        and wm2.user_id = profiles.user_id
    )
    or
    exists (
      select 1 from workspace_members wm
      join tenants t on t.workspace_id = wm.workspace_id
      join tenant_members tm on tm.tenant_id = t.id
      where wm.user_id = auth.uid()
        and tm.user_id = profiles.user_id
    )
  );

create policy "Profiel aanmaken bij eerste login"
  on profiles for insert
  with check (user_id = auth.uid());

create policy "Eigen profiel bijwerken"
  on profiles for update
  using (user_id = auth.uid());

-- ============================================================
-- POLICIES: TENANTS
-- ============================================================

create policy "Coordinator: tenants van eigen workspace"
  on tenants for select
  using (is_workspace_member(workspace_id));

create policy "Client: eigen tenants zien"
  on tenants for select
  using (is_tenant_client(id));

create policy "Coordinator: tenant aanmaken"
  on tenants for insert
  with check (is_workspace_member(workspace_id));

create policy "Coordinator: tenant bijwerken"
  on tenants for update
  using (is_workspace_member(workspace_id));

create policy "Coordinator: tenant verwijderen"
  on tenants for delete
  using (is_workspace_member(workspace_id));

-- ============================================================
-- POLICIES: TENANT_MEMBERS
-- ============================================================

create policy "Coordinator: tenant-leden beheren"
  on tenant_members for select
  using (
    exists (
      select 1 from tenants t
      where t.id = tenant_members.tenant_id
        and is_workspace_member(t.workspace_id)
    )
  );

create policy "Client: eigen tenant-lidmaatschappen zien"
  on tenant_members for select
  using (user_id = auth.uid());

create policy "Coordinator: tenant-leden toevoegen"
  on tenant_members for insert
  with check (
    exists (
      select 1 from tenants t
      where t.id = tenant_id
        and is_workspace_member(t.workspace_id)
    )
  );

create policy "Coordinator: tenant-leden verwijderen"
  on tenant_members for delete
  using (
    exists (
      select 1 from tenants t
      where t.id = tenant_members.tenant_id
        and is_workspace_member(t.workspace_id)
    )
  );

-- ============================================================
-- POLICIES: INVITATIONS
-- ============================================================

create policy "Coordinator: uitnodigingen beheren"
  on invitations for all
  using (is_workspace_member(workspace_id))
  with check (is_workspace_member(workspace_id));

-- Clients kunnen NIET in invitations kijken

-- ============================================================
-- POLICIES: PROJECTS
-- ============================================================

create policy "Coordinator: projecten van eigen workspace"
  on projects for all
  using (is_workspace_member(workspace_id))
  with check (is_workspace_member(workspace_id));

create policy "Client: zichtbare projecten van eigen tenants"
  on projects for select
  using (client_can_see_project(id));

-- ============================================================
-- POLICIES: PHASES
-- ============================================================

create policy "Coordinator: fasen beheren"
  on phases for all
  using (is_workspace_member(workspace_id))
  with check (is_workspace_member(workspace_id));

create policy "Client: fasen van zichtbare projecten"
  on phases for select
  using (client_can_see_project(project_id));

-- ============================================================
-- POLICIES: TASKS
-- ============================================================

create policy "Coordinator: taken beheren"
  on tasks for all
  using (is_workspace_member(workspace_id))
  with check (is_workspace_member(workspace_id));

create policy "Client: taken van zichtbare projecten zien"
  on tasks for select
  using (
    exists (
      select 1 from phases ph
      where ph.id = tasks.phase_id
        and client_can_see_project(ph.project_id)
    )
  );

create policy "Client: eigen toegewezen taak updaten (done)"
  on tasks for update
  using (assignee_user_id = auth.uid());

-- ============================================================
-- POLICIES: TASK_COMMENTS
-- ============================================================

create policy "Coordinator: comments beheren"
  on task_comments for all
  using (is_workspace_member(workspace_id))
  with check (is_workspace_member(workspace_id));

create policy "Client: comments lezen van zichtbare taken"
  on task_comments for select
  using (
    exists (
      select 1 from tasks t
      join phases ph on ph.id = t.phase_id
      where t.id = task_comments.task_id
        and client_can_see_project(ph.project_id)
    )
  );

create policy "Client: eigen comment plaatsen op eigen taak"
  on task_comments for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from tasks t
      where t.id = task_id
        and t.assignee_user_id = auth.uid()
    )
  );

-- ============================================================
-- POLICIES: CONTROLS
-- ============================================================

create policy "Coordinator: beheersmaatregelen beheren"
  on controls for all
  using (is_workspace_member(workspace_id))
  with check (is_workspace_member(workspace_id));

create policy "Client: maatregelen van zichtbare projecten"
  on controls for select
  using (client_can_see_project(project_id));

-- ============================================================
-- POLICIES: DOCUMENTS
-- ============================================================

create policy "Coordinator: documenten beheren"
  on documents for all
  using (is_workspace_member(workspace_id))
  with check (is_workspace_member(workspace_id));

create policy "Client: documenten van zichtbare projecten zien"
  on documents for select
  using (client_can_see_project(project_id));

create policy "Client: eigen document aanleveren"
  on documents for update
  using (assignee_user_id = auth.uid() and client_can_see_project(project_id));

-- ============================================================
-- POLICIES: FINDINGS
-- ============================================================

create policy "Coordinator: bevindingen beheren"
  on findings for all
  using (is_workspace_member(workspace_id))
  with check (is_workspace_member(workspace_id));

create policy "Client: gedeelde bevindingen van zichtbare projecten"
  on findings for select
  using (
    client_can_see_project(project_id)
    and client_visible = true
  );

-- ============================================================
-- POLICIES: RISKS (alleen coordinator)
-- ============================================================

create policy "Coordinator: risico's beheren"
  on risks for all
  using (is_workspace_member(workspace_id))
  with check (is_workspace_member(workspace_id));

-- Geen client-policy: clients kunnen nooit in risks kijken

-- ============================================================
-- POLICIES: HOURS (alleen coordinator)
-- ============================================================

create policy "Coordinator: uren beheren"
  on hours for all
  using (is_workspace_member(workspace_id))
  with check (is_workspace_member(workspace_id));

-- Geen client-policy: clients zien nooit uren

-- ============================================================
-- POLICIES: LOG_ENTRIES
-- ============================================================

create policy "Coordinator: logboek beheren"
  on log_entries for all
  using (is_workspace_member(workspace_id))
  with check (is_workspace_member(workspace_id));

create policy "Client: gedeelde logboekregels"
  on log_entries for select
  using (
    client_can_see_project(project_id)
    and internal = false
  );

-- ============================================================
-- POLICIES: EXPIRIES
-- ============================================================

create policy "Coordinator: vervaldata beheren"
  on expiries for all
  using (is_workspace_member(workspace_id))
  with check (is_workspace_member(workspace_id));

create policy "Client: vervaldata van zichtbare projecten"
  on expiries for select
  using (client_can_see_project(project_id));

-- ============================================================
-- POLICIES: ACTIVITIES (alleen coordinator)
-- ============================================================

create policy "Coordinator: activiteiten zien"
  on activities for select
  using (is_workspace_member(workspace_id));

create policy "Coordinator: activiteiten als gelezen markeren"
  on activities for update
  using (is_workspace_member(workspace_id));

-- Geen client-policy: clients schrijven via triggers, maar lezen nooit activities
