-- ============================================================
-- CertOS: Triggers voor client-acties en column-guards
-- ============================================================

-- ============================================================
-- TRIGGER 1: Client taak-update guard
-- Clients mogen alleen `done` wijzigen, niets anders
-- ============================================================

create or replace function guard_task_client_update()
returns trigger
language plpgsql
security definer
as $$
declare
  v_role text;
begin
  select global_role into v_role
  from profiles
  where user_id = auth.uid();

  if v_role = 'client' then
    -- Zet alle kolommen terug behalve 'done'
    new.workspace_id     := old.workspace_id;
    new.phase_id         := old.phase_id;
    new.name             := old.name;
    new.owner            := old.owner;
    new.assignee_user_id := old.assignee_user_id;
    new.due              := old.due;
    new.position         := old.position;
  end if;

  return new;
end;
$$;

create trigger task_client_update_guard
  before update on tasks
  for each row
  execute function guard_task_client_update();

-- ============================================================
-- TRIGGER 2: Client document-update guard
-- Clients mogen alleen `link` wijzigen en status van 0 → 1
-- ============================================================

create or replace function guard_document_client_update()
returns trigger
language plpgsql
security definer
as $$
declare
  v_role text;
begin
  select global_role into v_role
  from profiles
  where user_id = auth.uid();

  if v_role = 'client' then
    -- Zet alle kolommen terug behalve 'link' en status (0→1)
    new.workspace_id     := old.workspace_id;
    new.project_id       := old.project_id;
    new.name             := old.name;
    new.owner            := old.owner;
    new.assignee_user_id := old.assignee_user_id;
    new.due              := old.due;

    -- Status mag alleen van 0 naar 1 (Gevraagd → Ontvangen)
    if old.status <> 0 or new.status <> 1 then
      new.status := old.status;
    end if;
  end if;

  return new;
end;
$$;

create trigger document_client_update_guard
  before update on documents
  for each row
  execute function guard_document_client_update();

-- ============================================================
-- TRIGGER 3: Activity logging bij client-acties
-- ============================================================

create or replace function log_client_task_done()
returns trigger
language plpgsql
security definer
as $$
declare
  v_role text;
  v_project_id uuid;
  v_workspace_id uuid;
  v_task_name text;
begin
  select global_role into v_role
  from profiles
  where user_id = auth.uid();

  if v_role = 'client' and new.done = true and old.done = false then
    -- Haal project info op
    select ph.project_id, pr.workspace_id, t.name
    into v_project_id, v_workspace_id, v_task_name
    from phases ph
    join projects pr on pr.id = ph.project_id
    join tasks t on t.id = new.id
    where ph.id = new.phase_id;

    -- Activity log
    insert into activities (workspace_id, project_id, actor_user_id, kind, description)
    values (v_workspace_id, v_project_id, auth.uid(), 'task_done',
            'Taak afgerond: ' || new.name);

    -- Gedeeld logboek
    insert into log_entries (workspace_id, project_id, date, text, internal)
    values (v_workspace_id, v_project_id, current_date,
            'Klant heeft taak afgerond: ' || new.name, false);
  end if;

  return new;
end;
$$;

create trigger client_task_done_activity
  after update on tasks
  for each row
  execute function log_client_task_done();

-- ============================================================
-- TRIGGER 4: Activity logging bij document aanlevering
-- ============================================================

create or replace function log_client_doc_delivered()
returns trigger
language plpgsql
security definer
as $$
declare
  v_role text;
  v_workspace_id uuid;
begin
  select global_role into v_role
  from profiles
  where user_id = auth.uid();

  if v_role = 'client' and new.status = 1 and old.status = 0 then
    select workspace_id into v_workspace_id
    from projects where id = new.project_id;

    insert into activities (workspace_id, project_id, actor_user_id, kind, description)
    values (v_workspace_id, new.project_id, auth.uid(), 'doc_delivered',
            'Document aangeleverd: ' || new.name);

    insert into log_entries (workspace_id, project_id, date, text, internal)
    values (v_workspace_id, new.project_id, current_date,
            'Klant heeft document aangeleverd: ' || new.name, false);
  end if;

  return new;
end;
$$;

create trigger client_doc_delivered_activity
  after update on documents
  for each row
  execute function log_client_doc_delivered();

-- ============================================================
-- TRIGGER 5: Activity logging bij taakcommentaar
-- ============================================================

create or replace function log_client_comment()
returns trigger
language plpgsql
security definer
as $$
declare
  v_role text;
  v_project_id uuid;
  v_workspace_id uuid;
  v_task_name text;
begin
  select global_role into v_role
  from profiles
  where user_id = auth.uid();

  if v_role = 'client' then
    select ph.project_id, pr.workspace_id, t.name
    into v_project_id, v_workspace_id, v_task_name
    from tasks t
    join phases ph on ph.id = t.phase_id
    join projects pr on pr.id = ph.project_id
    where t.id = new.task_id;

    insert into activities (workspace_id, project_id, actor_user_id, kind, description)
    values (v_workspace_id, v_project_id, auth.uid(), 'comment',
            'Reactie geplaatst op taak: ' || v_task_name);
  end if;

  return new;
end;
$$;

create trigger client_comment_activity
  after insert on task_comments
  for each row
  execute function log_client_comment();
