-- ============================================================
-- CertOS Seed-script: demo-tenant met VCU-traject
-- Draai NADAT je bent ingelogd als coordinator en de UUID hieronder
-- hebt ingevuld met je eigen user_id (zie Supabase → Auth → Users)
-- ============================================================

-- STAP 1: Pas de coordinator UUID aan
do $$
declare
  v_coordinator_id uuid := auth.uid(); -- werkt als je dit als ingelogde gebruiker uitvoert
  v_workspace_id   uuid;
  v_tenant_id      uuid;
  v_project_id     uuid;
  v_phase_ids      uuid[] := array[]::uuid[];
  v_phase_id       uuid;
  v_pos            int := 0;
begin
  -- Haal workspace op
  select id into v_workspace_id from workspaces where owner_user_id = v_coordinator_id limit 1;

  if v_workspace_id is null then
    raise exception 'Geen workspace gevonden voor deze gebruiker. Log eerst in en maak een workspace aan.';
  end if;

  -- Demo tenant
  insert into tenants (id, workspace_id, name, sector, contact, email)
  values (
    gen_random_uuid(),
    v_workspace_id,
    'ENGR B.V.',
    'Techniek & Industrie',
    'Koen de Vries',
    'koen@engr.nl'
  )
  returning id into v_tenant_id;

  -- VCU-traject
  insert into projects (id, workspace_id, tenant_id, norm, kind, audit_date, ci, bureau, budget_max, client_visible)
  values (
    gen_random_uuid(),
    v_workspace_id,
    v_tenant_id,
    'VCU',
    'Certificering',
    current_date + interval '120 days',
    'Lloyd''s Register',
    'Demo Consultant',
    120,
    true
  )
  returning id into v_project_id;

  -- Fasen aanmaken (VCU Certificering template)
  for fase_naam, fase_taken in
    select * from (values
      ('Intake en scoping', array['Kick-off met klant', 'Scope en planning vastleggen', 'Adviesbureau/CI bevestigen']),
      ('Nulmeting', array['Gap-analyse t.o.v. VCU-checklist', 'Actieplan opstellen']),
      ('VG-systeem en handboek', array['VG-beleid opstellen', 'Procedures uitwerken', 'Registratieformulieren inrichten']),
      ('VIL-VCU diploma''s', array['Deelnemers bepalen', 'Examens boeken', 'Diploma''s geregistreerd']),
      ('Praktijkperiode (min. 3 mnd)', array['Toolboxen draaien', 'Werkplekcontacten registreren', 'Dossiers vullen', 'Incidentenproces actief']),
      ('Interne audit', array['Interne audit uitvoeren', 'Verbeterpunten oplossen']),
      ('Externe audit', array['Dossiers klaarzetten', 'Auditdag organiseren', 'Bevindingen opvolgen'])
    ) as t(fase_naam text, fase_taken text[])
  loop
    insert into phases (id, workspace_id, project_id, name, position, start_date, end_date)
    values (gen_random_uuid(), v_workspace_id, v_project_id, fase_naam, v_pos,
            current_date + (v_pos * 14 || ' days')::interval,
            current_date + ((v_pos + 1) * 14 || ' days')::interval)
    returning id into v_phase_id;

    foreach taak in array fase_taken loop
      insert into tasks (workspace_id, phase_id, name, position)
      values (v_workspace_id, v_phase_id, taak, 0);
    end loop;

    v_pos := v_pos + 1;
  end loop;

  -- VCU beheersmaatregelen
  insert into controls (workspace_id, project_id, code, name, description, status)
  values
    (v_workspace_id, v_project_id, 'VCU-1.1', 'VG-beleidsverklaring', 'Ondertekend door directie, actueel en gecommuniceerd', 0),
    (v_workspace_id, v_project_id, 'VCU-1.2', 'VG-functionaris benoemd', 'Verantwoordelijkheden en bevoegdheden vastgelegd', 0),
    (v_workspace_id, v_project_id, 'VCU-1.3', 'VIL-VCU diploma''s intercedenten', 'Alle intercedenten/leidinggevenden gediplomeerd', 0),
    (v_workspace_id, v_project_id, 'VCU-2.1', 'Aanvraagprocedure met VG-eisen', 'Functie-eisen en risico-informatie inlener vastgelegd', 0),
    (v_workspace_id, v_project_id, 'VCU-2.2', 'RI&E-informatie inlener', 'Relevante risico''s werkplek opgevraagd en gedocumenteerd', 0),
    (v_workspace_id, v_project_id, 'VCU-3.1', 'Selectie op VG-criteria', 'Match diploma''s/ervaring uitzendkracht met functie-eisen', 0),
    (v_workspace_id, v_project_id, 'VCU-3.2', 'Diplomaregistratie uitzendkrachten', 'VCA en overige certificaten geregistreerd met vervaldatum', 0),
    (v_workspace_id, v_project_id, 'VCU-4.1', 'Voorlichting en instructie', 'Uitzendkracht aantoonbaar geïnformeerd vóór plaatsing', 0),
    (v_workspace_id, v_project_id, 'VCU-4.2', 'Toolboxmeetings / VG-bewustzijn', 'Periodieke VG-communicatie, verslagen aanwezig', 0),
    (v_workspace_id, v_project_id, 'VCU-5.1', 'Periodiek contact uitzendkracht en inlener', 'Werkplekcontacten gepland en geregistreerd', 0),
    (v_workspace_id, v_project_id, 'VCU-6.1', 'Melding en registratie incidenten', 'Ongelukken/bijna-ongelukken geregistreerd en onderzocht', 0),
    (v_workspace_id, v_project_id, 'VCU-7.1', 'Dossierbeheer', 'Volledige, actuele dossiers per uitzendkracht', 0),
    (v_workspace_id, v_project_id, 'VCU-8.1', 'Interne audit', 'Jaarlijks uitgevoerd, verslag en verbeterpunten aanwezig', 0),
    (v_workspace_id, v_project_id, 'VCU-8.2', 'Directiebeoordeling', 'Systeemevaluatie door directie, vastgelegd met acties', 0);

  -- Initieel logboekitem
  insert into log_entries (workspace_id, project_id, date, text, internal)
  values (v_workspace_id, v_project_id, current_date, 'Traject aangemaakt via seed-script. ENGR B.V. start VCU-certificering.', false);

  raise notice 'Seed gereed. Tenant: ENGR B.V., Project: VCU, Workspace: %', v_workspace_id;
end;
$$;
