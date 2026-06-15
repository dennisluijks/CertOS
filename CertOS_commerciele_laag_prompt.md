# CertOS commerciële laag: Claude Code prompt (addendum op de SaaS-build)

Gebruik dit als VERVOLGPROMPT in dezelfde repo, nadat de SaaS-build (workspaces, rollen, klantportaal) staat. Het voegt toe: abonnementen met feature-gating, Stripe, een super-admin paneel, juridische pagina's met acceptatieflow, en een converterende marketing-homepage.

---

## Abonnementsmodel (besluit, verwerkt in de prompt)

| | **Solo** | **Pro** | **Bureau** |
|---|---|---|---|
| Prijs | € 0 | € 39/mnd of € 390/jr | € 119/mnd of € 1.190/jr |
| Klanten | 1 | Onbeperkt | Onbeperkt |
| Actieve trajecten | 2 | Onbeperkt | Onbeperkt |
| Klantportaal | — | ✓ (3 klantlogins per klant) | ✓ onbeperkt |
| AI-functies | 10 calls/mnd | 150 calls/mnd | 500 calls/mnd |
| Kennislaag + Normwijzer | ✓ | ✓ | ✓ |
| Auditmodus, Gantt, uren | ✓ | ✓ | ✓ |
| White-label (logo/kleur) | — | — | ✓ |
| Meerdere coördinatoren | — | — | ✓ (tot 5 seats) |
| Export | ✓ | ✓ | ✓ |

Logica: Solo is een echte werkende proef (1 klant = jouw eigen eerste traject), het klantportaal is de upgrade-trigger naar Pro, white-label + teams de trigger naar Bureau. Jaarprijs = 2 maanden gratis.

---

## DE PROMPT (kopieer alles hieronder in Claude Code)

