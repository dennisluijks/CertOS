export const nl = {
  nav: {
    login: "Inloggen",
    start: "Begin gratis",
    dashboard: "Dashboard",
    actiecentrum: "Actiecentrum",
    week: "Mijn week",
    klanten: "Klanten",
    normwijzer: "Normwijzer",
    nieuw: "Nieuw traject",
    backup: "Back-up",
    instellingen: "Instellingen",
    uitloggen: "Uitloggen",
  },
  hero: {
    headline: "Houd de regie over elk certificeringstraject. Zonder elke norm uit je hoofd te kennen.",
    sub: "CertOS bundelt trajecten, normkennis, klantportaal en auditmodus in één overzicht. Voor de externe coordinator én de interne kwaliteitsmanager.",
    cta_primary: "Begin gratis",
    cta_secondary: "Bekijk de demo",
    trust: ["Gratis te starten", "Data in de EU", "Geen installatie"],
  },
  trust: {
    label: "Ondersteunde normen",
  },
  problem: {
    title: "Herkenbaar?",
    items: [
      {
        title: "Alles in je hoofd",
        body: "De checklist van het adviesbureau in je mailbox, het bewijs op SharePoint, de deadlines in je hoofd.",
      },
      {
        title: "Klant wil weten hoe het staat",
        body: "De klant vraagt elke week hoe het ervoor staat en jij zoekt de antwoorden bij elkaar.",
      },
      {
        title: "Auditor verrast je",
        body: "De auditor vraagt iets en jij zoekt in mappen, mails en geheugen tegelijk.",
      },
    ],
  },
  features: {
    title: "Wat CertOS doet",
    items: [
      {
        tag: "KENNISLAAG",
        title: "De norm uitgelegd per maatregel",
        body: "Per beheersmaatregel: wat het is, wat de auditor verwacht, wat je aanlevert en welke vraag je intern stelt.",
      },
      {
        tag: "KLANTPORTAAL",
        title: "Klant levert zelf aan",
        body: "Jouw klant of collega ziet voortgang en levert documenten zelf aan. Jouw huisstijl, jouw naam.",
      },
      {
        tag: "AUDITMODUS",
        title: "Klaar voor de auditor",
        body: "Zoekbalk over alle maatregelen en bewijs, notities met tijdstempel, bevindingen direct geregistreerd.",
      },
    ],
  },
  how: {
    title: "Zo werkt het",
    steps: [
      { num: "1", title: "Klant of afdeling toevoegen", body: "Voeg een klant of interne afdeling toe en stel het portaal in met hun naam en huisstijl." },
      { num: "2", title: "Norm kiezen", body: "Kies VCU, ISO 9001, 14001, 27001, 45001 of ISAE 3402. Fasen en maatregelen staan klaar." },
      { num: "3", title: "AI verwerkt het overleg", body: "Plak een gespreksverslag en de AI maakt taken aan, werkt statussen bij en schrijft het logboek." },
    ],
  },
  pricing: {
    title: "Eenvoudige prijzen",
    sub: "Begin gratis. Upgrade wanneer je klaar bent.",
    toggle_month: "Per maand",
    toggle_year: "Per jaar",
    year_discount: "2 maanden gratis",
    per_month: "/mnd",
    cta: "Begin nu",
    most_popular: "Meest gekozen",
    plans: [
      {
        name: "Gratis",
        price_month: "0",
        price_year: "0",
        description: "Jouw eerste traject. Gratis, altijd.",
        features: [
          "1 klant of afdeling",
          "2 actieve trajecten",
          "Kennislaag en normwijzer",
          "10 AI-calls per maand",
          "Auditmodus, Gantt, uren",
        ],
        cta: "Begin gratis",
      },
      {
        name: "Pro",
        price_month: "39",
        price_year: "32",
        description: "Voor de coordinator die groeit.",
        features: [
          "Onbeperkt klanten",
          "Onbeperkt trajecten",
          "Klantportaal (3 logins per klant)",
          "150 AI-calls per maand",
          "Alles van Gratis",
        ],
        cta: "Aan de slag met Pro",
      },
      {
        name: "Team",
        price_month: "119",
        price_year: "99",
        description: "Voor het team dat serieus schaalt.",
        features: [
          "Alles van Pro, onbeperkt",
          "White-label klantportaal",
          "Tot 5 coördinatoren",
          "500 AI-calls per maand",
          "Onbeperkte klantlogins",
        ],
        cta: "Aan de slag met Team",
      },
    ],
  },
  faq: {
    title: "Veelgestelde vragen",
    items: [
      {
        q: "Moet ik normexpert zijn om CertOS te gebruiken?",
        a: "Nee. De kennislaag legt per beheersmaatregel uit wat het is, wat de auditor verwacht en welk bewijs je aanlevert.",
      },
      {
        q: "Is CertOS ook geschikt voor interne kwaliteitsmanagers?",
        a: "Ja. CertOS is gebouwd voor iedereen die de regie heeft over een certificeringstraject: externe coordinator, interne QHSE-manager of CISO.",
      },
      {
        q: "Waar staat mijn data?",
        a: "In de EU. Wij gebruiken Supabase en Vercel, beide met EU-datacenters. Subverwerkers: Supabase, Vercel, Stripe, Anthropic.",
      },
      {
        q: "Kan mijn klant of collega meekijken?",
        a: "Ja, via het portaal. Beschikbaar vanaf het Pro-plan.",
      },
      {
        q: "Is er een verwerkersovereenkomst?",
        a: "Ja. De verwerkersovereenkomst is ingebouwd in de acceptatieflow bij je eerste login.",
      },
      {
        q: "Kan ik opzeggen?",
        a: "Ja, maandelijks. Bij opzegging ga je aan het einde van de betaalde periode terug naar Gratis. Je data blijft staan.",
      },
    ],
  },
  cta_footer: {
    title: "Zet je eerste traject op.",
    sub: "Maak een account en ga vandaag aan de slag.",
    button: "Begin gratis",
  },
  footer: {
    tagline: "Jij coordineert, CertOS weet.",
    privacy: "Privacyverklaring",
    terms: "Algemene voorwaarden",
    dpa: "Verwerkersovereenkomst",
    cookies: "Cookies",
    copyright: "CertOS",
  },
};

export type Translations = typeof nl;
