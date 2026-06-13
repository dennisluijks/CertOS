-- ============================================================
-- CertOS: Initieel databaseschema
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- ============================================================
-- TABELLEN
-- ============================================================

create table workspaces (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  accent_color  text not null default '#21A865',
  logo_url      text,
  plan          text not null default 'free',
  created_at    timestamptz not null default now()
);

create table workspace_members (
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  role         text not null default 'coordinator' check (role in ('owner','coordinator')),
  primary key (workspace_id, user_id)
);

create table profiles (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text,
  global_role text not null check (global_role in ('coordinator','client'))
);

create table tenants (
  id           uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name         text not null,
  sector       text,
  contact      text,
  email        text,
  created_at   timestamptz not null default now()
);

create table tenant_members (
  tenant_id  uuid not null references tenants(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       text not null default 'client',
  invited_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  primary key (tenant_id, user_id)
);

create table invitations (
  id           uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  tenant_id    uuid not null references tenants(id) on delete cascade,
  email        text not null,
  status       text not null default 'open' check (status in ('open','accepted','revoked')),
  created_at   timestamptz not null default now()
);

create unique index invitations_open_unique
  on invitations (tenant_id, email)
  where status = 'open';

create table projects (
  id            uuid primary key default uuid_generate_v4(),
  workspace_id  uuid not null references workspaces(id) on delete cascade,
  tenant_id     uuid not null references tenants(id) on delete cascade,
  norm          text not null check (norm in ('VCU','ISO 9001','ISO 14001','ISO 27001','ISO 45001','ISAE 3402')),
  kind          text not null check (kind in ('Certificering','Hercertificering')),
  audit_date    date,
  ci            text,
  bureau        text,
  budget_max    numeric not null default 0,
  client_visible boolean not null default true,
  created_at    timestamptz not null default now()
);

create table phases (
  id           uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  project_id   uuid not null references projects(id) on delete cascade,
  name         text not null,
  position     int not null default 0,
  start_date   date,
  end_date     date
);

create table tasks (
  id               uuid primary key default uuid_generate_v4(),
  workspace_id     uuid not null references workspaces(id) on delete cascade,
  phase_id         uuid not null references phases(id) on delete cascade,
  name             text not null,
  done             boolean not null default false,
  owner            text not null default '',
  assignee_user_id uuid references auth.users(id) on delete set null,
  due              date,
  position         int not null default 0
);

create table task_comments (
  id           uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  task_id      uuid not null references tasks(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  body         text not null,
  created_at   timestamptz not null default now()
);

create table controls (
  id           uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  project_id   uuid not null references projects(id) on delete cascade,
  code         text not null,
  name         text not null,
  description  text not null default '',
  status       int not null default 0 check (status between 0 and 3),
  note         text not null default '',
  link         text not null default ''
);

create table documents (
  id               uuid primary key default uuid_generate_v4(),
  workspace_id     uuid not null references workspaces(id) on delete cascade,
  project_id       uuid not null references projects(id) on delete cascade,
  name             text not null,
  status           int not null default 0 check (status between 0 and 3),
  owner            text not null default '',
  assignee_user_id uuid references auth.users(id) on delete set null,
  due              date,
  link             text not null default ''
);

create table findings (
  id             uuid primary key default uuid_generate_v4(),
  workspace_id   uuid not null references workspaces(id) on delete cascade,
  project_id     uuid not null references projects(id) on delete cascade,
  description    text not null,
  source         text,
  severity       text,
  status         int not null default 0,
  owner          text not null default '',
  due            date,
  note           text not null default '',
  link           text not null default '',
  client_visible boolean not null default false
);

create table risks (
  id           uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  project_id   uuid not null references projects(id) on delete cascade,
  description  text not null,
  impact       text,
  mitigation   text,
  status       int not null default 0
);

create table hours (
  id           uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  project_id   uuid not null references projects(id) on delete cascade,
  date         date not null,
  category     text not null,
  hours        numeric not null,
  note         text
);

create table log_entries (
  id           uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  project_id   uuid not null references projects(id) on delete cascade,
  date         date not null,
  text         text not null,
  internal     boolean not null default true,
  created_at   timestamptz not null default now()
);

create table expiries (
  id           uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  project_id   uuid not null references projects(id) on delete cascade,
  name         text not null,
  type         text not null,
  holder       text,
  date         date not null
);

create table activities (
  id             uuid primary key default uuid_generate_v4(),
  workspace_id   uuid not null references workspaces(id) on delete cascade,
  project_id     uuid references projects(id) on delete cascade,
  actor_user_id  uuid not null references auth.users(id) on delete cascade,
  kind           text not null check (kind in ('task_done','doc_delivered','comment')),
  description    text not null,
  read           boolean not null default false,
  created_at     timestamptz not null default now()
);

-- ============================================================
-- VIEWS
-- ============================================================

create view workspace_branding as
  select id as workspace_id, name, accent_color, logo_url
  from workspaces;

-- ============================================================
-- INDEXES
-- ============================================================

create index on workspace_members (user_id);
create index on tenants (workspace_id);
create index on tenant_members (user_id);
create index on invitations (email, status);
create index on projects (workspace_id);
create index on projects (tenant_id);
create index on phases (project_id);
create index on tasks (phase_id);
create index on tasks (assignee_user_id);
create index on task_comments (task_id);
create index on controls (project_id);
create index on documents (project_id);
create index on documents (assignee_user_id);
create index on findings (project_id);
create index on risks (project_id);
create index on hours (project_id);
create index on log_entries (project_id);
create index on expiries (project_id);
create index on activities (workspace_id, read);
create index on activities (actor_user_id);
