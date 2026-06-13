// ============================================================
// CertOS norm-data — geporteerd uit CertOS_v4.jsx
// ============================================================

export const NORMS = ["VCU", "ISO 9001", "ISO 14001", "ISO 27001", "ISO 45001", "ISAE 3402"] as const;
export type Norm = (typeof NORMS)[number];

export const NORM_INFO: Record<Norm, { titel: string; uitleg: string; letop: string; links: [string, string][] }> = {
  "VCU": {
    titel: "VG-Checklist Uitzendorganisaties",
    uitleg: "Veiligheids- en gezondheidsnorm voor uitzend- en detacheringsbureaus die personeel leveren aan VCA-plichtige inleners (bouw, techniek, industrie). Toont aan dat het bureau veiligheid borgt in werving, plaatsing en begeleiding van uitzendkrachten.",
    letop: "Certificaat 3 jaar geldig met jaarlijkse controle-audit. Tekortkomingen binnen 3 maanden herstellen, anders intrekking. Geldt voor uitzenden (inlener heeft gezag/toezicht), niet voor payrolling.",
    links: [["SSVV (normbeheerder)", "https://www.ssvv.nl"], ["VCA/VCU portaal", "https://www.vca.nl"], ["Centraal Certificatenregister", "https://www.vca.nl"]],
  },
  "ISO 9001": {
    titel: "Kwaliteitsmanagement",
    uitleg: "Internationale norm voor een kwaliteitsmanagementsysteem: processen beheersen, klanteisen waarmaken en continu verbeteren. De meest gevraagde ISO-norm in aanbestedingen.",
    letop: "Certificaat 3 jaar geldig, jaarlijkse opvolgaudit. Audit in twee fasen: fase 1 documentatie, fase 2 implementatie.",
    links: [["ISO.org over 9001", "https://www.iso.org"], ["NEN (Nederlandse uitgave)", "https://www.nen.nl"]],
  },
  "ISO 14001": {
    titel: "Milieumanagement",
    uitleg: "Norm voor het beheersen van milieurisico's en het voldoen aan milieuwetgeving. Draait om milieuaspecten in kaart brengen, verplichtingen kennen en prestaties verbeteren.",
    letop: "Compliance-register (wet- en regelgeving) is een terugkerend struikelpunt bij audits.",
    links: [["ISO.org over 14001", "https://www.iso.org"], ["NEN", "https://www.nen.nl"]],
  },
  "ISO 27001": {
    titel: "Informatiebeveiliging",
    uitleg: "Norm voor een managementsysteem voor informatiebeveiliging (ISMS). Kern: risicoanalyse, Annex A-maatregelen en de Verklaring van Toepasselijkheid (VvT/SoA).",
    letop: "Auditoren toetsen vooral of de risicoanalyse leidend is geweest voor de maatregelkeuze. VvT is verplicht document.",
    links: [["ISO.org over 27001", "https://www.iso.org"], ["NEN", "https://www.nen.nl"], ["NCSC (achtergrond)", "https://www.ncsc.nl"]],
  },
  "ISO 45001": {
    titel: "Gezond en veilig werken",
    uitleg: "Norm voor een arbomanagementsysteem: gevaren identificeren, risico's beheersen en medewerkers betrekken. Opvolger van OHSAS 18001.",
    letop: "Participatie van medewerkers is een expliciete normeis; alleen een papieren systeem zakt op dit punt.",
    links: [["ISO.org over 45001", "https://www.iso.org"], ["NEN", "https://www.nen.nl"], ["Arboportaal", "https://www.arboportaal.nl"]],
  },
  "ISAE 3402": {
    titel: "Assurance over uitbestede processen (Type I/II)",
    uitleg: "Geen certificaat maar een assurance-rapport van een externe accountant over de beheersmaatregelen van een serviceorganisatie (bijv. payroll, SaaS, administratie). Type I toetst opzet en bestaan op één moment; Type II toetst ook de werking over een periode van 6 tot 12 maanden.",
    letop: "Jaarlijks opnieuw: elk rapport dekt één rapportageperiode. De accountant (auditor) moet onafhankelijk zijn; het bureau dat helpt bouwen mag niet zelf het oordeel geven. Klanten van de serviceorganisatie (en hun accountants) zijn de lezers.",
    links: [["ISAE3402.nl (uitleg NL)", "https://www.isae3402.nl"], ["IAASB (normtekst)", "https://www.iaasb.org"], ["NBA (accountants)", "https://www.nba.nl"]],
  },
};

export type ControlTemplate = [string, string, string]; // [code, name, desc]

