import type { Translations } from "./nl";

export const en: Translations = {
  nav: {
    login: "Sign in",
    start: "Start free",
  },
  hero: {
    headline: "Guide companies to certification. Without memorising every standard yourself.",
    sub: "CertOS is the workstation for certification coordinators: VCU, ISO and ISAE 3402 projects with built-in norm knowledge, client portal and audit mode.",
    cta_primary: "Start free with 1 client",
    cta_secondary: "View the demo",
    microcopy: "No credit card required. Sign in with Google.",
  },
  trust: {
    label: "Supported standards",
  },
  problem: {
    title: "Sound familiar?",
    items: [
      {
        title: "Everything in your head",
        body: "The consultancy checklist in your inbox, evidence on SharePoint, deadlines in your memory.",
      },
      {
        title: "Client wants a status update",
        body: "Every week the client asks how things are going and you piece the answer together.",
      },
      {
        title: "The auditor surprises you",
        body: "The auditor asks for something and you search folders, emails and memory all at once.",
      },
    ],
  },
  features: {
    title: "What CertOS does",
    items: [
      {
        tag: "KNOWLEDGE LAYER",
        title: "The standard explained per control",
        body: "Per control: what it means, what the auditor expects, what evidence to provide and which question to ask internally.",
      },
      {
        tag: "CLIENT PORTAL",
        title: "Client delivers themselves",
        body: "Your client sees progress and submits documents directly. Your branding, your name.",
      },
      {
        tag: "AUDIT MODE",
        title: "Ready for the auditor",
        body: "Search across all controls and evidence, timestamped notes, findings registered immediately.",
      },
    ],
  },
  how: {
    title: "How it works",
    steps: [
      { num: "1", title: "Add a client", body: "Create a client and set up their portal with their name and brand." },
      { num: "2", title: "Choose a standard", body: "Pick VCU, ISO 9001, 14001, 27001, 45001 or ISAE 3402. Phases and controls are ready to go." },
      { num: "3", title: "Import meeting notes", body: "Paste a meeting transcript and AI creates tasks, updates statuses and writes the log." },
    ],
  },
  pricing: {
    title: "Simple pricing",
    sub: "Start free. Upgrade when you're ready.",
    toggle_month: "Monthly",
    toggle_year: "Yearly",
    year_discount: "2 months free",
    per_month: "/mo",
    cta: "Get started",
    most_popular: "Most popular",
    plans: [
      {
        name: "Solo",
        price_month: "0",
        price_year: "0",
        description: "Your first project. Free, always.",
        features: [
          "1 client",
          "2 active projects",
          "Knowledge layer and norm guide",
          "10 AI calls per month",
          "Audit mode, Gantt, hours",
        ],
        cta: "Start free",
      },
      {
        name: "Pro",
        price_month: "39",
        price_year: "32",
        description: "For the consultant who is growing.",
        features: [
          "Unlimited clients",
          "Unlimited projects",
          "Client portal (3 logins per client)",
          "150 AI calls per month",
          "Everything in Solo",
        ],
        cta: "Start Pro",
      },
      {
        name: "Agency",
        price_month: "119",
        price_year: "99",
        description: "For the team that scales seriously.",
        features: [
          "Everything in Pro, unlimited",
          "White-label client portal",
          "Up to 5 coordinators",
          "500 AI calls per month",
          "Unlimited client logins",
        ],
        cta: "Start Agency",
      },
    ],
  },
  faq: {
    title: "Frequently asked questions",
    items: [
      {
        q: "Do I need to be a standards expert to use CertOS?",
        a: "No. The knowledge layer explains per control what it is, what the auditor expects and what evidence to provide.",
      },
      {
        q: "Does CertOS replace my consultancy?",
        a: "No. CertOS coordinates alongside the consultancy: you manage the process, they provide the expertise.",
      },
      {
        q: "Where is my data stored?",
        a: "In the EU. We use Supabase and Vercel, both with EU data centres. Sub-processors: Supabase, Vercel, Stripe, Anthropic.",
      },
      {
        q: "Can my client view progress?",
        a: "Yes, via the client portal. Available from the Pro plan.",
      },
      {
        q: "Is there a data processing agreement?",
        a: "Yes. The DPA is built into the acceptance flow at first login.",
      },
      {
        q: "Can I cancel?",
        a: "Yes, monthly. On cancellation you revert to Solo at the end of the paid period. Your data is retained.",
      },
    ],
  },
  cta_footer: {
    title: "Ready to get started?",
    sub: "Create a free account and add your first client.",
    button: "Start free with Google",
  },
  footer: {
    tagline: "You coordinate, CertOS knows.",
    privacy: "Privacy policy",
    terms: "Terms of service",
    dpa: "Data processing agreement",
    cookies: "Cookies",
    copyright: "CertOS",
  },
};
