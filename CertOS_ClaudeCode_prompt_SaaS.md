# CertOS SaaS: Claude Code prompt (v2, vervangt de eerdere prompt volledig)

## Het rollenmodel in één oogopslag

| Rol | Ziet | Mag |
|---|---|---|
| **Coördinator** (betalende gebruiker) | Eigen workspace: al zijn klanten en trajecten | Alles binnen eigen workspace |
| **Klantgebruiker** (uitgenodigd per klant) | Alleen trajecten van zijn eigen bedrijf, en alleen wat de coördinator zichtbaar maakt | Alleen eigen toegewezen taken afvinken, eigen toegewezen documenten aanleveren (link + status), reageren in taakcommentaar. Verder strikt read-only |
| Klant ziet NOOIT | Uren/budget, risicoregister, interne logboeknotities, andere klanten, AI-functies, kostgegevens | — |

## Slimme functionaliteit die dit vermarktbaar maakt (zit in de prompt verwerkt)

1. **Workspaces i.p.v. losse accounts**: elke coördinator krijgt bij eerste login een eigen workspace. Schema is voorbereid op meerdere coördinatoren per workspace (teams) en een `plan`-veld voor latere Stripe-koppeling, zonder dat nu te bouwen.
2. **Klant-uitnodigingen per bedrijf**: coördinator nodigt uit op e-mail, klant logt in met Google, ziet direct het juiste portaal. Geen wachtwoordbeheer.
3. **Klantportaal als verkoopargument**: de klant ziet een nette voortgangspagina (fasen, Gantt, maatregelstatussen, "Mijn taken", "Aan te leveren documenten"). Dat oogt professioneel en bespaart de coördinator rapportagewerk: het portaal ÍS de statusupdate.
4. **Toewijzen wordt echt toewijzen**: het vrije "houder"-veld blijft, maar per taak/document kun je nu ook een klantgebruiker koppelen. Alleen dan kan die persoon iets doen.
5. **Zichtbaarheidsregie bij de coördinator**: per traject een klant-zichtbaar schakelaar, logboeknotities standaard intern, bevindingen per stuk deelbaar. Jij bepaalt wat de klant ziet, met veilige defaults.
6. **Aanleverflow voor documenten**: klant plakt een link (SharePoint/Drive) en zet status op "Ontvangen"; coördinator valideert. Precies jouw checklist-werkstroom, maar dan duwt de klant zelf.
7. **Taakcommentaar**: korte reacties per taak tussen klant en coördinator, zodat "is dit het juiste document?" niet via losse mails loopt.
8. **Activiteitenfeed voor de coördinator**: alles wat klanten doen (taak afgevinkt, document aangeleverd, reactie geplaatst) verschijnt in het Actiecentrum onder "Klantactiviteit", met ongelezen-teller.
9. **White-label-light**: workspace-naam, accentkleur en logo-URL; het klantportaal toont de huisstijl van de coördinator, niet van CertOS. Belangrijk verkoopargument richting andere consultants.
10. **Verdedigde grenzen op databaseniveau**: alle rechten zijn afgedwongen met Row Level Security en kolom-guards, niet alleen in de interface. Een handige klant met de developer console kan dus niets extra's.

---

## DE PROMPT (kopieer alles hieronder in Claude Code; zet CertOS_v4.jsx in de map)