export const VCU_CONTROLS: ControlTemplate[] = [
  ["VCU-1.1", "VG-beleidsverklaring", "Ondertekend door directie, actueel en gecommuniceerd"],
  ["VCU-1.2", "VG-functionaris benoemd", "Verantwoordelijkheden en bevoegdheden vastgelegd"],
  ["VCU-1.3", "VIL-VCU diploma's intercedenten", "Alle intercedenten/leidinggevenden gediplomeerd, geldigheid bewaakt"],
  ["VCU-2.1", "Aanvraagprocedure met VG-eisen", "Functie-eisen en risico-informatie inlener vastgelegd per aanvraag"],
  ["VCU-2.2", "RI&E-informatie inlener", "Relevante risico's werkplek opgevraagd en gedocumenteerd"],
  ["VCU-3.1", "Selectie op VG-criteria", "Match diploma's/ervaring uitzendkracht met functie-eisen (o.a. VCA)"],
  ["VCU-3.2", "Diplomaregistratie uitzendkrachten", "VCA en overige certificaten geregistreerd met vervaldatum"],
  ["VCU-4.1", "Voorlichting en instructie", "Uitzendkracht aantoonbaar geïnformeerd vóór plaatsing"],
  ["VCU-4.2", "Toolboxmeetings / VG-bewustzijn", "Periodieke VG-communicatie, verslagen aanwezig"],
  ["VCU-5.1", "Periodiek contact uitzendkracht en inlener", "Werkplekcontacten gepland en geregistreerd"],
  ["VCU-6.1", "Melding en registratie incidenten", "Ongevallen/bijna-ongevallen geregistreerd en onderzocht"],
  ["VCU-7.1", "Dossierbeheer", "Volledige, actuele dossiers per uitzendkracht"],
  ["VCU-8.1", "Interne audit", "Jaarlijks uitgevoerd, verslag en verbeterpunten aanwezig"],
  ["VCU-8.2", "Directiebeoordeling", "Systeemevaluatie door directie, vastgelegd met acties"],
];

export const ISO_HLS_CONTROLS: ControlTemplate[] = [
  ["4.1", "Context van de organisatie", "Interne/externe issues en stakeholders bepaald"],
  ["4.3", "Toepassingsgebied (scope)", "Scope van het managementsysteem gedocumenteerd"],
  ["5.1", "Leiderschap en commitment", "Directie aantoonbaar betrokken, beleid vastgesteld"],
  ["5.3", "Rollen en verantwoordelijkheden", "Taken, bevoegdheden en verantwoordelijkheden toegewezen"],
  ["6.1", "Risico's en kansen", "Risicoanalyse uitgevoerd, maatregelen bepaald"],
  ["6.2", "Doelstellingen en planning", "Meetbare doelen met plan van aanpak"],
  ["7.2", "Competentie", "Opleidingen en competenties vastgelegd"],
  ["7.5", "Gedocumenteerde informatie", "Documentbeheer ingericht (versies, goedkeuring)"],
  ["8.1", "Operationele beheersing", "Processen beschreven en beheerst uitgevoerd"],
  ["9.1", "Monitoring en meting", "KPI's bepaald en gemeten"],
  ["9.2", "Interne audit", "Auditprogramma uitgevoerd, verslagen aanwezig"],
  ["9.3", "Directiebeoordeling", "Periodieke beoordeling vastgelegd met besluiten"],
  ["10.2", "Afwijkingen en corrigerende maatregelen", "Registratie en opvolging van afwijkingen"],
  ["10.3", "Continue verbetering", "Verbetercyclus aantoonbaar"],
];

export const ISO_EXTRA: Record<string, ControlTemplate[]> = {
  "ISO 9001": [
    ["8.2", "Klanteisen en communicatie", "Eisen bepaald, beoordeeld en gecommuniceerd"],
    ["8.4", "Beheersing externe leveranciers", "Leveranciersbeoordeling ingericht"],
    ["9.1.2", "Klanttevredenheid", "Meting en opvolging klanttevredenheid"],
  ],
  "ISO 27001": [
    ["A.5", "Organisatorische maatregelen", "Beleid, rollen, leveranciers, incidentmanagement"],
    ["A.6", "Mensgerichte maatregelen", "Screening, bewustzijn, geheimhouding"],
    ["A.7", "Fysieke maatregelen", "Toegang, clear desk, apparatuur"],
    ["A.8", "Technologische maatregelen", "Toegangsbeheer, logging, back-up, kwetsbaarheden"],
    ["SoA", "Verklaring van Toepasselijkheid", "Alle Annex A-maatregelen beoordeeld en verantwoord"],
  ],
  "ISO 14001": [
    ["6.1.2", "Milieuaspectenregister", "Aspecten en effecten geïnventariseerd en gewogen"],
    ["6.1.3", "Compliance-verplichtingen", "Wet- en regelgevingsregister actueel"],
    ["8.2", "Noodsituaties", "Voorbereiding en respons geregeld en geoefend"],
  ],
  "ISO 45001": [
    ["5.4", "Participatie medewerkers", "Raadpleging en deelname geborgd"],
    ["6.1.2", "Gevarenidentificatie / RI&E", "Gevaren en risico's beoordeeld, maatregelen bepaald"],
    ["8.2", "Noodsituaties", "BHV en noodplannen ingericht en geoefend"],
  ],
};

export const ISAE_CONTROLS: ControlTemplate[] = [
  ["3402-1", "Systeembeschrijving", "Beschrijving van dienstverlening, processen en controleomgeving"],
  ["3402-2", "Management assertion", "Directieverklaring dat beschrijving juist is en controls werken"],
  ["3402-3", "Control objectives en raamwerk", "Beheersdoelstellingen met bijbehorende maatregelen per proces"],
  ["3402-4", "Logische toegangsbeveiliging", "Toegangsbeheer: in-/uitdienst, rechten, periodieke review"],
  ["3402-5", "Wijzigingsbeheer", "Changes getest en goedgekeurd vóór productie"],
  ["3402-6", "Operations en continuïteit", "Back-up, monitoring, restore-testen"],
  ["3402-7", "Personeel en functiescheiding", "Screening, geheimhouding, gescheiden taken"],
  ["3402-8", "Subserviceorganisaties", "Uitbestede diensten benoemd en gemonitord (carve-out/inclusive)"],
  ["3402-9", "Incidentbeheer", "Incidenten geregistreerd, opgevolgd en gecommuniceerd"],
  ["3402-10", "Interne controle op werking", "Eigen periodieke toetsing van de controls"],
  ["3402-11", "Bewijs over de rapportageperiode", "Werking aantoonbaar over de hele observatieperiode (Type II)"],
];

