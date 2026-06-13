# CertOS

Multi-tenant SaaS voor certificeringsbeheer. Coördinerende consultants begeleiden klanten naar VCU-, ISO- en ISAE 3402-certificeringen. Inclusief klantportaal met taakopdracht en documentaanlevering.

## Stack

- Next.js 16 (App Router), TypeScript, Tailwind CSS v4
- Supabase: Postgres, Auth (Google OAuth), Row Level Security
- Vercel deploy-target
- Anthropic API (server-side only)

---

## Stap 1 — Supabase opzetten

1. Maak een nieuw project op [app.supabase.com](https://app.supabase.com)
2. Ga naar **Authentication → Providers → Google**
3. Voeg Google OAuth toe:
   - Maak een project in [Google Cloud Console](https://console.cloud.google.com)
   - Maak OAuth 2.0-credentials aan
   - Zet bij Authorized redirect URIs: `https://<supabase-ref>.supabase.co/auth/v1/callback`
   - Kopieer Client ID en Secret naar Supabase
4. Ga naar **Authentication → URL Configuration**:
   - Site URL: `https://jouw-vercel-domein.vercel.app`
   - Redirect URLs: `https://jouw-vercel-domein.vercel.app/auth/callback`

## Stap 2 — Migraties uitvoeren

```bash
# Via Supabase SQL Editor (aanbevolen voor eerste keer)
# Voer deze bestanden in volgorde uit:
# 1. supabase/migrations/001_initial_schema.sql
# 2. supabase/migrations/002_rls_helpers.sql
# 3. supabase/migrations/003_triggers.sql

# Of met Supabase CLI:
npx supabase db push
```

## Stap 3 — Environment variables

```bash
cp .env.example .env.local
# Vul de waarden in uit je Supabase-project en Anthropic Console
```

## Stap 4 — Lokaal starten

```bash
npm install
npm run dev
# Open http://localhost:3000
```

## Stap 5 — Vercel deployment

```bash
# Zet environment variables via Vercel dashboard of CLI:
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add ANTHROPIC_API_KEY
# NOOIT: NEXT_PUBLIC_ prefix op ANTHROPIC_API_KEY of SUPABASE_SERVICE_ROLE_KEY

vercel deploy --prod
```

## Stap 6 — Seed-data aanmaken

Na de eerste login als coordinator:
1. Maak een workspace aan (onboarding)
2. Ga naar Supabase SQL Editor
3. Voer `supabase/seed.sql` uit — dit maakt demo-tenant ENGR B.V. met VCU-traject aan

## Een klantgebruiker uitnodigen en testen

1. Log in als coordinator
2. Ga naar **Klanten**
3. Klik op "Portaaltoegang" bij een klant
4. Vul een e-mailadres in en klik "Uitnodigen"
5. Log in met dat e-mailadres via Google → automatische redirect naar `/portal`

De klant ziet:
- Overzicht: voortgangskaarten per traject
- Mijn taken: toegewezen taken met afvinkmogelijkheid en reactiefunctie
- Documenten: documenten aanleveren via link

## RLS-tests uitvoeren

Zie `supabase/tests/rls_tests.sql` voor testscenario's.

Verificeer handmatig:
- Log in als Coordinator B → geen data van Coordinator A zichtbaar
- Log in als client → geen uren, risico's of interne logboekregels zichtbaar
- Client update niet-eigen taak → 0 rijen gewijzigd (RLS blokkeert)

## Projectstructuur

```
app/
  auth/          — Login, callback, onboarding, error
  dashboard/     — Coordinator interface
    klanten/     — Klantbeheer + portaaltoegang
    trajecten/   — Projectdetail met alle tabs
    normwijzer/  — Kennislaag per norm
    actiecentrum/ — Open acties + klantactiviteit
    week/        — Mijn week
    backup/      — JSON-export
    instellingen/ — Workspace-instellingen
  portal/        — Klantportaal
    taken/       — Mijn taken (afvinkbaar)
    documenten/  — Documenten aanleveren
  api/ai/        — Server-side AI-routes (coordinator only)
lib/
  supabase/      — Server/client/middleware helpers
  norms.ts       — Alle normdata (VCU, ISO, ISAE)
  ai.ts          — AI-client helper
supabase/
  migrations/    — Database schema + RLS + triggers
  tests/         — RLS-testscripts
  seed.sql       — Demo-data
types/
  database.ts    — Supabase TypeScript types
```

## Merkbelofte

"Jij coordineert, CertOS weet."