```
Bouw een productieklare multi-tenant SaaS-webapplicatie genaamd CertOS: een certificeringsbeheer-tool waarmee coördinerende consultants bedrijven naar VCU-, ISO- en ISAE 3402-certificeringen begeleiden, inclusief een read-only klantportaal met taak-interactie. In deze map staat CertOS_v4.jsx: een volledig werkend single-file React prototype. Dit bestand is de functionele specificatie voor het coördinatorgedeelte. Porteer ALLE functionaliteit, datastructuren, Nederlandse teksten, de complete GUIDE-kennislaag, de normtemplates (VCU_CONTROLS, ISO_HLS_CONTROLS, ISO_EXTRA, ISAE_CONTROLS, phasesFor, NORM_INFO) en het visuele ontwerp volgens de Brand tokens hieronder (deze vervangen de prototype-kleuren #1B2A30/#1E7A5A). Verzin geen vereenvoudigde versie; het prototype is leidend, deze prompt voegt het rollen- en SaaS-model toe.

## Stack
- Next.js 15, App Router, TypeScript, Tailwind CSS
- Supabase: Postgres, Auth (Google OAuth via @supabase/ssr), Row Level Security
- Vercel als deploy-target
- Anthropic API (claude-sonnet-4-20250514) voor AI-functies, uitsluitend server-side; ANTHROPIC_API_KEY komt nooit in client code
- Geen extra UI-frameworks

## Brand tokens (verplicht toepassen in hele app, portaal, homepage en admin)
Logo: /public/logo.svg (volledig: schild + woordmerk Cert in navy, OS in green) en /public/mark.svg (alleen schild, ook favicon). De donkere navigatie-rail gebruikt de witte logovariant: woordmerk wit, OS en vinkje in Cert Green.
Kleuren als Tailwind-config en CSS-variabelen: navy #16294F (primair: koppen, rail), green #21A865 (uitsluitend CTA, succes, status Aantoonbaar), ink #0F1B33 (body), bone #F5F6F2 (achtergrond), paper #FFFFFF (kaarten), slate #56688A, line #DCDFE6, navyTint #E8EDF6, greenTint #E2F4EA, amber #C2881D, red #B23A2E, sky #3B7CB8, grey #9AA3B0. Verhouding 60% bone/paper, 30% navy/ink, 10% green + functioneel.
Statusladder overal identiek en heilig: grey = niet gestart, amber = in uitvoering, sky = geimplementeerd, green = aantoonbaar; red = te laat/fout/Gevraagd.
Typografie: Archivo (koppen weight 800, letterspacing -0.02em, navy; body 400/500, ink, regelafstand 1.55) en IBM Plex Mono (statussen, codes, labels: uppercase, letterspacing +0.06em). Mono-stempels met 1.5px rand in currentColor zijn een vast merkelement.
Vormtaal: 8-10px radius (stempels 4px), geen schaduwen (diepte via randen en bone/paper-contrast), lijn-iconen 1.5-2px navy, een groene primaire knop per scherm, chevron-motief uit het logo maximaal een keer per pagina als decoratie, geen emoji in de interface (wel toegestaan in de Snelle update WhatsApp-tekst).
Voice (Nederlands): jij-vorm, korte actieve zinnen, geen em dashes, geen uitroeptekens in de interface, vaktermen eerste keer uitleggen, bewijs boven beloftes, geen angstmarketing. Woordkeuze: traject, klant, maatregel, bewijs, aantoonbaar (niet: project, account, control, compliant). Bevestiging droog: "Dat is geregeld." Merkbelofte voor marketing: "Jij coordineert, CertOS weet."

## Rollen en toegangsmodel
Twee rollen: 'coordinator' en 'client'.
- Een nieuwe Google-login zonder openstaande uitnodiging wordt coordinator en krijgt automatisch een eigen workspace.
- Een Google-login waarvan het e-mailadres een openstaande uitnodiging heeft, wordt client en wordt gekoppeld aan de tenant(s) van die uitnodiging. Een gebruiker kan client zijn bij meerdere tenants (ook over workspaces heen) maar is in deze versie nooit tegelijk coordinator.
- Coordinator ziet en beheert alles binnen de eigen workspace.
- Client ziet uitsluitend: tenants waar hij lid van is; projecten van die tenants waar client_visible = true; bijbehorende fasen, taken, planning (Gantt read-only), maatregelen (status + naam + kennislaag-uitleg, niet het interne notitieveld), documenten, bevindingen met client_visible = true, vervaldata, en logboekregels met internal = false.
- Client ziet NOOIT: uren, budgetten, risicoregister, interne logboekregels, andere tenants of workspaces, AI-functies, exportfunctie.
- Client mag UITSLUITEND: (1) tasks.done togglen en task_comments plaatsen op taken waar assignee_user_id = zijn user id; (2) op documenten waar assignee_user_id = zijn user id het veld link invullen en de status van 0 (Gevraagd) naar 1 (Ontvangen) zetten; (3) zijn eigen comments plaatsen op zijn eigen taken. Alle andere mutaties zijn verboden, ook via directe API-calls.

## Databaseschema (Supabase-migraties in supabase/migrations, met RLS en indexes)
- workspaces: id uuid pk, name text, owner_user_id uuid, accent_color text default '#1E7A5A', logo_url text, plan text default 'free', created_at
- workspace_members: workspace_id fk cascade, user_id, role text check in ('owner','coordinator'), pk (workspace_id, user_id)
- profiles: user_id uuid pk (references auth.users), email text, full_name text, global_role text check in ('coordinator','client')
- tenants: id uuid pk, workspace_id fk cascade, name, sector, contact, email, created_at
- tenant_members: tenant_id fk cascade, user_id, role text default 'client', invited_by uuid, created_at, pk (tenant_id, user_id)
- invitations: id uuid pk, workspace_id, tenant_id fk cascade, email text, status text check in ('open','accepted','revoked') default 'open', created_at; unique (tenant_id, email) where status = 'open'
- projects: id uuid pk, workspace_id, tenant_id fk cascade, norm text check (6 normen), kind text check, audit_date date, ci text, bureau text, budget_max numeric default 0, client_visible boolean default true, created_at
- phases: id, workspace_id, project_id fk cascade, name, position int, start_date, end_date
- tasks: id, workspace_id, phase_id fk cascade, name, done boolean default false, owner text default '', assignee_user_id uuid null, due date, position int
- task_comments: id, workspace_id, task_id fk cascade, user_id, body text, created_at
- controls: id, workspace_id, project_id fk cascade, code, name, description, status int 0-3, note text default '', link text default '' (klikbare bewijslink naar SharePoint/Drive)
- documents: id, workspace_id, project_id fk cascade, name, status int 0-3, owner text default '', assignee_user_id uuid null, due date, link text default ''
- findings: id, workspace_id, project_id fk cascade, description, source, severity, status int, owner text default '', due date, note text default '', link text default '' (herstelbewijs-URL), client_visible boolean default false
- risks: id, workspace_id, project_id fk cascade, description, impact, mitigation, status int
- hours: id, workspace_id, project_id fk cascade, date, category, hours numeric, note
- log_entries: id, workspace_id, project_id fk cascade, date, text, internal boolean default true, created_at
- expiries: id, workspace_id, project_id fk cascade, name, type, holder, date
- activities: id, workspace_id, project_id, actor_user_id, kind text (task_done, doc_delivered, comment), description text, read boolean default false, created_at

RLS-strategie:
- Helperfuncties (security definer): is_workspace_member(ws_id), is_tenant_client(tenant_id), client_can_see_project(project_id).
- Coordinator-policies: volledige CRUD waar is_workspace_member(workspace_id).
- Client-select-policies per tabel exact volgens het toegangsmodel hierboven; geen select-policy voor client op hours, risks, workspaces (behalve naam/branding via een view workspace_branding), invitations, activities.
- Client-update-policies: tasks alleen waar assignee_user_id = auth.uid(), en een BEFORE UPDATE trigger die voor rol client elke kolomwijziging behalve done terugdraait; documents alleen waar assignee_user_id = auth.uid(), trigger staat alleen wijziging van link toe en status uitsluitend van 0 naar 1. task_comments: insert waar de taak van de client is, select voor beide rollen, geen update/delete voor client.
- Triggers schrijven bij client-acties een rij in activities (taak afgerond, document aangeleverd, comment geplaatst) en een log_entry met internal = false.
- Test de policies met pgTAP of een SQL-testscript: client kan geen uren lezen, geen andere tenant zien, geen taakstatus van andermans taak wijzigen.

## Onboarding en uitnodigingen
- Eerste login coordinator: maak profiles-rij, workspace, workspace_members (owner). Toon korte onboarding (workspacenaam + accentkleur).
- Coordinator nodigt klantgebruikers uit op het klantdetailscherm: e-mail invoeren → invitations-rij → deelbare uitnodigingslink (en mail via Supabase indien beschikbaar). Bestaat het e-mailadres al als gebruiker, koppel direct.
- Eerste login client met openstaande uitnodiging: profiles-rij met global_role client, tenant_members-koppeling, invitation op accepted, redirect naar klantportaal.
- Coordinator kan klanttoegang per persoon intrekken.

## Coördinator-interface
Alles uit CertOS_v4.jsx, plus:
- Klantdetail: blok "Portaaltoegang" met uitgenodigde/actieve klantgebruikers, uitnodigen en intrekken.
- Taken en documenten: naast het vrije houder-veld een dropdown "toewijzen aan" met de klantgebruikers van die tenant; toegewezen items tonen een portaal-icoon.
- Trajectinstellingen: schakelaar "Zichtbaar in klantportaal" (client_visible); bevindingen krijgen per rij een deel-schakelaar; logboek krijgt per regel intern/gedeeld met intern als default.
- Actiecentrum: extra sectie "Klantactiviteit" gevoed door activities, met ongelezen-markering en knop alles gelezen.
- Workspace-instellingen: naam, accentkleur, logo-URL (white-label voor het portaal).
- AI-routes (/api/ai) alleen voor coordinators (403 voor clients), met rate limit per workspace.

## Klantportaal (route /portal, automatische redirect voor rol client)
- Huisstijl: accentkleur en logo van de workspace, naam van de coördinator als afzender.
- Home: per zichtbaar traject een voortgangskaart (percentage, auditdatum-countdown, fase-overzicht).
- Mijn taken: alle aan deze gebruiker toegewezen open taken over alle trajecten, afvinkbaar, met commentaarveld per taak.
- Aan te leveren documenten: toegewezen documenten met linkveld en knop "Aangeleverd" (status naar Ontvangen); duidelijke uitleg dat de coördinator valideert.
- Trajectweergave: fasen met taakstatus, Gantt read-only, maatregelen met status en de publieksvriendelijke kennislaag-uitleg, gedeelde bevindingen, gedeelde logboekregels, vervaldata.
- Lege staten en teksten in helder Nederlands, geen vakjargon zonder uitleg, geen em dashes.

## Overig
- Export (JSON) van de hele workspace, alleen coordinator.
- Seed-script: demo-tenant met VCU-traject voor de ingelogde coordinator.
- .env.example: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY.
- README: Supabase-setup, Google OAuth-configuratie (redirect URI's), migraties, Vercel-deploy, en hoe je een klantgebruiker uitnodigt en test.

## Acceptatiecriteria
1. Coordinator A en coordinator B loggen in; geen van beiden ziet ook maar één record van de ander.
2. Coordinator A maakt klant ENGR met VCU-traject, nodigt client uit; client logt in en ziet alleen het ENGR-portaal.
3. Client vinkt een toegewezen taak af en levert een document aan met link; coordinator ziet beide direct in Klantactiviteit en de documentstatus staat op Ontvangen.
4. Client kan via de API aantoonbaar geen uren of risico's opvragen en geen niet-toegewezen taak wijzigen (RLS-test).
5. Interne logboekregel is onzichtbaar in het portaal; gedeelde regel zichtbaar.
6. Trajectschakelaar client_visible uit → traject verdwijnt direct uit het portaal.
7. Alle prototype-functionaliteit (Mijn week, Actiecentrum, Normwijzer, Auditmodus, Snelle update, Gantt, AI-functies, uren, back-upexport) werkt voor de coordinator.

Werk stapsgewijs: migraties + RLS + policy-tests, dan auth/onboarding, dan coördinator-schermen, dan klantportaal, dan AI-routes. Run na elke stap de build en de RLS-tests en los fouten direct op.
```

---

## Deploy-checklist (gelijk aan eerder)

1. Supabase-project + Google OAuth provider instellen (redirect: `https://<ref>.supabase.co/auth/v1/callback`).
2. `vercel env add` voor de 4 variabelen; ANTHROPIC_API_KEY nooit als NEXT_PUBLIC.
3. Site URL en Redirect URL's in Supabase op het Vercel-domein.
4. Migraties draaien, seed, acceptatiecriteria doorlopen met twee Google-accounts plus een derde als klant.

## Strategische noot bij vermarkten

- **Prijsmodel klaar, betaling later**: het `plan`-veld zit in het schema; Stripe-koppeling is een vervolgprompt zodra je eerste betalende coördinator zich meldt. Bouw het niet eerder.
- **Het klantportaal is je demo**: laat Koen als eerste klantgebruiker inloggen op het ENGR-traject. Zijn ervaring is meteen je verkoopmateriaal richting andere consultants.
- **Juridisch minimum vóór externe gebruikers**: verwerkersovereenkomst-template, privacyverklaring en een datalek-procedure. Niet sexy, wel verplicht zodra coördinatoren klantdata van derden invoeren.