export function controlsFor(norm: Norm): ControlTemplate[] {
  if (norm === "VCU") return VCU_CONTROLS;
  if (norm === "ISAE 3402") return ISAE_CONTROLS;
  return [...ISO_HLS_CONTROLS, ...(ISO_EXTRA[norm] ?? [])];
}

export function phasesFor(norm: Norm, kind: string): [string, string[]][] {
  const her = kind === "Hercertificering";
  if (norm === "VCU") {
    return her
      ? [
          ["Review en actualisatie", ["Normwijzigingen toetsen", "Handboek en procedures actualiseren", "VIL-VCU geldigheid controleren"]],
          ["Praktijkbewijs op orde", ["Toolboxverslagen compleet", "Dossiers steekproef intern", "Incidentregistratie bijgewerkt"]],
          ["Interne audit", ["Interne audit uitvoeren", "Verbeterpunten oplossen"]],
          ["Directiebeoordeling", ["Beoordeling uitvoeren en vastleggen"]],
          ["Hercertificeringsaudit", ["Auditdag organiseren", "Bevindingen opvolgen"]],
        ]
      : [
          ["Intake en scoping", ["Kick-off met klant", "Scope en planning vastleggen", "Adviesbureau/CI bevestigen"]],
          ["Nulmeting", ["Gap-analyse t.o.v. VCU-checklist", "Actieplan opstellen"]],
          ["VG-systeem en handboek", ["VG-beleid opstellen", "Procedures uitwerken", "Registratieformulieren inrichten"]],
          ["VIL-VCU diploma's", ["Deelnemers bepalen", "Examens boeken", "Diploma's geregistreerd"]],
          ["Praktijkperiode (min. 3 mnd)", ["Toolboxen draaien", "Werkplekcontacten registreren", "Dossiers vullen", "Incidentenproces actief"]],
          ["Directiebeoordeling", ["Beoordeling uitvoeren en vastleggen"]],
          ["Interne audit", ["Interne audit uitvoeren", "Verbeterpunten oplossen"]],
          ["Externe audit", ["Dossiers klaarzetten", "Auditdag organiseren", "Bevindingen opvolgen"]],
          ["Nazorg en jaarcyclus", ["Jaarkalender opleveren", "Overdracht aan klant"]],
        ];
  }
  if (norm === "ISAE 3402") {
    return her
      ? [
          ["Nieuwe rapportageperiode", ["Periode en scope bevestigen met accountant", "Controleraamwerk actualiseren"]],
          ["Bewijs verzamelen (doorlopend)", ["Bewijsarchief per control bijhouden", "Maandelijkse volledigheidscheck"]],
          ["Interne controle", ["Eigen toetsing werking controls", "Gaten herstellen binnen de periode"]],
          ["Type II audit", ["Interim testwerk accountant", "Eindtestwerk en interviews"]],
          ["Rapport en opvolging", ["Management assertion tekenen", "Rapport delen met klanten", "Verbeterpunten inplannen"]],
        ]
      : [
          ["Scoping en accountantselectie", ["Scope en processen bepalen", "Type I of direct Type II kiezen", "Auditerende accountant contracteren"]],
          ["Systeembeschrijving", ["Dienstverlening en processen beschrijven", "Review door accountant"]],
          ["Controleraamwerk", ["Control objectives definiëren", "Controls per proces uitwerken (wie/wat/frequentie)"]],
          ["Readiness assessment", ["Proeftoets op opzet en bestaan", "Gaten herstellen"]],
          ["Type I (opzet en bestaan)", ["Testwerk accountant", "Type I rapport ontvangen"]],
          ["Observatieperiode (6-12 mnd)", ["Controls uitvoeren en bewijs archiveren", "Maandelijkse volledigheidscheck", "Interne controle op werking"]],
          ["Type II audit (werking)", ["Steekproeven en interviews accountant", "Bevindingen opvolgen"]],
          ["Rapport en jaarcyclus", ["Management assertion tekenen", "Rapport delen met klanten", "Volgende periode inplannen"]],
        ];
  }
  return her
    ? [
        ["Review en actualisatie", ["Normwijzigingen toetsen", "Documentatie actualiseren", "Risicoanalyse herzien"]],
        ["Interne audit", ["Auditprogramma uitvoeren", "Afwijkingen oplossen"]],
        ["Directiebeoordeling", ["Beoordeling uitvoeren en vastleggen"]],
        ["Hercertificeringsaudit", ["Auditdag organiseren", "Bevindingen opvolgen"]],
      ]
    : [
        ["Intake en scoping", ["Kick-off met klant", "Scope managementsysteem bepalen", "CI selecteren/bevestigen"]],
        ["Contextanalyse en risico's", ["Stakeholderanalyse", "Risico's en kansen bepalen", "Doelstellingen vastleggen"]],
        ["Systeem inrichten", ["Processen beschrijven", "Documentbeheer inrichten", "Beheersmaatregelen implementeren"]],
        ["Implementatieperiode", ["Systeem in praktijk draaien", "Registraties en KPI's vullen", "Bewustzijn/training uitvoeren"]],
        ["Interne audit", ["Interne audit uitvoeren", "Afwijkingen oplossen"]],
        ["Directiebeoordeling", ["Beoordeling uitvoeren en vastleggen"]],
        ["Fase 1 audit (documentatie)", ["Documentatiebeoordeling CI", "Bevindingen verwerken"]],
        ["Fase 2 audit (implementatie)", ["Auditdag organiseren", "Bevindingen opvolgen"]],
        ["Nazorg en jaarcyclus", ["Jaarkalender opleveren", "Overdracht aan klant"]],
      ];
}

