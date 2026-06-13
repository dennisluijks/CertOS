export const nl = {
  nav: {
    login: "Inloggen",
    start: "Start gratis",
  },
  hero: {
    headline: "Begeleid bedrijven naar hun certificering. Zonder zelf de norm uit je hoofd te kennen.",
    sub: "CertOS is het werkstation voor certificeringscoördinatoren: VCU, ISO en ISAE 3402 trajecten met ingebouwde normkennis, klantportaal en auditmodus.",
    cta_primary: "Start gratis met 1 klant",
    cta_secondary: "Bekijk de demo",
    microcopy: "Geen creditcard nodig. Inloggen met Google.",
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
        body: "Jouw klant ziet voortgang en levert documenten zelf aan. Jouw huisstijl, jouw naam.",
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
      { num: "1", title: "Klant aanmaken", body: "Voeg een klant toe en stel het portaal in met hun naam en huisstijl." },
      { num: "2", title: "Norm kiezen", body: "Kies VCU, ISO 9001, 14001, 27001, 45001 of ISAE 3402. Fasen en maatregelen staan klaar." },
      { num: "3", title: "Checklist importeren", body: "Plak een gespreksverslag en de AI maakt taken aan, werkt statussen bij en schrijft het logboek." },
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
        name: "Solo",
        price_month: "0",
        price_year: "0",
        description: "Jouw eerste traject. Gratis, altijd.",
        features: [
          "1 klant",
          "2 actieve trajecten",
          "Kennislaag en normwijzer",
          "10 AI-calls per maand",
          "Auditmodus, Gantt, uren",
        ],
        cta: "Start gratis",
      },
      {
        name: "Pro",
        price_month: "39",
        price_year: "32",
        description: "Voor de consultant die groeit.",
        features: [
          "Onbeperkt klanten",
          "Onbeperkt trajecten",
          "Klantportaal (3 logins per klant)",
          "150 AI-calls per maand",
          "Alles van Solo",
        ],
        cta: "Start Pro",
      },
      {
        name: "Bureau",
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
        cta: "Start Bureau",
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
        q: "Vervangt CertOS mijn adviesbureau?",
        a: "Nee. CertOS coördineert naast het adviesbureau: jij voert de regie, zij leveren de expertise.",
      },
      {
        q: "Waar staat mijn data?",
        a: "In de EU. Wij gebruiken Supabase en Vercel, beide met EU-datacenters. Subverwerkers: Supabase, Vercel, Stripe, Anthropic.",
      },
      {
        q: "Kan mijn klant meekijken?",
        a: "Ja, via het klantportaal. Dat is beschikbaar vanaf het Pro-plan.",
      },
      {
        q: "Is er een verwerkersovereenkomst?",
        a: "Ja. De verwerkersovereenkomst is ingebouwd in de acceptatieflow bij je eerste login.",
      },
      {
        q: "Kan ik opzeggen?",
        a: "Ja, maandelijks. Bij opzegging ga je aan het einde van de betaalde periode terug naar Solo. Je data blijft staan.",
      },
    ],
  },
  cta_footer: {
    title: "Klaar om te beginnen?",
    sub: "Maak een gratis account aan en voeg je eerste klant toe.",
    button: "Start gratis met Google",
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
