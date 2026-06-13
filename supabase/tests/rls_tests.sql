-- ============================================================
-- CertOS: RLS acceptatietests
-- Draai als: psql <connection> -f supabase/tests/rls_tests.sql
-- Of via Supabase SQL Editor als service-role (bypass RLS zelf)
-- en simuleer met set local role authenticated + set local request.jwt.claims
-- ============================================================

-- Testopzet: maak twee coordinatoren A en B, een client C
-- Pas de UUIDs hieronder aan naar echte test-accounts

do $$
declare
  v_coordinator_a uuid := '00000000-0000-0000-0000-000000000001';
  v_coordinator_b uuid := '00000000-0000-0000-0000-000000000002';
  v_client        uuid := '00000000-0000-0000-0000-000000000003';
  v_workspace_a   uuid;
  v_workspace_b   uuid;
  v_tenant_a      uuid;
  v_project_a     uuid;
  v_task_id       uuid;
  v_doc_id        uuid;
  v_hour_id       uuid;
  v_risk_id       uuid;
  v_count         int;
begin
  raise notice '=== CertOS RLS Test Suite ===';

  -- Setup: workspaces
  insert into workspaces (id, name, owner_user_id)
  values
    ('aaaaaaaa-0000-0000-0000-000000000001', 'Workspace A', v_coordinator_a),
    ('bbbbbbbb-0000-0000-0000-000000000001', 'Workspace B', v_coordinator_b)
  on conflict do nothing
  returning id into v_workspace_a;

  v_workspace_a := 'aaaaaaaa-0000-0000-0000-000000000001';
  v_workspace_b := 'bbbbbbbb-0000-0000-0000-000000000001';

  insert into workspace_members (workspace_id, user_id, role)
  values
    (v_workspace_a, v_coordinator_a, 'owner'),
    (v_workspace_b, v_coordinator_b, 'owner')
  on conflict do nothing;

  -- Tenant + project in workspace A
  insert into tenants (id, workspace_id, name)
  values ('cccccccc-0000-0000-0000-000000000001', v_workspace_a, 'ENGR B.V.')
  on conflict do nothing;
  v_tenant_a := 'cccccccc-0000-0000-0000-000000000001';

  insert into tenant_members (tenant_id, user_id, role, invited_by)
  values (v_tenant_a, v_client, 'client', v_coordinator_a)
  on conflict do nothing;

  insert into projects (id, workspace_id, tenant_id, norm, kind, client_visible)
  values ('dddddddd-0000-0000-0000-000000000001', v_workspace_a, v_tenant_a, 'VCU', 'Certificering', true)
  on conflict do nothing;
  v_project_a := 'dddddddd-0000-0000-0000-000000000001';

  -- Hours en risks voor test
  insert into hours (workspace_id, project_id, date, category, hours)
  values (v_workspace_a, v_project_a, current_date, 'Admin & Other', 2)
  on conflict do nothing
  returning id into v_hour_id;

  insert into risks (workspace_id, project_id, description)
  values (v_workspace_a, v_project_a, 'Testrisico')
  on conflict do nothing
  returning id into v_risk_id;

  raise notice 'Setup voltooid.';

  -- ============================================================
  -- TEST 1: Coordinator B ziet geen data van workspace A
  -- ============================================================
  -- (Simuleer in Supabase dashboard: log in als coordinator B)
  raise notice 'TEST 1: Cross-workspace isolatie — controleer handmatig in Supabase dashboard';
  raise notice '  - Log in als Coordinator B';
  raise notice '  - Controleer: geen tenants/projecten/uren van Workspace A zichtbaar';

  -- ============================================================
  -- TEST 2: Client ziet geen uren
  -- ============================================================
  raise notice 'TEST 2: Client kan geen uren opvragen — controleer via Supabase client als client-user';
  raise notice '  select count(*) from hours where project_id = ''dddddddd-0000-0000-0000-000000000001''';
  raise notice '  Verwacht: 0 rijen (RLS blokkeert)';

  -- ============================================================
  -- TEST 3: Client ziet geen risicos
  -- ============================================================
  raise notice 'TEST 3: Client kan geen risicos opvragen';
  raise notice '  select count(*) from risks where project_id = ''dddddddd-0000-0000-0000-000000000001''';
  raise notice '  Verwacht: 0 rijen';

  -- ============================================================
  -- TEST 4: Client kan niet-toegewezen taak niet wijzigen
  -- ============================================================
  raise notice 'TEST 4: Client update van niet-toegewezen taak gefaald';
  raise notice '  update tasks set done = true where phase_id in (select id from phases where project_id = ''dddddddd...'') and assignee_user_id != client_uuid';
  raise notice '  Verwacht: 0 rijen gewijzigd';

  -- ============================================================
  -- TEST 5: Interne logboekregel niet zichtbaar voor client
  -- ============================================================
  raise notice 'TEST 5: Interne logboek onzichtbaar voor client';
  raise notice '  Insert log_entry met internal = true als coordinator';
  raise notice '  Log in als client: select count(*) from log_entries — verwacht 0';

  raise notice '=== Tests gedocumenteerd. Voer handmatige tests uit via Supabase dashboard. ===';
end;
$$;

-- ============================================================
-- SQL-snippets voor directe API-tests (gebruik anon-key als client)
-- ============================================================

-- Test A: client leest uren (verwacht: lege array)
-- GET /rest/v1/hours?project_id=eq.<project_id>
-- Authorization: Bearer <client_jwt>
-- → Verwacht: []

-- Test B: client leest risicos (verwacht: lege array)
-- GET /rest/v1/risks?project_id=eq.<project_id>
-- → Verwacht: []

-- Test C: client update niet-eigen taak (verwacht: 0 updated)
-- PATCH /rest/v1/tasks?id=eq.<task_id_without_assignee>
-- {"done": true}
-- → Verwacht: 204 maar 0 rijen gewijzigd

-- Test D: coordinator A vs coordinator B
-- Coordinator B leest /rest/v1/tenants
-- → Verwacht: alleen eigen tenants, geen ENGR B.V.