// Status-labels en kleuren (heilige statusladder)
export const CTRL_STATUS = ["Niet gestart", "In uitvoering", "Geïmplementeerd", "Aantoonbaar"] as const;
export const CTRL_COLOR = ["#9AA3B0", "#C2881D", "#3B7CB8", "#21A865"] as const;
export const DOC_STATUS = ["Gevraagd", "Ontvangen", "Gevalideerd", "Aangeleverd"] as const;
export const DOC_COLOR = ["#B23A2E", "#C2881D", "#3B7CB8", "#21A865"] as const;
export const FIND_STATUS = ["Open", "In behandeling", "Opgelost", "Geverifieerd"] as const;
export const FIND_COLOR = ["#B23A2E", "#C2881D", "#3B7CB8", "#21A865"] as const;
export const RISK_STATUS = ["Open", "Beheerst", "Gesloten"] as const;
export const RISK_COLOR = ["#B23A2E", "#3B7CB8", "#21A865"] as const;
export const HOUR_CATS = [
  "Process Design", "Data & KPI", "Vendor Coordination",
  "Governance & Reporting", "Go-Live & Hypercare", "Admin & Other",
] as const;
export const EXP_TYPES = ["Diploma", "Certificaat", "Controle-audit", "Rapportageperiode", "Overig"] as const;

// Kennislaag per maatregel (GUIDE)
export type GuideEntry = {
  u: string;
  v: string[];
  b: string[];
  q: string;
};