```
Breid de bestaande CertOS-applicatie in deze repo uit met een commerciële laag.

## Brand tokens (verplicht toepassen in hele app, portaal, homepage en admin)
Logo: /public/logo.svg (volledig: schild + woordmerk Cert in navy, OS in green) en /public/mark.svg (alleen schild, ook favicon). De donkere navigatie-rail gebruikt de witte logovariant: woordmerk wit, OS en vinkje in Cert Green.
Kleuren als Tailwind-config en CSS-variabelen: navy #16294F (primair: koppen, rail), green #21A865 (uitsluitend CTA, succes, status Aantoonbaar), ink #0F1B33 (body), bone #F5F6F2 (achtergrond), paper #FFFFFF (kaarten), slate #56688A, line #DCDFE6, navyTint #E8EDF6, greenTint #E2F4EA, amber #C2881D, red #B23A2E, sky #3B7CB8, grey #9AA3B0. Verhouding 60% bone/paper, 30% navy/ink, 10% green + functioneel.
Statusladder overal identiek en heilig: grey = niet gestart, amber = in uitvoering, sky = geimplementeerd, green = aantoonbaar; red = te laat/fout/Gevraagd.
Typografie: Archivo (koppen weight 800, letterspacing -0.02em, navy; body 400/500, ink, regelafstand 1.55) en IBM Plex Mono (statussen, codes, labels: uppercase, letterspacing +0.06em). Mono-stempels met 1.5px rand in currentColor zijn een vast merkelement.
Vormtaal: 8-10px radius (stempels 4px), geen schaduwen (diepte via randen en bone/paper-contrast), lijn-iconen 1.5-2px navy, een groene primaire knop per scherm, chevron-motief uit het logo maximaal een keer per pagina als decoratie, geen emoji in de interface (wel toegestaan in de Snelle update WhatsApp-tekst).
Voice (Nederlands): jij-vorm, korte actieve zinnen, geen em dashes, geen uitroeptekens in de interface, vaktermen eerste keer uitleggen, bewijs boven beloftes, geen angstmarketing. Woordkeuze: traject, klant, maatregel, bewijs, aantoonbaar (niet: project, account, control, compliant). Bevestiging droog: "Dat is geregeld." Merkbelofte voor marketing: "Jij coordineert, CertOS weet."
 Raak de bestaande functionaliteit (workspaces, rollen, klantportaal, RLS) niet kwijt; bouw erbovenop. Alle teksten in het Nederlands, geen em dashes.

## 1. Abonnementen en feature-gating
Drie plannen op workspace-niveau: 'solo' (gratis), 'pro', 'bureau'.
- Migratie: workspaces krijgt plan text default 'solo', plan_interval text ('month','year'), stripe_customer_id, stripe_subscription_id, plan_valid_until timestamptz. Nieuwe tabel ai_usage (workspace_id, month text 'YYYY-MM', calls int) voor de AI-limiet.
- Limieten in lib/plans.ts als één config-object: solo {tenants:1, activeProjects:2, portal:false, aiCalls:10, whiteLabel:false, seats:1}, pro {tenants:null, activeProjects:null, portal:true, portalUsersPerTenant:3, aiCalls:150, whiteLabel:false, seats:1}, bureau {alles onbeperkt, portalUsersPerTenant:null, aiCalls:500, whiteLabel:true, seats:5}.
- Afdwinging server-side (server actions en API-routes), niet alleen in de UI: aanmaken van 2e klant op solo geeft nette upgrade-melding; klant uitnodigen op solo geeft upgrade-melding; AI-route telt ai_usage op en weigert boven de limiet met duidelijke melding en resterende-teller; white-label velden alleen schrijfbaar op bureau.
- UI: instellingenpagina "Abonnement" met huidig plan, gebruik (klanten, trajecten, AI-calls deze maand), en upgrade/downgrade-knoppen. Toon overal waar een limiet blokkeert een vriendelijke upsell-kaart met de relevante plannaam.

## 2. Stripe
- Stripe Checkout (subscriptions) voor pro en bureau, maand en jaar (4 prices). Env: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY en de 4 price-id's.
- Webhook /api/stripe/webhook: checkout.session.completed, customer.subscription.updated/deleted → plan, interval en plan_valid_until bijwerken; bij cancel terug naar solo aan het einde van de periode (data blijft staan, limieten gelden weer; bestaande extra klanten worden read-only, niet verwijderd).
- Billing portal-link (Stripe Customer Portal) op de abonnementspagina.
- Als Stripe-env ontbreekt: app blijft werken, upgrade-knoppen tonen "binnenkort beschikbaar" en de super-admin kan plannen handmatig toekennen.

## 3. Super-admin paneel (route /admin)
Toegang uitsluitend voor e-mailadressen in env SUPER_ADMIN_EMAILS (comma-separated), gecheckt server-side in layout en in elke admin-API; 404 voor anderen. Admin-queries draaien via de service-role op de server (nooit client-side), met aparte admin-API-routes.
Tabs, naar het voorbeeld van een klassiek SaaS-adminpaneel:
- Overzicht: totaal coördinatoren, totaal klantgebruikers, MRR, ARR, actief vandaag, actief deze week (op basis van een last_seen_at veld in profiles, bijgewerkt via middleware met throttle van 5 min), verdeling per abonnement met staafjes, recente registraties.
- Gebruikers: zoeken op e-mail/naam, filters op rol en plan, online-indicator (last_seen_at < 5 min), per gebruiker: workspace, plan, aantal klanten/trajecten, laatste activiteit. Acties: plan handmatig wijzigen (met reden, gelogd), account deactiveren/heractiveren (boolean in profiles, middleware blokkeert).
- Abonnementen: MRR/ARR-kaarten, betaalde gebruikers excl. admin en demo, tabel plan/prijs/aantal/omzet.
- Activiteit: registraties en logins per dag (laatste 30 dagen, simpele staafgrafiek), recentste acties uit activities.
- Feedback: in de app een klein feedback-widget (duim + tekstveld) voor coördinatoren; tabel feedback (user_id, score, text, created_at); admin ziet en markeert afgehandeld.
- Audit-log voor adminacties: admin_actions (admin_email, action, target, reason, created_at).
- Seed: maak demo-workspaces demo_solo@certos.app, demo_pro@certos.app, demo_bureau@certos.app met voorbeelddata, uitgesloten van MRR-telling.

## 4. Juridische pagina's en acceptatieflow
- Publieke routes: /privacy (privacyverklaring), /voorwaarden (algemene voorwaarden), /verwerkersovereenkomst (DPA), /cookies (cookieverklaring). Inhoud als goed gestructureerde Nederlandse concepttekst, toegespitst op deze dienst: SaaS voor certificeringscoördinatie, verwerking van zakelijke contactgegevens en projectdata, hosting EU (Supabase/Vercel EU-regio benoemen), subverwerkers (Supabase, Vercel, Stripe, Anthropic), bewaartermijnen (verwijdering binnen 30 dagen na opzegging), beveiligingsmaatregelen (RLS, encryptie in transit/at rest), datalekprocedure (melding binnen 72 uur), rechten van betrokkenen. Voorzie elke pagina van versienummer en datum, en bovenaan de markering CONCEPT: laten toetsen door een jurist.
- Verwerkersovereenkomst als acceptatieflow: bij eerste login van een coordinator een verplicht scherm met checkboxes voor algemene voorwaarden en verwerkersovereenkomst; opslag in legal_acceptances (user_id, doc_type, version, accepted_at, ip). Bij een nieuwe versie opnieuw vragen. Zonder acceptatie geen toegang tot de app (klantgebruikers accepteren alleen de voorwaarden en privacyverklaring, geen DPA).
- Cookieverklaring: alleen functionele cookies, dus een informatieve banner met "Begrepen", geen consent-manager.
- Footer in app en homepage met links naar alle vier de pagina's.

## 5. Marketing-homepage (route /, app verhuist naar /app met redirect voor ingelogde gebruikers)
Doel: bezoeker is een zelfstandig consultant of klein bureau dat certificeringstrajecten begeleidt. Conversiedoel: Google-login starten op het Solo-plan. Bouw een snelle, statische, SEO-vriendelijke pagina in dezelfde huisstijl (Brand tokens hierboven: navy/bone met Cert Green uitsluitend voor CTA's, Archivo + IBM Plex Mono, chevron-motief uit het logo als sectiescheiding) met deze secties en deze copy als basis:

1. Hero: kop "Begeleid bedrijven naar hun certificering. Zonder zelf de norm uit je hoofd te kennen." Subkop: "CertOS is het werkstation voor certificeringscoördinatoren: VCU, ISO en ISAE 3402 trajecten met ingebouwde normkennis, klantportaal en auditmodus." Primaire CTA "Start gratis met 1 klant", secundaire CTA "Bekijk de demo". Microcopy onder de knop: "Geen creditcard nodig. Inloggen met Google."
2. Vertrouwensstrook: badges VCU, ISO 9001, ISO 14001, ISO 27001, ISO 45001, ISAE 3402.
3. Probleemblok (herkenning): drie korte pijnpunten: "De checklist van het adviesbureau in je mailbox, het bewijs op SharePoint, de deadlines in je hoofd", "De klant vraagt elke week hoe het ervoor staat", "De auditor vraagt iets en jij zoekt".
4. Oplossing in drie kaarten met screenshots: Kennislaag ("per beheersmaatregel: wat het is, wat de auditor verwacht, wat je aanlevert en welke vraag je intern stelt"), Klantportaal ("jouw klant ziet voortgang en levert zelf aan; jouw huisstijl, jouw naam"), Auditmodus ("zoekbalk over alle maatregelen en bewijs, notities met tijdstempel, bevindingen direct geregistreerd").
5. Hoe het werkt in 3 stappen: klant aanmaken, norm kiezen (fasen en maatregelen staan klaar), checklist van het bureau met AI importeren.
6. Prijstabel met de drie plannen (Solo gratis, Pro 39, Bureau 119, jaartoggle met 2 maanden gratis), meest gekozen-badge op Pro, alle CTA's naar login.
7. FAQ (6 vragen): moet ik normexpert zijn (nee, daar is de kennislaag voor), vervangt dit het adviesbureau (nee, het coördineert ernaast), waar staat mijn data (EU, Supabase/Vercel), kan mijn klant meekijken (ja, portaal vanaf Pro), is er een verwerkersovereenkomst (ja, ingebouwd), kan ik opzeggen (maandelijks).
8. Slot-CTA en footer met juridische links.
SEO: Nederlandse title en meta description per pagina, Open Graph, sitemap, doelzoektermen verwerken: certificeringstraject begeleiden, VCU certificering coördineren, ISO 27001 implementatie tool, ISAE 3402 voorbereiding.

## Acceptatiecriteria
1. Solo-account kan geen 2e klant aanmaken en geen klant uitnodigen; ziet upsell met juiste plannaam.
2. Stripe-checkout upgradet naar Pro; webhook werkt; klantportaal direct beschikbaar; opzeggen zet aan einde periode terug naar Solo zonder dataverlies.
3. AI-limiet telt per workspace per maand en blokkeert netjes.
4. /admin is onzichtbaar voor normale accounts, toont MRR en gebruikers, plan handmatig wijzigen werkt en wordt gelogd.
5. Nieuwe coordinator kan de app niet in zonder acceptatie van voorwaarden en verwerkersovereenkomst; acceptatie staat met versie en tijdstip in de database.
6. Homepage scoort Lighthouse 90+ op performance en SEO en linkt naar alle juridische pagina's.

Werk stapsgewijs: plans + gating, dan Stripe, dan admin, dan juridisch, dan homepage. Run na elke stap de build.
```

---

## Mijn adviezen bij dit pakket

1. **Juridische teksten zijn concepten.** Claude Code levert degelijke Nederlandse templates, maar ik ben geen jurist en Claude Code ook niet. Laat de AV en verwerkersovereenkomst eenmalig toetsen (ca. € 500-1.000 bij een SaaS-jurist) vóór je eerste betalende externe gebruiker. Tot die tijd: de CONCEPT-markering staat er bewust in.
2. **Prijszetting**: € 39 Pro is bewust laag t.o.v. compliance-tools (€ 100-500/mnd) omdat je doelgroep zzp'ers zijn die uurtje-factuurtje denken; € 39 = een half declarabel uur. Verhogen kan altijd voor nieuwe klanten; verlagen voelt als zwakte.
3. **Demo-accounts** (zoals bij Rendiva) zitten in de seed: demo_solo/pro/bureau, uitgesloten van MRR. Gebruik demo_pro als verkoopdemo en zet er het ENGR-achtige voorbeeldtraject in.
4. **Volgorde van waarde**: gating + admin eerst (kun je handmatig plannen toekennen aan vroege gebruikers), Stripe kan een week later live. De prompt is daarop gebouwd: zonder Stripe-keys werkt alles behalve zelfbediening.
