create table if not exists ai_usage (
  workspace_id uuid not null references workspaces(id) on delete cascade,
  month        text not null,
  calls        int  not null default 0,
  primary key (workspace_id, month)
);

alter table ai_usage enable row level security;

create policy "Eigen workspace ai_usage"
  on ai_usage for all
  using (is_workspace_member(workspace_id));