export const GUIDE: Record<string, GuideEntry> = {
  "VCU-1.1": { u: "Eén A4 waarin de directie zwart-op-wit zet dat veilig en gezond werken prioriteit heeft en hoe dat wordt waargemaakt.", v: ["Ondertekend door de hoogste leiding", "Niet ouder dan ca. 3 jaar", "Aantoonbaar gedeeld met medewerkers"], b: ["Getekende beleidsverklaring (PDF)", "Bewijs van communicatie (mail, intranet, personeelsmap)"], q: "Hebben we een door de directie ondertekende VG-beleidsverklaring, hoe oud is die en waar kunnen medewerkers hem vinden?" },
  "VCU-1.2": { u: "Iemand is formeel aangewezen als verantwoordelijke voor veiligheid en gezondheid, met beschreven taken en bevoegdheden.", v: ["Benoeming op papier", "Taken/bevoegdheden beschreven", "Persoon kan vertellen wat de rol inhoudt"], b: ["Benoemingsdocument of functieomschrijving", "Organogram met VG-rol"], q: "Wie is bij ons formeel VG-verantwoordelijke en waar staat dat vastgelegd?" },
  "VCU-1.3": { u: "Iedereen die uitzendkrachten werft, plaatst of aanstuurt moet het VIL-VCU diploma hebben (Veiligheid voor Intercedenten en Leidinggevenden).", v: ["Diploma voor elke intercedent/leidinggevende", "Geldigheid (10 jaar) bewaakt", "Geregistreerd in het Centraal Diploma Register"], b: ["Kopieën diploma's", "Overzicht met namen en vervaldatums"], q: "Welke collega's plaatsen of begeleiden uitzendkrachten, en wie van hen heeft een geldig VIL-VCU diploma?" },
  "VCU-2.1": { u: "Bij elke aanvraag van een inlener worden functie-eisen én veiligheidsrisico's van de werkplek vastgelegd vóórdat iemand wordt voorgesteld.", v: ["Vast formulier of systeemveld per aanvraag", "VG-eisen (diploma's, PBM's, risico's) ingevuld", "Consequent gebruikt, niet alleen bij grote klanten"], b: ["Aanvraagformulier/template", "3-5 ingevulde voorbeelden uit de praktijk"], q: "Hoe leggen we per aanvraag de veiligheidseisen en werkplekrisico's van de inlener vast, en kun je 3 recente voorbeelden laten zien?" },
  "VCU-2.2": { u: "De relevante risico-informatie (RI&E) van de werkplek bij de inlener wordt opgevraagd en bewaard, zodat je weet waar je mensen naartoe stuurt.", v: ["Opvragen is standaard onderdeel van het proces", "Informatie vindbaar per inlener/plaatsing"], b: ["Voorbeelden van ontvangen risico-info per inlener", "Proces-/werkbeschrijving"], q: "Vragen we standaard de werkplekrisico's of RI&E-info op bij inleners, en waar bewaren we die?" },
  "VCU-3.1": { u: "Kandidaten worden gematcht op de veiligheidseisen van de functie: juiste diploma's (vaak VCA), ervaring en geschiktheid.", v: ["Aantoonbare match tussen functie-eisen en kandidaat", "Geen plaatsing zonder vereist diploma"], b: ["Selectiechecklist of systeemvelden", "Dossiers waar de match zichtbaar is"], q: "Hoe borgen we dat een kandidaat pas geplaatst wordt als de vereiste veiligheidsdiploma's binnen zijn?" },
  "VCU-3.2": { u: "Van elke uitzendkracht zijn diploma's en certificaten (VCA e.d.) geregistreerd, inclusief vervaldatum, zodat niemand met verlopen papieren werkt.", v: ["Centrale registratie met vervaldatums", "Signalering vóór verloop"], b: ["Diplomaregister (export uit systeem)", "Voorbeelddossiers met diplomakopieën"], q: "Waar staan de diploma's van uitzendkrachten geregistreerd en hoe zien we wanneer er één verloopt?" },
  "VCU-4.1": { u: "Elke uitzendkracht krijgt vóór de start uitleg over de risico's en regels op de werkplek, en tekent daarvoor.", v: ["Instructie vóór eerste werkdag", "Aantoonbaar: handtekening of digitale bevestiging"], b: ["Instructieformulier/template", "Getekende exemplaren in dossiers"], q: "Hoe en wanneer krijgt een uitzendkracht de veiligheidsinstructie, en waar vind ik de getekende bevestigingen?" },
  "VCU-4.2": { u: "Periodieke korte veiligheidssessies (toolboxmeetings) of -berichten houden het VG-bewustzijn levend; verslagen bewijzen dat het gebeurt.", v: ["Vaste frequentie (bijv. per kwartaal)", "Verslag met datum, onderwerp en deelnemers"], b: ["Toolboxverslagen van de afgelopen periode", "Jaarplanning toolboxonderwerpen"], q: "Wanneer waren de laatste toolboxen, waar staan de verslagen en wie organiseert ze?" },
  "VCU-5.1": { u: "Regelmatig contact met uitzendkracht én inlener over hoe het gaat op de werkplek, vastgelegd zodat signalen niet verdampen.", v: ["Geplande contactmomenten/werkplekbezoeken", "Registratie van datum en bevindingen"], b: ["Registraties werkplekcontacten", "Procesafspraak (frequentie)"], q: "Hoe vaak hebben we contact met uitzendkracht en inlener over veiligheid, en waar leggen we dat vast?" },
  "VCU-6.1": { u: "(Bijna-)ongevallen worden gemeld, geregistreerd en onderzocht, met maatregelen om herhaling te voorkomen.", v: ["Meldprocedure bekend bij iedereen", "Register aanwezig, ook bij nul incidenten", "Onderzoek en opvolging zichtbaar"], b: ["Incidentenregister", "Meldprocedure", "Voorbeeld van onderzoek + maatregel (indien geweest)"], q: "Waar melden we incidenten, staan er meldingen in het register en is er ooit onderzoek gedaan met opvolging?" },
  "VCU-7.1": { u: "Per uitzendkracht een compleet dossier: ID-gegevens, diploma's, instructiebevestiging, plaatsingsgegevens. De auditor doet hier steekproeven.", v: ["Vaste dossieropbouw", "Steekproef levert geen gaten op"], b: ["Dossierchecklist (wat hoort erin)", "5-10 complete voorbeelddossiers klaarzetten"], q: "Wat hoort er volgens ons in een uitzendkrachtdossier en kunnen we 10 willekeurige dossiers laten zien die compleet zijn?" },
  "VCU-8.1": { u: "Jaarlijks toetst iemand (intern of extern, maar onafhankelijk van de uitvoering) of het systeem klopt en gevolgd wordt.", v: ["Auditverslag aanwezig", "Verbeterpunten met opvolging"], b: ["Intern auditverslag", "Actielijst met status verbeterpunten"], q: "Wanneer is de laatste interne audit gedaan, door wie, en wat is er met de punten gebeurd?" },
  "VCU-8.2": { u: "De directie beoordeelt periodiek zelf het VG-systeem: werkt het, wat zijn de cijfers (incidenten, audits) en wat moet beter. Schriftelijk vastgelegd.", v: ["Verslag met datum en deelnemers (directie)", "Input: auditresultaten, incidenten, doelen", "Besluiten en acties benoemd"], b: ["Verslag directiebeoordeling", "Actielijst uit de beoordeling"], q: "Heeft de directie het VG-systeem formeel beoordeeld dit jaar en waar staat het verslag met de acties?" },
  "4.1": { u: "Breng in kaart wat er binnen en buiten de organisatie speelt (markt, wetgeving, personeel) en wie er eisen stelt (klanten, toezichthouders).", v: ["Contextanalyse op papier", "Stakeholders met hun eisen benoemd", "Periodiek herzien"], b: ["Context-/stakeholderanalyse (1-2 A4)", "SWOT mag ook"], q: "Hebben we ergens beschreven welke interne/externe factoren en belanghebbenden onze organisatie raken?" },
  "4.3": { u: "Bepaal en beschrijf precies waarover het managementsysteem gaat: welke activiteiten, locaties en diensten vallen eronder.", v: ["Scope schriftelijk vastgelegd", "Uitsluitingen onderbouwd"], b: ["Scopedocument of paragraaf in handboek"], q: "Welke onderdelen van het bedrijf vallen onder de certificering en waar is dat vastgelegd?" },
  "5.1": { u: "De directie moet zichtbaar achter het systeem staan: beleid vaststellen, middelen geven en erover praten. Auditor interviewt de directie hierop.", v: ["Vastgesteld beleid", "Directie kan het systeem toelichten", "Middelen/tijd aantoonbaar vrijgemaakt"], b: ["Ondertekend beleidsdocument", "Verslag directieoverleg waarin systeem terugkomt"], q: "Kan de directie in eigen woorden vertellen waarom we dit systeem hebben en wat hun rol is?" },
  "5.3": { u: "Voor iedereen is duidelijk wie wat doet en mag binnen het systeem: rollen, taken en bevoegdheden zijn toegewezen.", v: ["Rollen beschreven en gecommuniceerd", "Medewerkers kennen hun rol"], b: ["Organogram", "Taken-/bevoegdhedenmatrix of functieomschrijvingen"], q: "Wie is waarvoor verantwoordelijk binnen het systeem en weten die mensen dat zelf ook?" },
  "6.1": { u: "Inventariseer wat er mis kan gaan (en welke kansen er zijn) en bepaal per risico wat je eraan doet. Dit stuurt de rest van het systeem.", v: ["Risicoanalyse met methode", "Maatregelen gekoppeld aan risico's", "Actueel"], b: ["Risicoregister/-analyse", "Maatregelenoverzicht"], q: "Hebben we een actuele risicoanalyse en kun je aanwijzen welke maatregelen daaruit volgen?" },
  "6.2": { u: "Concrete, meetbare doelen (bijv. klachten -20%) met wie, wat, wanneer en hoe gemeten.", v: ["SMART-doelen vastgelegd", "Voortgang wordt gevolgd"], b: ["Doelstellingenoverzicht met plan", "Voortgangsrapportage"], q: "Welke meetbare doelen hebben we voor dit jaar en waar volgen we de voortgang?" },
  "7.2": { u: "Medewerkers moeten kunnen wat hun rol vraagt: opleidingen, diploma's en ervaring zijn vastgelegd en gaten worden opgevuld.", v: ["Competentie-eisen per rol bekend", "Opleidingsregistratie aanwezig"], b: ["Opleidingsmatrix/-register", "Certificaten van sleutelrollen"], q: "Waar houden we bij wie welke opleiding heeft en wie er nog iets mist?" },
  "7.5": { u: "Documenten zijn beheerst: juiste versie vindbaar, oude versies weg, duidelijk wie mag wijzigen en goedkeuren.", v: ["Versiebeheer zichtbaar", "Goedkeuring geregeld", "Geen verouderde documenten in omloop"], b: ["Documentenregister", "Voorbeeld document met versie/goedkeuring"], q: "Hoe weten medewerkers dat ze met de laatste versie van een procedure werken?" },
  "8.1": { u: "De kernprocessen draaien volgens afspraak: beschreven, uitgevoerd en bijgestuurd. De auditor loopt een proces van begin tot eind door.", v: ["Processen beschreven", "Praktijk komt overeen met beschrijving"], b: ["Procesbeschrijvingen", "Registraties uit de uitvoering"], q: "Kunnen we van ons hoofdproces laten zien dat de praktijk overeenkomt met de beschrijving?" },
  "9.1": { u: "Je meet of het systeem presteert: KPI's bepaald, gemeten en besproken.", v: ["KPI's gedefinieerd", "Metingen beschikbaar en besproken"], b: ["KPI-overzicht/dashboard", "Verslag waarin cijfers besproken zijn"], q: "Welke prestatie-indicatoren meten we en wanneer zijn die voor het laatst besproken?" },
  "9.2": { u: "Periodieke interne audit door iemand die niet zijn eigen werk controleert; verslag en opvolging verplicht.", v: ["Auditplanning en -verslag", "Onafhankelijkheid auditor", "Opvolging afwijkingen"], b: ["Auditprogramma", "Auditverslag(en)", "Actielijst"], q: "Wanneer was de laatste interne audit, wie deed hem en wat is er met de bevindingen gebeurd?" },
  "9.3": { u: "De directie beoordeelt periodiek het hele systeem op basis van vaste input (audits, KPI's, klachten) en neemt besluiten.", v: ["Verslag met verplichte inputonderwerpen", "Besluiten en acties vastgelegd"], b: ["Verslag directiebeoordeling", "Actielijst"], q: "Heeft de directie dit jaar het systeem formeel beoordeeld en waar staat het verslag?" },
  "10.2": { u: "Als iets fout gaat (klacht, afwijking, auditbevinding) wordt het geregistreerd, opgelost én wordt de oorzaak aangepakt.", v: ["Afwijkingenregister", "Oorzaakanalyse zichtbaar", "Maatregelen afgerond"], b: ["Afwijkingen-/klachtenregister", "Voorbeeld met oorzaakanalyse en maatregel"], q: "Waar registreren we afwijkingen en klachten, en kun je er één laten zien die volledig is afgehandeld?" },
  "10.3": { u: "Het systeem wordt aantoonbaar beter: verbeteringen komen uit audits, metingen en ideeën en worden doorgevoerd.", v: ["Verbeteracties traceerbaar", "Cyclus zichtbaar over de tijd"], b: ["Verbeterregister of actielijst over het jaar"], q: "Welke verbeteringen hebben we het afgelopen jaar doorgevoerd en waar komt dat vandaan?" },
  "8.2": { u: "Eisen van klanten worden vastgelegd, beoordeeld (kunnen we dit?) en bevestigd vóór levering; bij ISO 14001/45001 gaat dit artikel over noodsituaties: plannen klaar en geoefend.", v: ["Vast proces voor offertes/orders of noodplan aanwezig", "Beoordeling/oefening aantoonbaar"], b: ["Voorbeeldofferte met beoordeling, of noodplan + oefenverslag"], q: "Hoe beoordelen we of we een klantvraag waar kunnen maken, of (bij milieu/arbo): wanneer is het noodplan voor het laatst geoefend?" },
  "8.4": { u: "Kritische leveranciers en onderaannemers worden geselecteerd en periodiek beoordeeld op prestaties.", v: ["Leverancierslijst met criteria", "Beoordelingen aanwezig"], b: ["Leveranciersbeoordeling (lijst + score)"], q: "Welke leveranciers zijn kritisch voor onze kwaliteit en wanneer zijn ze voor het laatst beoordeeld?" },
  "9.1.2": { u: "Je meet wat klanten van je vinden (survey, reviews, klachten) en doet er iets mee.", v: ["Meting aanwezig", "Opvolging zichtbaar"], b: ["Resultaten klanttevredenheid", "Verbeteracties n.a.v. feedback"], q: "Hoe meten we klanttevredenheid en wat was de laatste uitkomst?" },
  "A.5": { u: "De organisatorische kant van informatiebeveiliging: beleid, rollen, leveranciersafspraken, incidentproces, classificatie van informatie.", v: ["IB-beleid vastgesteld", "Rollen belegd", "Leveranciers met toegang contractueel geborgd"], b: ["IB-beleid", "Verwerkers-/leveranciersovereenkomsten", "Incidentprocedure"], q: "Hebben we een vastgesteld informatiebeveiligingsbeleid en afspraken met leveranciers die bij onze data kunnen?" },
  "A.6": { u: "De menskant: screening bij indiensttreding, geheimhouding, security-bewustzijn en een nette off-boarding.", v: ["Screening/VOG waar passend", "Geheimhouding in contracten", "Awareness aantoonbaar"], b: ["Voorbeeld arbeidscontract (geheimhoudingsclausule)", "Bewijs awareness (training, phishingtest)"], q: "Tekenen medewerkers geheimhouding, en wanneer was de laatste security-awareness actie?" },
  "A.7": { u: "Fysieke beveiliging: wie komt het pand/de serverruimte in, clear desk, veilig afvoeren van apparatuur.", v: ["Toegangsbeheer pand", "Clear desk/screen beleid", "Veilige afvoer datadragers"], b: ["Toegangsbeleid/registratie", "Bewijs afvoer (certificaten vernietiging)"], q: "Wie kan ons pand en de serverruimte in, en wat gebeurt er met oude laptops en schijven?" },
  "A.8": { u: "De technische kant: wachtwoorden/MFA, rechtenbeheer, logging, back-ups, updates en kwetsbaarhedenbeheer.", v: ["MFA op kritieke systemen", "Rechten periodiek beoordeeld", "Back-up getest", "Patchproces"], b: ["Wachtwoord-/toegangsbeleid", "Back-up + restoretest bewijs", "Patch-/updateoverzicht"], q: "Staat MFA overal aan, wanneer is de laatste restore-test gedaan en hoe snel patchen we?" },
  "SoA": { u: "De Verklaring van Toepasselijkheid: per Annex A-maatregel aangeven of hij van toepassing is, waarom (niet) en hoe ingevuld. Hét kerndocument van 27001.", v: ["Alle maatregelen behandeld", "Onderbouwing per uitsluiting", "Consistent met risicoanalyse"], b: ["VvT/SoA-document (spreadsheet)"], q: "Is onze Verklaring van Toepasselijkheid compleet en sluit hij aan op de risicoanalyse?" },
  "6.1.2": { u: "Bij 14001: register van milieuaspecten (afval, emissies, energie) met weging. Bij 45001: gevarenidentificatie/RI&E van het eigen werk.", v: ["Register/RI&E actueel", "Belangrijkste aspecten of risico's gewogen", "Maatregelen gekoppeld"], b: ["Milieuaspectenregister of RI&E + plan van aanpak"], q: "Hebben we een actueel overzicht van onze milieuaspecten/arbo-risico's met bijbehorende maatregelen?" },
  "6.1.3": { u: "Overzicht van alle milieuwet- en regelgeving die op het bedrijf van toepassing is, en hoe daaraan voldaan wordt.", v: ["Complianceregister aanwezig en actueel", "Periodieke check op wijzigingen"], b: ["Wet- en regelgevingsregister", "Vergunningen"], q: "Welke milieuwetgeving en vergunningen gelden voor ons en wie houdt wijzigingen bij?" },
  "5.4": { u: "Medewerkers denken aantoonbaar mee over veiligheid: overleg, meldingen, betrokkenheid bij de RI&E.", v: ["Overlegstructuur met arbo op agenda", "Meldingen van de werkvloer zichtbaar"], b: ["Verslagen werkoverleg/personeelsvertegenwoordiging", "Meldingenregister"], q: "Hoe kunnen medewerkers veiligheidszaken aankaarten en gebeurt dat ook echt?" },
  "3402-1": { u: "Het kerndocument: een beschrijving van de dienstverlening, processen, systemen en beheersomgeving van de organisatie, geschreven voor de klanten en hun accountants.", v: ["Volledig en juist beeld van de dienst", "Processen, systemen en controls beschreven", "Periode en scope helder"], b: ["Systeembeschrijving (hoofdstuk 3 van het rapport)", "Procesflows"], q: "Hebben we een actuele beschrijving van onze dienstverlening en processen zoals klanten die afnemen?" },
  "3402-2": { u: "De directie verklaart schriftelijk dat de systeembeschrijving klopt en dat de controls in opzet (en bij Type II: werking) effectief zijn.", v: ["Ondertekende assertion bij het rapport", "Directie begrijpt waarvoor getekend wordt"], b: ["Management assertion (template komt van de accountant)"], q: "Weet de directie dat zij formeel tekent voor de juistheid van beschrijving en controls?" },
  "3402-3": { u: "Per proces zijn beheersdoelstellingen (control objectives) gedefinieerd met daaronder de concrete maatregelen die de accountant gaat testen.", v: ["Objectives dekken de risico's voor klanten", "Elke control is testbaar geformuleerd (wie, wat, frequentie)"], b: ["Controleraamwerk (objectives + controls matrix)"], q: "Hebben we per proces vastgelegd welke controles we uitvoeren, door wie en hoe vaak?" },
  "3402-4": { u: "Alleen de juiste mensen kunnen bij systemen en data: rechten bij indiensttreding, intrekken bij vertrek, periodieke controle van wie wat kan.", v: ["Aantoonbaar proces in-/uit-dienst", "Periodieke rechtenreview met vastlegging", "MFA/wachtwoordbeleid"], b: ["Autorisatiematrix", "Bewijs rechtenreviews", "Voorbeelden on-/offboarding tickets"], q: "Hoe regelen we toegangsrechten bij in- en uitdienst, en wanneer is voor het laatst gecontroleerd wie waar bij kan?" },
  "3402-5": { u: "Wijzigingen aan systemen worden getest en goedgekeurd vóór ze live gaan, met functiescheiding tussen bouwen en uitrollen.", v: ["Changeproces beschreven en gevolgd", "Bewijs van test + goedkeuring per change"], b: ["Changeprocedure", "Steekproef changes met goedkeuring (tickets)"], q: "Hoe gaan wijzigingen aan onze systemen naar productie en wie keurt dat goed?" },
  "3402-6": { u: "De dienst blijft draaien: back-ups worden gemaakt én getest, systemen gemonitord, verstoringen opgepakt.", v: ["Back-upschema en bewijs van uitvoering", "Minimaal jaarlijkse restore-test", "Monitoring met opvolging van alerts"], b: ["Back-uplogs", "Restore-testverslag", "Monitoringoverzicht"], q: "Draaien onze back-ups aantoonbaar en wanneer hebben we voor het laatst een restore getest?" },
  "3402-7": { u: "Betrouwbaar personeel en gescheiden taken: screening bij aanname, geheimhouding, en niemand die kritieke stappen alleen kan afronden.", v: ["Screening/VOG bij relevante functies", "Functiescheiding in kritieke processen (bijv. invoer vs. goedkeuring betaling)"], b: ["HR-procedure aanname", "Voorbeeld VOG/screening", "Beschrijving functiescheiding"], q: "Screenen we nieuwe medewerkers en zijn invoer en goedkeuring in kritieke processen gescheiden?" },
  "3402-8": { u: "Diensten die je zelf weer uitbesteedt (hosting, datacenter) worden benoemd in het rapport (carve-out of inclusive) en gemonitord, bijv. via hún ISAE/SOC-rapport.", v: ["Subservicepartijen benoemd", "Hun assurance-rapporten opgevraagd en beoordeeld"], b: ["Lijst subserviceorganisaties", "Hun ISAE 3402/SOC-rapporten + jouw beoordeling"], q: "Welke partijen draaien onderdelen van onze dienst en hebben we hun assurance-rapporten beoordeeld?" },
  "3402-9": { u: "Verstoringen en incidenten worden geregistreerd, opgelost en waar nodig aan klanten gemeld.", v: ["Incidentregister met opvolging", "Communicatielijn naar klanten bij impact"], b: ["Incidentprocedure", "Register met afgehandelde voorbeelden"], q: "Waar registreren we incidenten en wanneer informeren we klanten?" },
  "3402-10": { u: "Je toetst zelf periodiek of de controls worden uitgevoerd (interne controle), zodat de accountant geen verrassingen vindt.", v: ["Eigen testplan of controlekalender", "Vastlegging van uitgevoerde checks"], b: ["Interne controlekalender", "Testresultaten/checklists"], q: "Controleren we zelf periodiek of onze beheersmaatregelen worden uitgevoerd, en waar staat dat?" },
  "3402-11": { u: "Voor Type II moet elke control over de hele rapportageperiode (6-12 mnd) bewijs hebben: de accountant trekt steekproeven uit de hele periode.", v: ["Bewijs per control over de hele periode, niet alleen recent", "Geen gaten in maanden"], b: ["Bewijsarchief per control per maand/kwartaal"], q: "Kunnen we voor elke control bewijs laten zien uit élke maand van de rapportageperiode?" },
};
