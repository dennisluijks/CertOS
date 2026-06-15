import { useState, useEffect, useRef } from "react";

/* ============================================================
   CertOS v3 — certificeringsbeheer voor de coördinerend consultant
   v3: kennislaag per beheersmaatregel (uitleg, verwachting, bewijs,
   intern uit te zetten vraag), normbronnen, AI-coach per maatregel,
   bewijs → documentenregister, en ISAE 3402 (Type I/II) als norm.
   ============================================================ */

const STORAGE_KEY = "certos-v1";
const uid = () => Math.random().toString(36).slice(2, 10);
const today = () => new Date().toISOString().slice(0, 10);

/* ============================================================
   NORMEN, TEMPLATES EN KENNISLAAG
   ============================================================ */

const NORMS = ["VCU", "ISO 9001", "ISO 14001", "ISO 27001", "ISO 45001", "ISAE 3402"];

const NORM_INFO = {
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

const VCU_CONTROLS = [
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

const ISO_HLS_CONTROLS = [
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

const ISO_EXTRA = {
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

const ISAE_CONTROLS = [
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

/* ---------- Kennislaag per maatregel ----------
   u = wat houdt het in, v = wat verwacht de auditor,
   b = wat lever je aan (bewijs), q = zo vraag je het intern uit */

const GUIDE = {
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

function phasesFor(norm, kind) {
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

function controlsFor(norm) {
  const base = norm === "VCU" ? VCU_CONTROLS
    : norm === "ISAE 3402" ? ISAE_CONTROLS
    : [...ISO_HLS_CONTROLS, ...(ISO_EXTRA[norm] || [])];
  return base.map(([code, name, desc]) => ({ id: uid(), code, name, desc, status: 0, owner: "", note: "" }));
}

const CTRL_STATUS = ["Niet gestart", "In uitvoering", "Geïmplementeerd", "Aantoonbaar"];
const CTRL_COLOR = ["#9AA3B0", "#C2881D", "#3B7CB8", "#21A865"];
const DOC_STATUS = ["Gevraagd", "Ontvangen", "Gevalideerd", "Aangeleverd"];
const DOC_COLOR = ["#B23A2E", "#C2881D", "#3B7CB8", "#21A865"];
const FIND_STATUS = ["Open", "In behandeling", "Opgelost", "Geverifieerd"];
const FIND_COLOR = ["#B23A2E", "#C2881D", "#3B7CB8", "#21A865"];
const RISK_STATUS = ["Open", "Beheerst", "Gesloten"];
const RISK_COLOR = ["#B23A2E", "#3B7CB8", "#21A865"];
const HOUR_CATS = ["Process Design", "Data & KPI", "Vendor Coordination", "Governance & Reporting", "Go-Live & Hypercare", "Admin & Other"];
const EXP_TYPES = ["Diploma", "Certificaat", "Controle-audit", "Rapportageperiode", "Overig"];

/* ============================================================
   OPSLAG, HELPERS, AI  (gelijk aan v2)
   ============================================================ */

function migrate(s) {
  if (!s) return { version: 3, tenants: [], projects: [] };
  s.version = 3;
  s.tenants = s.tenants || [];
  s.projects = (s.projects || []).map(p => ({
    docs: [], findings: [], risks: [], log: [], hours: [], expiries: [],
    budget: { min: 0, max: 0 },
    ...p,
    phases: (p.phases || []).map(f => ({ start: "", end: "", ...f, tasks: (f.tasks || []).map(t => ({ owner: "", due: "", ...t })) })),
  }));
  return s;
}
async function loadState() {
  try { const r = await window.storage.get(STORAGE_KEY); return migrate(r ? JSON.parse(r.value) : null); }
  catch { return migrate(null); }
}
async function saveState(s) { try { await window.storage.set(STORAGE_KEY, JSON.stringify(s)); } catch (e) { console.error(e); } }

function projProgress(p) {
  const tasks = p.phases.flatMap(f => f.tasks);
  const t = tasks.length ? tasks.filter(x => x.done).length / tasks.length : 0;
  const c = p.controls.length ? p.controls.filter(x => x.status === 3).length / p.controls.length : 0;
  return Math.round(((t + c) / 2) * 100);
}
function daysTo(d) { if (!d) return null; return Math.ceil((new Date(d) - new Date(today())) / 86400000); }
const fmt = d => d ? new Date(d).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" }) : "—";
const sumHours = p => (p.hours || []).reduce((s, h) => s + (parseFloat(h.hours) || 0), 0);
function copyText(t) { if (navigator.clipboard) navigator.clipboard.writeText(t).catch(() => {}); }

function chaseItems(state) {
  const items = [];
  for (const p of state.projects) {
    const t = state.tenants.find(x => x.id === p.tenantId);
    const tn = t ? t.name : "?";
    for (const f of p.phases) for (const task of f.tasks)
      if (!task.done && (task.owner || task.due)) items.push({ kind: "Taak", what: task.name, owner: task.owner || "—", due: task.due, proj: p, tn });
    for (const d of (p.docs || [])) if (d.status < 3) items.push({ kind: "Document", what: d.name + " (" + DOC_STATUS[d.status] + ")", owner: d.owner || "—", due: d.due, proj: p, tn });
    for (const fi of (p.findings || [])) if (fi.status < 2) items.push({ kind: "Bevinding", what: fi.desc, owner: fi.owner || "—", due: fi.due, proj: p, tn });
  }
  return items.sort((a, b) => (a.due || "9999") < (b.due || "9999") ? -1 : 1);
}
function expiringItems(state, horizon = 90) {
  const out = [];
  for (const p of state.projects) {
    const t = state.tenants.find(x => x.id === p.tenantId);
    for (const e of (p.expiries || [])) {
      const d = daysTo(e.date);
      if (d !== null && d <= horizon) out.push({ ...e, days: d, tn: t ? t.name : "?", proj: p });
    }
  }
  return out.sort((a, b) => a.days - b.days);
}

async function askClaude(prompt, maxTokens = 1000) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: maxTokens, messages: [{ role: "user", content: prompt }] }),
  });
  const data = await r.json();
  return (data.content || []).filter(b => b.type === "text").map(b => b.text).join("\n");
}
function parseJsonLoose(txt) { return JSON.parse(txt.replace(/```json|```/g, "").trim()); }

function projectSummaryForAI(p, tenant) {
  const tasks = p.phases.flatMap(f => f.tasks);
  return {
    klant: tenant ? tenant.name : "?", norm: p.norm, type: p.kind,
    auditdatum: p.auditDate || null, dagen_tot_audit: daysTo(p.auditDate), voortgang_pct: projProgress(p),
    fasen: p.phases.map(f => ({ fase: f.name, gereed: f.tasks.filter(t => t.done).length + "/" + f.tasks.length, open_taken: f.tasks.filter(t => !t.done).map(t => t.name) })),
    beheersmaatregelen: { totaal: p.controls.length, aantoonbaar: p.controls.filter(c => c.status === 3).length, niet_gestart: p.controls.filter(c => c.status === 0).map(c => c.code + " " + c.name) },
    documenten_open: (p.docs || []).filter(d => d.status < 3).map(d => d.name),
    bevindingen_open: (p.findings || []).filter(f => f.status < 2).map(f => f.desc),
    risicos_open: (p.risks || []).filter(r => r.status === 0).map(r => r.desc),
    uren: { besteed: sumHours(p), budget_max: p.budget?.max || null },
  };
}

/* ============================================================ CSS */

const css = `
@import url('https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
:root{--navy:#16294F;--ink:#0F1B33;--ink2:#56688A;--bone:#F5F6F2;--card:#FFFFFF;--line:#DCDFE6;--seal:#21A865;--seal2:#E2F4EA;--navytint:#E8EDF6;--amber:#C2881D;--red:#B23A2E;--blue:#3B7CB8;--grey:#9AA3B0}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--bone)}
.app{font-family:'Archivo',sans-serif;color:var(--ink);background:var(--bone);min-height:100vh;display:flex}
.mono{font-family:'IBM Plex Mono',monospace}
.rail{width:216px;min-width:216px;background:var(--navy);color:#EAF0FA;padding:20px 0;display:flex;flex-direction:column}
.logo{padding:0 20px 18px;border-bottom:1px solid #24407A;display:flex;gap:10px;align-items:center}
.logo b{font-size:18px;font-weight:800;letter-spacing:-.02em}
.logo span{display:block;font-size:9.5px;letter-spacing:.14em;color:#7E93C4;margin-top:2px;font-family:'IBM Plex Mono',monospace}
.nav{padding:14px 10px;display:flex;flex-direction:column;gap:2px}
.nav button{all:unset;cursor:pointer;padding:9px 12px;border-radius:6px;font-size:13.5px;font-weight:500;color:#AFC0DE;display:flex;gap:10px;align-items:center}
.nav button.on{background:#22386B;color:#fff;font-weight:600}
.nav button:hover{color:#fff}
.main{flex:1;padding:26px 30px;max-width:1140px}
.h1{font-size:22px;font-weight:800;letter-spacing:-.02em;color:var(--navy)}
.sub{color:var(--ink2);font-size:13px;margin-top:3px}
.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:20px 0}
.kpi{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:14px 16px}
.kpi .v{font-size:26px;font-weight:800;letter-spacing:-.02em}
.kpi .l{font-size:11px;color:var(--ink2);text-transform:uppercase;letter-spacing:.08em;margin-top:2px;font-family:'IBM Plex Mono',monospace}
.card{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:16px;margin-bottom:12px}
.row{display:flex;align-items:center;gap:12px}
.btn{all:unset;cursor:pointer;background:var(--seal);color:#fff;font-weight:600;font-size:13px;padding:9px 16px;border-radius:7px;text-align:center}
.btn.ghost{background:transparent;color:var(--ink);border:1px solid var(--line)}
.btn.sm{padding:6px 11px;font-size:12px}
.btn.danger{background:transparent;color:var(--red);border:1px solid var(--line)}
.btn.dis{opacity:.45;cursor:default}
input,select,textarea{font-family:'Archivo',sans-serif;font-size:13.5px;padding:9px 11px;border:1px solid var(--line);border-radius:7px;background:#fff;color:var(--ink);width:100%}
input:focus,select:focus,textarea:focus{outline:2px solid var(--seal);outline-offset:-1px}
label{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.07em;color:var(--ink2);display:block;margin-bottom:5px;font-family:'IBM Plex Mono',monospace}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}
.stamp{font-family:'IBM Plex Mono',monospace;font-size:10.5px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;padding:3px 9px;border-radius:4px;border:1.5px solid currentColor;display:inline-block;cursor:pointer;user-select:none;background:#fff;white-space:nowrap}
.bar{height:7px;background:#E7E8E0;border-radius:4px;overflow:hidden;flex:1}
.bar i{display:block;height:100%;background:var(--seal);border-radius:4px;transition:width .3s}
.bar i.warn{background:var(--amber)}.bar i.over{background:var(--red)}
.projcard{cursor:pointer}.projcard:hover{border-color:var(--seal)}
.tag{font-family:'IBM Plex Mono',monospace;font-size:10.5px;font-weight:600;padding:3px 8px;border-radius:4px;background:var(--seal2);color:#157A49;letter-spacing:.05em;white-space:nowrap}
.tag.her{background:#EFE7D6;color:var(--amber)}
.due{font-family:'IBM Plex Mono',monospace;font-size:11.5px;font-weight:600}
.phase{border:1px solid var(--line);border-radius:9px;margin-bottom:10px;background:#fff;overflow:hidden}
.phase>header{padding:11px 14px;display:flex;align-items:center;gap:10px;cursor:pointer;background:#FAFAF6}
.phase>header b{font-size:14px;flex:1;color:var(--navy)}
.task{display:flex;align-items:center;gap:8px;padding:8px 14px;border-top:1px solid #EFF0E9;font-size:13.5px;flex-wrap:wrap}
.task input[type=checkbox]{width:16px;height:16px;accent-color:var(--seal);cursor:pointer}
.task.done .tname{color:#9AA59F;text-decoration:line-through}
.task .tname{flex:1;min-width:140px}
.mini{font-size:12px;padding:4px 7px;width:auto}
.mini.owner{width:110px}.mini.date{width:128px}
.ctrl{padding:11px 14px;border-top:1px solid #EFF0E9}
.ctrl:first-child{border-top:none}
.ctrl-head{display:grid;grid-template-columns:74px 1fr 130px;gap:12px;align-items:start}
.ctrl .code{font-family:'IBM Plex Mono',monospace;font-size:11.5px;font-weight:600;color:var(--ink2);padding-top:2px}
.ctrl b{font-size:13.5px;display:block}
.ctrl small{color:var(--ink2);font-size:12px;line-height:1.45}
.guide{margin-top:10px;margin-left:86px;background:#FAFAF6;border:1px solid #E8E9E0;border-radius:8px;padding:12px 14px;font-size:12.5px;line-height:1.55}
.guide h5{font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--seal);margin:10px 0 4px}
.guide h5:first-child{margin-top:0}
.guide ul{margin:0 0 0 16px}
.guide .ask{background:#fff;border-left:3px solid var(--seal);padding:7px 10px;border-radius:0 6px 6px 0;font-style:italic;color:var(--ink2)}
.linkchip{font-family:'IBM Plex Mono',monospace;font-size:11px;font-weight:600;color:var(--blue);border:1px solid var(--line);border-radius:5px;padding:4px 9px;text-decoration:none;background:#fff;white-space:nowrap}
.linkchip:hover{border-color:var(--blue)}
.tabs{display:flex;gap:2px;border-bottom:2px solid var(--line);margin:18px 0 14px;overflow-x:auto}
.tabs button{all:unset;cursor:pointer;padding:8px 12px;font-size:13px;font-weight:600;color:var(--ink2);border-bottom:2.5px solid transparent;margin-bottom:-2px;white-space:nowrap}
.tabs button.on{color:var(--navy);border-color:var(--seal)}
.empty{padding:30px;text-align:center;color:var(--ink2);font-size:13.5px;border:1.5px dashed var(--line);border-radius:10px}
.crumb{all:unset;cursor:pointer;font-size:12.5px;color:var(--seal);font-weight:600;font-family:'IBM Plex Mono',monospace}
.note-in{font-size:12.5px;padding:6px 9px;margin-top:6px}
.list-row{display:flex;gap:10px;align-items:flex-start;padding:11px 14px;border-top:1px solid #EFF0E9;flex-wrap:wrap}
.list-row:first-child{border-top:none}
.modal-bg{position:fixed;inset:0;background:rgba(20,30,34,.45);display:flex;align-items:center;justify-content:center;z-index:50;padding:20px}
.modal{background:#fff;border-radius:12px;max-width:680px;width:100%;max-height:86vh;overflow:auto;padding:22px}
.pre{font-family:'IBM Plex Mono',monospace;font-size:12px;white-space:pre-wrap;background:#FAFAF6;border:1px solid var(--line);border-radius:8px;padding:14px;line-height:1.55}
.alertline{display:flex;gap:10px;align-items:center;padding:9px 14px;border-top:1px solid #EFF0E9;font-size:13px}
.alertline:first-child{border-top:none}
.spin{display:inline-block;width:14px;height:14px;border:2px solid #fff;border-top-color:transparent;border-radius:50%;animation:sp 1s linear infinite;vertical-align:-2px}
@keyframes sp{to{transform:rotate(360deg)}}
.gantt-row{display:flex;gap:14px;align-items:flex-start;padding:9px 0;border-bottom:1px solid #EFF0E9}
.gantt-row:last-of-type{border-bottom:none}
.gantt-label{width:250px;min-width:250px;font-size:12.5px}
.gantt-label b{font-size:12.5px}
.gantt-lane{flex:1;position:relative;height:42px;background:repeating-linear-gradient(90deg,#FAFAF6 0,#FAFAF6 calc(10% - 1px),#ECEDE5 calc(10% - 1px),#ECEDE5 10%);border-radius:6px;overflow:hidden}
.gantt-bar{position:absolute;top:9px;height:24px;border-radius:5px;min-width:8px;overflow:hidden}
.gantt-bar i{display:block;height:100%;background:rgba(255,255,255,.3)}
.gantt-today{position:absolute;top:0;bottom:0;width:2px;background:var(--ink);z-index:2}
.gantt-audit{position:absolute;top:0;bottom:0;width:0;border-left:2px dashed var(--amber);z-index:2}
.auditwrap{max-width:900px}
@media(max-width:760px){.gantt-label{width:160px;min-width:160px}}
@media(max-width:760px){.app{flex-direction:column}.rail{width:100%;flex-direction:row;align-items:center;padding:10px}.nav{flex-direction:row;padding:0 10px;overflow-x:auto}.logo{border:none;padding:0 10px}.kpis{grid-template-columns:repeat(2,1fr)}.main{padding:16px}.grid2,.grid3{grid-template-columns:1fr}.ctrl-head{grid-template-columns:1fr}.guide{margin-left:0}}
`;

/* ============================================================ APP */

export default function CertOS() {
  const [state, setState] = useState(null);
  const [view, setView] = useState("dash");
  const [openProj, setOpenProj] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const saveT = useRef(null);

  useEffect(() => { loadState().then(s => { setState(s); setLoaded(true); }); }, []);
  useEffect(() => {
    if (!loaded || !state) return;
    clearTimeout(saveT.current);
    saveT.current = setTimeout(() => saveState(state), 500);
  }, [state, loaded]);

  if (!state) return <div style={{ fontFamily: "Archivo,sans-serif", padding: 60, color: "#45565C" }}>Dossiers laden…</div>;

  const up = fn => setState(s => fn(structuredClone(s)));
  const proj = state.projects.find(p => p.id === openProj) || null;
  const tenantOf = p => state.tenants.find(t => t.id === p.tenantId);
  const go = v => { setView(v); setOpenProj(null); };

  return (
    <div className="app">
      <style>{css}</style>
      <aside className="rail">
        <div className="logo">
          <svg width="30" height="35" viewBox="0 0 100 116" fill="none" aria-hidden="true">
            <path d="M50 5 L89 27 V61 L50 83 L11 61 V27 Z" stroke="#FFFFFF" strokeWidth="9" fill="none" strokeLinejoin="round"/>
            <path d="M31 42 L46 57 L73 29" stroke="#21A865" strokeWidth="12" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M15 80 L50 98 L85 80" stroke="#21A865" strokeWidth="8" fill="none" strokeLinecap="round"/>
            <path d="M15 94 L50 112 L85 94" stroke="#FFFFFF" strokeWidth="8" fill="none" strokeLinecap="round"/>
          </svg>
          <div><b>Cert<span style={{ display: "inline", color: "#21A865", fontSize: 18, fontWeight: 800, letterSpacing: "-.02em", fontFamily: "'Archivo',sans-serif" }}>OS</span></b><span>CERTIFICERINGSBEHEER</span></div>
        </div>
        <nav className="nav">
          <button className={view === "dash" ? "on" : ""} onClick={() => go("dash")}>◫ Dashboard</button>
          <button className={view === "chase" ? "on" : ""} onClick={() => go("chase")}>◷ Actiecentrum</button>
          <button className={view === "week" ? "on" : ""} onClick={() => go("week")}>▤ Mijn week</button>
          <button className={view === "tenants" ? "on" : ""} onClick={() => go("tenants")}>▣ Klanten</button>
          <button className={view === "norms" ? "on" : ""} onClick={() => go("norms")}>✎ Normwijzer</button>
          <button className={view === "new" ? "on" : ""} onClick={() => go("new")}>＋ Nieuw traject</button>
          <button className={view === "backup" ? "on" : ""} onClick={() => go("backup")}>⛁ Back-up</button>
        </nav>
      </aside>
      <main className="main">
        {view === "dash" && <Dashboard state={state} open={id => { setOpenProj(id); setView("project"); }} tenantOf={tenantOf} goNew={() => go("new")} goChase={() => go("chase")} />}
        {view === "chase" && <Chase state={state} open={id => { setOpenProj(id); setView("project"); }} />}
        {view === "week" && <WeekView state={state} open={id => { setOpenProj(id); setView("project"); }} />}
        {view === "tenants" && <Tenants state={state} up={up} />}
        {view === "norms" && <NormGuide />}
        {view === "new" && <NewProject state={state} up={up} done={id => { setOpenProj(id); setView("project"); }} goTenants={() => go("tenants")} />}
        {view === "backup" && <Backup state={state} setState={setState} />}
        {view === "project" && proj && <Project p={proj} tenant={tenantOf(proj)} up={up} back={() => go("dash")} />}
      </main>
    </div>
  );
}

/* ============================================================ NORMWIJZER */

function NormGuide() {
  const [norm, setNorm] = useState("VCU");
  const info = NORM_INFO[norm];
  const controls = norm === "VCU" ? VCU_CONTROLS : norm === "ISAE 3402" ? ISAE_CONTROLS : [...ISO_HLS_CONTROLS, ...(ISO_EXTRA[norm] || [])];
  return (
    <>
      <div className="h1">Normwijzer</div>
      <div className="sub">Spiekbrief per norm: wat is het, waar let de auditor op en wat moet er per maatregel liggen</div>
      <div className="tabs">
        {NORMS.map(n => <button key={n} className={norm === n ? "on" : ""} onClick={() => setNorm(n)}>{n}</button>)}
      </div>
      <div className="card">
        <b style={{ fontSize: 15 }}>{norm} · {info.titel}</b>
        <div style={{ fontSize: 13.5, marginTop: 8, lineHeight: 1.55 }}>{info.uitleg}</div>
        <div style={{ fontSize: 13, marginTop: 8, lineHeight: 1.5, color: "var(--amber)" }}><b>Let op:</b> {info.letop}</div>
        <div className="row" style={{ marginTop: 12, flexWrap: "wrap", gap: 8 }}>
          {info.links.map(([t, u]) => <a key={u + t} className="linkchip" href={u} target="_blank" rel="noreferrer">↗ {t}</a>)}
        </div>
      </div>
      <div className="card" style={{ padding: 0 }}>
        {controls.map(([code, name, desc]) => <GuideRow key={code} code={code} name={name} desc={desc} norm={norm} />)}
      </div>
    </>
  );
}

function GuideRow({ code, name, desc, norm }) {
  const [open, setOpen] = useState(false);
  const g = GUIDE[code];
  return (
    <div className="ctrl">
      <div className="ctrl-head" style={{ cursor: "pointer" }} onClick={() => setOpen(!open)}>
        <span className="code">{code}</span>
        <div><b>{name}</b><small>{desc}</small></div>
        <div style={{ textAlign: "right" }}><span className="crumb">{open ? "uitleg ▾" : "uitleg ▸"}</span></div>
      </div>
      {open && g && <GuidePanel g={g} code={code} name={name} norm={norm} />}
    </div>
  );
}

function GuidePanel({ g, code, name, norm, onAddDocs }) {
  const [ai, setAi] = useState(null);
  const [busy, setBusy] = useState(false);
  async function deepen() {
    setBusy(true);
    try {
      const out = await askClaude(
`Je coacht een coördinerend consultant zonder voorkennis van ${norm}. Leg maatregel "${code} ${name}" verder uit in het Nederlands, zonder em dashes, max 160 woorden: (1) hoe ziet dit er in de praktijk uit bij een mkb-bedrijf, (2) de 2 meest gemaakte fouten die auditoren afstraffen, (3) één slimme vraag die de consultant aan de klant kan stellen om kundig over te komen.`, 600);
      setAi(out);
    } catch { setAi("AI-uitleg niet beschikbaar; probeer later opnieuw."); }
    setBusy(false);
  }
  return (
    <div className="guide">
      <h5>Wat houdt dit in</h5>
      <div>{g.u}</div>
      <h5>Wat verwacht de auditor</h5>
      <ul>{g.v.map((x, i) => <li key={i}>{x}</li>)}</ul>
      <h5>Wat lever je aan</h5>
      <ul>{g.b.map((x, i) => <li key={i}>{x}</li>)}</ul>
      <h5>Zo vraag je het intern uit</h5>
      <div className="ask">"{g.q}"</div>
      <div className="row" style={{ marginTop: 10, flexWrap: "wrap", gap: 8 }}>
        {onAddDocs && <button className="btn sm ghost" onClick={() => onAddDocs(g.b)}>⊕ Bewijs naar documentenlijst</button>}
        <button className={"btn sm ghost" + (busy ? " dis" : "")} onClick={() => !busy && deepen()}>{busy ? "…" : "✦ Verdieping (AI)"}</button>
      </div>
      {ai && <div className="pre" style={{ marginTop: 10 }}>{ai}</div>}
    </div>
  );
}

/* ============================================================ DASHBOARD / CHASE / KLANTEN / NIEUW / BACKUP */

function Dashboard({ state, open, tenantOf, goNew, goChase }) {
  const projects = [...state.projects].sort((a, b) => (a.auditDate || "9") < (b.auditDate || "9") ? -1 : 1);
  const soon = projects.filter(p => { const d = daysTo(p.auditDate); return d !== null && d >= 0 && d <= 30; }).length;
  const chase = chaseItems(state);
  const overdue = chase.filter(i => i.due && daysTo(i.due) < 0).length;
  const exp = expiringItems(state, 90);
  return (
    <>
      <div className="h1">Dashboard</div>
      <div className="sub">Alle certificeringstrajecten in één overzicht</div>
      <div className="kpis">
        <div className="kpi"><div className="v">{projects.length}</div><div className="l">Trajecten</div></div>
        <div className="kpi"><div className="v" style={{ color: soon ? "var(--amber)" : undefined }}>{soon}</div><div className="l">Audit &lt; 30 dgn</div></div>
        <div className="kpi"><div className="v" style={{ color: overdue ? "var(--red)" : undefined }}>{overdue}</div><div className="l">Acties over tijd</div></div>
        <div className="kpi"><div className="v" style={{ color: exp.length ? "var(--amber)" : undefined }}>{exp.length}</div><div className="l">Verloopt &lt; 90 dgn</div></div>
      </div>
      {(overdue > 0 || exp.length > 0) && (
        <div className="card" style={{ padding: 0, borderColor: "var(--amber)" }}>
          <div style={{ padding: "10px 14px", borderBottom: "1px solid #EFF0E9" }}>
            <b style={{ fontSize: 13.5 }}>Aandacht nodig</b> <button className="crumb" onClick={goChase} style={{ marginLeft: 8 }}>naar actiecentrum →</button>
          </div>
          {chase.filter(i => i.due && daysTo(i.due) < 0).slice(0, 4).map((i, k) => (
            <div key={k} className="alertline">
              <span className="due" style={{ color: "var(--red)" }}>{-daysTo(i.due)}d te laat</span>
              <span style={{ flex: 1 }}>{i.kind}: {i.what}</span>
              <span className="mono" style={{ fontSize: 11, color: "var(--ink2)" }}>{i.owner} · {i.tn}</span>
            </div>
          ))}
          {exp.slice(0, 4).map((e, k) => (
            <div key={"e" + k} className="alertline">
              <span className="due" style={{ color: e.days < 30 ? "var(--red)" : "var(--amber)" }}>{e.days < 0 ? "verlopen" : e.days + "d"}</span>
              <span style={{ flex: 1 }}>{e.type}: {e.name}{e.holder ? " (" + e.holder + ")" : ""}</span>
              <span className="mono" style={{ fontSize: 11, color: "var(--ink2)" }}>{e.tn}</span>
            </div>
          ))}
        </div>
      )}
      {projects.length === 0 && <div className="empty">Nog geen trajecten. <button className="crumb" onClick={goNew}>Start een eerste traject →</button></div>}
      {projects.map(p => {
        const d = daysTo(p.auditDate);
        const t = tenantOf(p);
        const pr = projProgress(p);
        const spent = sumHours(p), max = p.budget?.max || 0;
        return (
          <div key={p.id} className="card projcard" onClick={() => open(p.id)}>
            <div className="row" style={{ marginBottom: 8 }}>
              <b style={{ fontSize: 15 }}>{t ? t.name : "Onbekende klant"}</b>
              <span className="tag">{p.norm}</span>
              {p.kind === "Hercertificering" && <span className="tag her">HERCERT</span>}
              <span style={{ flex: 1 }} />
              {max > 0 && <span className="mono" style={{ fontSize: 11, color: spent > max ? "var(--red)" : "var(--ink2)" }}>{spent}/{max}u</span>}
              <span className="due" style={{ color: d !== null && d < 14 ? "var(--red)" : d !== null && d < 30 ? "var(--amber)" : "var(--ink2)" }}>
                {p.auditDate ? (d >= 0 ? `Audit over ${d} dgn` : `Audit ${-d} dgn geleden`) : "Geen auditdatum"}
              </span>
            </div>
            <div className="row">
              <div className="bar"><i style={{ width: pr + "%" }} /></div>
              <span className="mono" style={{ fontSize: 12, fontWeight: 600, width: 38, textAlign: "right" }}>{pr}%</span>
            </div>
          </div>
        );
      })}
    </>
  );
}

function Chase({ state, open }) {
  const items = chaseItems(state);
  const owners = [...new Set(items.map(i => i.owner))].sort();
  const [filt, setFilt] = useState("");
  const shown = filt ? items.filter(i => i.owner === filt) : items;
  return (
    <>
      <div className="h1">Actiecentrum</div>
      <div className="sub">Alles wat openstaat, gesorteerd op deadline. Dit is je chase-lijst.</div>
      <div className="row" style={{ margin: "16px 0" }}>
        <label style={{ margin: 0 }}>Wachten op</label>
        <select style={{ width: 220 }} value={filt} onChange={e => setFilt(e.target.value)}>
          <option value="">— iedereen —</option>
          {owners.map(o => <option key={o}>{o}</option>)}
        </select>
      </div>
      {shown.length === 0 && <div className="empty">Niets openstaand. Of er is niets toegewezen; geef taken en documenten een houder.</div>}
      {shown.length > 0 && (
        <div className="card" style={{ padding: 0 }}>
          {shown.map((i, k) => {
            const d = i.due ? daysTo(i.due) : null;
            return (
              <div key={k} className="alertline" style={{ cursor: "pointer" }} onClick={() => open(i.proj.id)}>
                <span className="due" style={{ width: 84, color: d === null ? "var(--ink2)" : d < 0 ? "var(--red)" : d <= 7 ? "var(--amber)" : "var(--ink2)" }}>
                  {d === null ? "geen datum" : d < 0 ? -d + "d te laat" : "over " + d + "d"}
                </span>
                <span className="tag" style={{ background: "#EEF0EA", color: "var(--ink2)" }}>{i.kind}</span>
                <span style={{ flex: 1 }}>{i.what}</span>
                <span className="mono" style={{ fontSize: 11, color: "var(--ink2)" }}>{i.owner} · {i.tn}</span>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

function Tenants({ state, up }) {
  const [form, setForm] = useState(null);
  const empty = { id: null, name: "", contact: "", email: "", sector: "" };
  function save() {
    if (!form.name.trim()) return;
    up(s => {
      if (form.id) { const i = s.tenants.findIndex(t => t.id === form.id); s.tenants[i] = { ...s.tenants[i], ...form }; }
      else s.tenants.push({ ...form, id: uid(), createdAt: today() });
      return s;
    });
    setForm(null);
  }
  return (
    <>
      <div className="row">
        <div style={{ flex: 1 }}>
          <div className="h1">Klanten</div>
          <div className="sub">Elke klant is een eigen omgeving met eigen trajecten</div>
        </div>
        <button className="btn" onClick={() => setForm(empty)}>＋ Klant toevoegen</button>
      </div>
      {form && (
        <div className="card" style={{ marginTop: 18, borderColor: "var(--seal)" }}>
          <div className="grid2">
            <div><label>Bedrijfsnaam *</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="bijv. ENGR B.V." /></div>
            <div><label>Sector</label><input value={form.sector} onChange={e => setForm({ ...form, sector: e.target.value })} /></div>
            <div><label>Contactpersoon</label><input value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })} /></div>
            <div><label>E-mail</label><input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
          </div>
          <div className="row" style={{ marginTop: 12, gap: 8 }}>
            <button className="btn" onClick={save}>Opslaan</button>
            <button className="btn ghost" onClick={() => setForm(null)}>Annuleren</button>
          </div>
        </div>
      )}
      <div style={{ marginTop: 16 }}>
        {state.tenants.length === 0 && !form && <div className="empty">Nog geen klanten. Voeg de eerste toe.</div>}
        {state.tenants.map(t => {
          const n = state.projects.filter(p => p.tenantId === t.id).length;
          return (
            <div key={t.id} className="card row">
              <div style={{ flex: 1 }}>
                <b style={{ fontSize: 14.5 }}>{t.name}</b>
                <div className="sub">{[t.sector, t.contact, t.email].filter(Boolean).join(" · ") || "Geen details"}</div>
              </div>
              <span className="mono" style={{ fontSize: 11.5, color: "var(--ink2)" }}>{n} traject{n === 1 ? "" : "en"}</span>
              <button className="btn sm ghost" onClick={() => setForm({ id: t.id, name: t.name, contact: t.contact, email: t.email, sector: t.sector })}>Bewerken</button>
              <button className="btn sm danger" onClick={() => { if (confirm(`${t.name} en alle bijbehorende trajecten verwijderen?`)) up(s => { s.tenants = s.tenants.filter(x => x.id !== t.id); s.projects = s.projects.filter(p => p.tenantId !== t.id); return s; }); }}>Verwijderen</button>
            </div>
          );
        })}
      </div>
    </>
  );
}

function NewProject({ state, up, done, goTenants }) {
  const [f, setF] = useState({ tenantId: "", norm: "VCU", kind: "Certificering", auditDate: "", ci: "", bureau: "", budgetMax: "" });
  const isae = f.norm === "ISAE 3402";
  function create() {
    if (!f.tenantId) return;
    const id = uid();
    up(s => {
      s.projects.push({
        id, tenantId: f.tenantId, norm: f.norm, kind: f.kind,
        auditDate: f.auditDate, ci: f.ci, bureau: f.bureau, createdAt: today(),
        budget: { min: 0, max: parseFloat(f.budgetMax) || 0 },
        phases: phasesFor(f.norm, f.kind).map(([name, tasks]) => ({
          id: uid(), name, open: false,
          tasks: tasks.map(t => ({ id: uid(), name: t, done: false, owner: "", due: "" }))
        })),
        controls: controlsFor(f.norm),
        docs: [], findings: [], risks: [],
        log: [{ id: uid(), date: today(), text: "Traject aangemaakt (" + f.norm + ", " + f.kind + ")" }],
        hours: [], expiries: [],
      });
      return s;
    });
    done(id);
  }
  return (
    <>
      <div className="h1">Nieuw traject</div>
      <div className="sub">Fasen en beheersmaatregelen worden automatisch ingericht op basis van norm en type</div>
      <div className="card" style={{ marginTop: 18 }}>
        <div className="grid2">
          <div>
            <label>Klant *</label>
            <select value={f.tenantId} onChange={e => setF({ ...f, tenantId: e.target.value })}>
              <option value="">— kies klant —</option>
              {state.tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            {state.tenants.length === 0 && <div className="sub" style={{ marginTop: 6 }}>Geen klanten. <button className="crumb" onClick={goTenants}>Eerst een klant aanmaken →</button></div>}
          </div>
          <div><label>Norm</label><select value={f.norm} onChange={e => setF({ ...f, norm: e.target.value })}>{NORMS.map(n => <option key={n}>{n}</option>)}</select></div>
          <div><label>Type</label><select value={f.kind} onChange={e => setF({ ...f, kind: e.target.value })}><option>Certificering</option><option>Hercertificering</option></select></div>
          <div><label>{isae ? "Datum Type II audit / rapportdeadline" : "Datum externe audit"}</label><input type="date" value={f.auditDate} onChange={e => setF({ ...f, auditDate: e.target.value })} /></div>
          <div><label>{isae ? "Auditerende accountant" : "Certificerende instantie"}</label><input value={f.ci} onChange={e => setF({ ...f, ci: e.target.value })} placeholder={isae ? "bijv. BDO, Mazars" : "bijv. TÜV, DNV, Kiwa"} /></div>
          <div><label>Adviesbureau</label><input value={f.bureau} onChange={e => setF({ ...f, bureau: e.target.value })} /></div>
          <div><label>Urenbudget (max, voor jezelf)</label><input type="number" value={f.budgetMax} onChange={e => setF({ ...f, budgetMax: e.target.value })} placeholder="bijv. 48" /></div>
        </div>
        {isae && <div className="sub" style={{ marginTop: 10, color: "var(--amber)" }}>Let op: ISAE 3402 levert een assurance-rapport per periode, geen certificaat. Kies 'Hercertificering' voor een vervolgperiode (jaarlijkse cyclus).</div>}
        <div style={{ marginTop: 14 }}>
          <button className={"btn" + (f.tenantId ? "" : " dis")} onClick={create}>Traject aanmaken</button>
        </div>
      </div>
    </>
  );
}

function Backup({ state, setState }) {
  const [pasted, setPasted] = useState("");
  const [msg, setMsg] = useState("");
  function download() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "certos-backup-" + today() + ".json";
    a.click();
    URL.revokeObjectURL(a.href);
  }
  function restore() {
    try {
      const s = migrate(JSON.parse(pasted));
      setState(s); saveState(s);
      setMsg("Back-up teruggezet: " + s.tenants.length + " klanten, " + s.projects.length + " trajecten.");
      setPasted("");
    } catch { setMsg("Ongeldig JSON-bestand. Plak de volledige inhoud van een CertOS-back-up."); }
  }
  return (
    <>
      <div className="h1">Back-up</div>
      <div className="sub">Browser-opslag is kwetsbaar; maak wekelijks een back-up van je dossiers</div>
      <div className="card" style={{ marginTop: 18 }}>
        <b style={{ fontSize: 14 }}>Exporteren</b>
        <div className="sub" style={{ marginBottom: 10 }}>Download alle data als JSON-bestand (bewaar op SharePoint/Drive)</div>
        <button className="btn" onClick={download}>⬇ Back-up downloaden</button>
      </div>
      <div className="card">
        <b style={{ fontSize: 14 }}>Terugzetten</b>
        <div className="sub" style={{ marginBottom: 10 }}>Plak hieronder de inhoud van een back-upbestand. Let op: dit overschrijft alle huidige data.</div>
        <textarea rows={6} value={pasted} onChange={e => setPasted(e.target.value)} placeholder='{"version":3,"tenants":[...],"projects":[...]}' />
        <div className="row" style={{ marginTop: 10 }}>
          <button className={"btn danger" + (pasted.trim() ? "" : " dis")} onClick={() => pasted.trim() && confirm("Huidige data overschrijven met deze back-up?") && restore()}>Terugzetten</button>
          {msg && <span className="sub">{msg}</span>}
        </div>
      </div>
    </>
  );
}

/* ============================================================ TRAJECT */

function Project({ p, tenant, up, back }) {
  const [tab, setTab] = useState("fasen");
  const [modal, setModal] = useState(null);
  const [auditMode, setAuditMode] = useState(false);
  const pr = projProgress(p);
  const d = daysTo(p.auditDate);
  const mut = fn => up(s => { const q = s.projects.find(x => x.id === p.id); fn(q); return s; });
  const tabs = [["fasen", "Fasen"], ["plan", "Planning"], ["ctrl", "Maatregelen"], ["docs", "Documenten"], ["audit", "Audit"], ["risks", "Risico's"], ["uren", "Uren"], ["log", "Logboek"], ["geg", "Gegevens"]];

  if (auditMode) return <AuditModeView p={p} tenant={tenant} mut={mut} exit={() => setAuditMode(false)} />;

  return (
    <>
      <button className="crumb" onClick={back}>← Dashboard</button>
      <div className="row" style={{ marginTop: 10, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 240 }}>
          <div className="h1">{tenant ? tenant.name : "Klant"} · {p.norm}</div>
          <div className="sub">{p.kind}{p.ci ? ` · ${p.norm === "ISAE 3402" ? "Accountant" : "CI"}: ${p.ci}` : ""}{p.bureau ? ` · Bureau: ${p.bureau}` : ""} · {p.norm === "ISAE 3402" ? "Type II audit" : "Audit"}: {fmt(p.auditDate)}{d !== null && d >= 0 ? ` (over ${d} dgn)` : ""}</div>
        </div>
        <button className="btn sm" onClick={() => setModal("quick")}>⚡ Snelle update</button>
        <button className="btn sm ghost" onClick={() => setModal("rapport")}>Statusrapport</button>
        <button className="btn sm ghost" onClick={() => setModal("ai-analyse")}>AI-analyse</button>
        <button className="btn sm ghost" style={{ borderColor: "var(--amber)", color: "var(--amber)" }} onClick={() => setAuditMode(true)}>▶ Auditmodus</button>
      </div>
      <div className="card" style={{ marginTop: 14 }}>
        <div className="row">
          <div className="bar"><i style={{ width: pr + "%" }} /></div>
          <span className="mono" style={{ fontSize: 12.5, fontWeight: 600 }}>{pr}% gereed</span>
        </div>
        <HourBar p={p} />
      </div>
      <div className="tabs">
        {tabs.map(([id, name]) => <button key={id} className={tab === id ? "on" : ""} onClick={() => setTab(id)}>{name}</button>)}
      </div>
      {tab === "fasen" && <PhasesTab p={p} mut={mut} />}
      {tab === "plan" && <PlanningTab p={p} mut={mut} />}
      {tab === "ctrl" && <ControlsTab p={p} mut={mut} />}
      {tab === "docs" && <DocsTab p={p} mut={mut} tenant={tenant} />}
      {tab === "audit" && <AuditTab p={p} mut={mut} />}
      {tab === "risks" && <RisksTab p={p} mut={mut} />}
      {tab === "uren" && <HoursTab p={p} mut={mut} />}
      {tab === "log" && <LogTab p={p} mut={mut} />}
      {tab === "geg" && <SettingsTab p={p} mut={mut} up={up} back={back} />}
      {modal === "rapport" && <ReportModal p={p} tenant={tenant} close={() => setModal(null)} />}
      {modal === "ai-analyse" && <AnalysisModal p={p} tenant={tenant} close={() => setModal(null)} />}
      {modal === "quick" && <QuickUpdateModal p={p} tenant={tenant} close={() => setModal(null)} />}
    </>
  );
}

function HourBar({ p }) {
  const spent = sumHours(p), max = p.budget?.max || 0;
  if (!max) return null;
  const pct = Math.min(100, Math.round((spent / max) * 100));
  const cls = spent > max ? "over" : pct >= 80 ? "warn" : "";
  return (
    <div className="row" style={{ marginTop: 8 }}>
      <div className="bar"><i className={cls} style={{ width: pct + "%" }} /></div>
      <span className="mono" style={{ fontSize: 12, fontWeight: 600, color: spent > max ? "var(--red)" : "var(--ink2)" }}>{spent}/{max}u</span>
    </div>
  );
}

function PhasesTab({ p, mut }) {
  const [newPhase, setNewPhase] = useState("");
  return (
    <>
      {p.phases.map((f, fi) => {
        const dn = f.tasks.filter(t => t.done).length;
        return (
          <div key={f.id} className="phase">
            <header onClick={() => mut(q => { q.phases[fi].open = !q.phases[fi].open; })}>
              <span className="mono" style={{ fontSize: 11, color: "var(--ink2)", width: 22 }}>{String(fi + 1).padStart(2, "0")}</span>
              <b>{f.name}</b>
              <span className="mono" style={{ fontSize: 11.5, color: dn === f.tasks.length && f.tasks.length ? "var(--seal)" : "var(--ink2)", fontWeight: 600 }}>{dn}/{f.tasks.length}</span>
              <span style={{ color: "var(--ink2)" }}>{f.open ? "▾" : "▸"}</span>
            </header>
            {f.open && (
              <>
                {f.tasks.map((t, ti) => (
                  <div key={t.id} className={"task" + (t.done ? " done" : "")}>
                    <input type="checkbox" checked={t.done} onChange={() => mut(q => { q.phases[fi].tasks[ti].done = !q.phases[fi].tasks[ti].done; })} />
                    <span className="tname">{t.name}</span>
                    <input className="mini owner" placeholder="houder" value={t.owner} onChange={e => mut(q => { q.phases[fi].tasks[ti].owner = e.target.value; })} />
                    <input className="mini date" type="date" value={t.due} onChange={e => mut(q => { q.phases[fi].tasks[ti].due = e.target.value; })} />
                    <button className="crumb" style={{ color: "var(--red)" }} onClick={() => mut(q => { q.phases[fi].tasks.splice(ti, 1); })}>×</button>
                  </div>
                ))}
                <div className="task">
                  <AddInline placeholder="Nieuwe taak…" onAdd={name => mut(q => { q.phases[fi].tasks.push({ id: uid(), name, done: false, owner: "", due: "" }); })} />
                  <button className="crumb" style={{ color: "var(--red)" }} onClick={() => confirm("Fase '" + f.name + "' verwijderen?") && mut(q => { q.phases.splice(fi, 1); })}>fase verwijderen</button>
                </div>
              </>
            )}
          </div>
        );
      })}
      <div className="row" style={{ marginTop: 8 }}>
        <input style={{ maxWidth: 320 }} placeholder="Nieuwe fase toevoegen…" value={newPhase} onChange={e => setNewPhase(e.target.value)} />
        <button className={"btn sm" + (newPhase.trim() ? "" : " dis")} onClick={() => { if (!newPhase.trim()) return; mut(q => { q.phases.push({ id: uid(), name: newPhase.trim(), open: true, tasks: [] }); }); setNewPhase(""); }}>＋ Fase</button>
      </div>
    </>
  );
}

function AddInline({ placeholder, onAdd }) {
  const [v, setV] = useState("");
  return (
    <>
      <input className="mini" style={{ flex: 1, minWidth: 150 }} placeholder={placeholder} value={v}
        onChange={e => setV(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter" && v.trim()) { onAdd(v.trim()); setV(""); } }} />
      <button className={"btn sm ghost" + (v.trim() ? "" : " dis")} onClick={() => { if (v.trim()) { onAdd(v.trim()); setV(""); } }}>＋</button>
    </>
  );
}

/* ---------- Maatregelen met kennislaag ---------- */

function ControlsTab({ p, mut }) {
  const [openId, setOpenId] = useState(null);
  const info = NORM_INFO[p.norm];
  function addEvidence(items) {
    mut(q => {
      for (const name of items) {
        if (!q.docs.some(d => d.name === name)) q.docs.push({ id: uid(), name, status: 0, owner: "", due: "", link: "", note: "" });
      }
      q.log.unshift({ id: uid(), date: today(), text: items.length + " bewijsstukken toegevoegd aan documentenregister" });
    });
  }
  return (
    <>
      {info && (
        <div className="card" style={{ padding: "12px 16px" }}>
          <div className="row" style={{ flexWrap: "wrap", gap: 8 }}>
            <span style={{ fontSize: 13 }}><b>{p.norm}</b> · {info.titel}. Klik op een maatregel voor uitleg, verwachting en aan te leveren bewijs.</span>
            <span style={{ flex: 1 }} />
            {info.links.map(([t, u]) => <a key={u + t} className="linkchip" href={u} target="_blank" rel="noreferrer">↗ {t}</a>)}
          </div>
        </div>
      )}
      <div className="card" style={{ padding: 0 }}>
        {p.controls.map((c, ci) => {
          const g = GUIDE[c.code];
          const open = openId === c.id;
          return (
            <div key={c.id} className="ctrl">
              <div className="ctrl-head">
                <span className="code" style={{ cursor: "pointer" }} onClick={() => setOpenId(open ? null : c.id)}>{c.code}</span>
                <div style={{ cursor: "pointer" }} onClick={() => setOpenId(open ? null : c.id)}>
                  <b>{c.name} <span className="crumb" style={{ fontWeight: 600 }}>{g ? (open ? "▾" : "ⓘ") : ""}</span></b>
                  <small>{c.desc}</small>
                  <div className="row" style={{ gap: 6 }} onClick={e => e.stopPropagation()}>
                    <input className="note-in" style={{ flex: 1 }} placeholder="Bewijslink (SharePoint/Drive-URL)" value={c.link || ""}
                      onChange={e => mut(q => { q.controls[ci].link = e.target.value; })} />
                    {c.link && <a className="linkchip" style={{ marginTop: 6 }} href={c.link.startsWith("http") ? c.link : "https://" + c.link} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}>↗</a>}
                  </div>
                  <input className="note-in" placeholder="Notitie (bijv. documentnaam, status)" value={c.note}
                    onClick={e => e.stopPropagation()} onChange={e => mut(q => { q.controls[ci].note = e.target.value; })} />
                </div>
                <div style={{ textAlign: "right" }}>
                  <span className="stamp" style={{ color: CTRL_COLOR[c.status] }} title="Klik om status te wijzigen"
                    onClick={() => mut(q => { q.controls[ci].status = (q.controls[ci].status + 1) % 4; })}>{CTRL_STATUS[c.status]}</span>
                </div>
              </div>
              {open && g && <GuidePanel g={g} code={c.code} name={c.name} norm={p.norm} onAddDocs={addEvidence} />}
            </div>
          );
        })}
      </div>
    </>
  );
}

/* ---------- Documenten ---------- */

function DocsTab({ p, mut, tenant }) {
  const [showImport, setShowImport] = useState(false);
  const [mail, setMail] = useState(null);
  function rappel(doc) {
    const naam = doc.owner || (tenant ? tenant.contact : "") || "collega";
    setMail(
`Onderwerp: Rappel: ${doc.name} (${p.norm}-traject)

Hoi ${naam},

Voor het ${p.norm}-traject${p.auditDate ? " (audit " + fmt(p.auditDate) + ")" : ""} wacht ik nog op: ${doc.name}.${doc.due ? "\nAfgesproken deadline: " + fmt(doc.due) + "." : ""}

Kun je dit deze week aanleveren, of laten weten wanneer ik het kan verwachten? Zonder dit document loopt de voorbereiding vertraging op.

Alvast dank!

Groet,
Dennis`);
  }
  return (
    <>
      <div className="row" style={{ marginBottom: 10 }}>
        <AddInline placeholder="Document toevoegen (bijv. RI&E, VG-beleidsverklaring)…" onAdd={name => mut(q => { q.docs.push({ id: uid(), name, status: 0, owner: "", due: "", link: "", note: "" }); })} />
        <button className="btn sm ghost" onClick={() => setShowImport(true)}>⌁ Checklist importeren (AI)</button>
      </div>
      <div className="sub" style={{ marginBottom: 10 }}>Tip: via tab Maatregelen → uitleg → "Bewijs naar documentenlijst" vult dit register zich met de juiste bewijsstukken per maatregel.</div>
      {(p.docs || []).length === 0 && <div className="empty">Nog geen documenten. Voeg ze toe via Maatregelen (bewijsknop), handmatig, of via AI-import van de checklist.</div>}
      {(p.docs || []).length > 0 && (
        <div className="card" style={{ padding: 0 }}>
          {p.docs.map((doc, di) => (
            <div key={doc.id} className="list-row">
              <span className="stamp" style={{ color: DOC_COLOR[doc.status], marginTop: 3 }}
                onClick={() => mut(q => { q.docs[di].status = (q.docs[di].status + 1) % 4; })}>{DOC_STATUS[doc.status]}</span>
              <div style={{ flex: 1, minWidth: 200 }}>
                <b style={{ fontSize: 13.5 }}>{doc.name}</b>
                <input className="note-in" placeholder="Vindplaats / link (SharePoint, Drive…)" value={doc.link} onChange={e => mut(q => { q.docs[di].link = e.target.value; })} />
              </div>
              <input className="mini owner" placeholder="houder" value={doc.owner} onChange={e => mut(q => { q.docs[di].owner = e.target.value; })} />
              <input className="mini date" type="date" value={doc.due} onChange={e => mut(q => { q.docs[di].due = e.target.value; })} />
              {doc.status < 3 && <button className="btn sm ghost" onClick={() => rappel(doc)}>✉ Rappel</button>}
              <button className="crumb" style={{ color: "var(--red)" }} onClick={() => mut(q => { q.docs.splice(di, 1); })}>×</button>
            </div>
          ))}
        </div>
      )}
      {showImport && <ImportModal p={p} mut={mut} close={() => setShowImport(false)} />}
      {mail && (
        <Modal title="Rappelmail" close={() => setMail(null)}>
          <div className="pre">{mail}</div>
          <div className="row" style={{ marginTop: 12 }}>
            <button className="btn" onClick={() => copyText(mail)}>Kopiëren</button>
            <button className="btn ghost" onClick={() => setMail(null)}>Sluiten</button>
          </div>
        </Modal>
      )}
    </>
  );
}

function ImportModal({ p, mut, close }) {
  const [txt, setTxt] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState("");
  async function run() {
    setBusy(true); setErr("");
    try {
      const out = await askClaude(
`Je bent een assistent die certificeringschecklists structureert. Hieronder staat een checklist of vragenlijst van een adviesbureau, accountant of certificerende instantie (norm: ${p.norm}).

Zet deze om naar JSON met exact deze structuur, zonder enige andere tekst, zonder markdown:
{"documents":[{"name":"..."}],"tasks":[{"name":"..."}]}

Regels:
- "documents": alles wat een aan te leveren document, bewijsstuk, registratie of dossier is.
- "tasks": alles wat een uit te voeren actie of in te richten proces is.
- Nederlandse, beknopte naamgeving (max 80 tekens per item).
- Voeg niets toe dat niet in de tekst staat. Maximaal 40 items per lijst.

Checklist:
${txt.slice(0, 6000)}`, 2000);
      const parsed = parseJsonLoose(out);
      setResult({ documents: parsed.documents || [], tasks: parsed.tasks || [] });
    } catch { setErr("Import mislukt. Probeer het opnieuw of voeg items handmatig toe."); }
    setBusy(false);
  }
  function apply() {
    mut(q => {
      let phase = q.phases.find(f => f.name === "Checklist adviesbureau");
      if (!phase && result.tasks.length) { phase = { id: uid(), name: "Checklist adviesbureau", open: true, tasks: [] }; q.phases.push(phase); }
      for (const t of result.tasks) phase.tasks.push({ id: uid(), name: t.name, done: false, owner: "", due: "" });
      for (const dcc of result.documents) q.docs.push({ id: uid(), name: dcc.name, status: 0, owner: "", due: "", link: "", note: "" });
      q.log.unshift({ id: uid(), date: today(), text: `Checklist geïmporteerd: ${result.documents.length} documenten, ${result.tasks.length} taken` });
    });
    close();
  }
  return (
    <Modal title="Checklist importeren met AI" close={close}>
      {!result && (
        <>
          <div className="sub" style={{ marginBottom: 10 }}>Plak de checklist van het adviesbureau, de accountant of de CI. AI splitst deze in aan te leveren documenten en uit te voeren taken; jij controleert het resultaat.</div>
          <textarea rows={9} value={txt} onChange={e => setTxt(e.target.value)} placeholder="Plak hier de volledige checklist-tekst…" />
          <div className="row" style={{ marginTop: 12 }}>
            <button className={"btn" + (txt.trim() && !busy ? "" : " dis")} onClick={() => txt.trim() && !busy && run()}>{busy ? <span className="spin" /> : "Analyseren"}</button>
            <button className="btn ghost" onClick={close}>Annuleren</button>
            {err && <span className="sub" style={{ color: "var(--red)" }}>{err}</span>}
          </div>
        </>
      )}
      {result && (
        <>
          <div className="sub" style={{ marginBottom: 8 }}>Gevonden: <b>{result.documents.length} documenten</b> en <b>{result.tasks.length} taken</b>. Controleer en bevestig.</div>
          <div className="pre" style={{ maxHeight: 280, overflow: "auto" }}>
            {"DOCUMENTEN\n" + result.documents.map(d => "  · " + d.name).join("\n") + "\n\nTAKEN\n" + result.tasks.map(t => "  · " + t.name).join("\n")}
          </div>
          <div className="row" style={{ marginTop: 12 }}>
            <button className="btn" onClick={apply}>Toevoegen aan traject</button>
            <button className="btn ghost" onClick={() => setResult(null)}>Terug</button>
          </div>
        </>
      )}
    </Modal>
  );
}

function AuditTab({ p, mut }) {
  const SRC = ["Interne audit", "Externe audit", "Nulmeting", "Readiness assessment", "Overig"];
  return (
    <>
      <div className="sub" style={{ marginBottom: 10 }}>Afwijkingen en verbeterpunten met hersteltermijn. Bij VCU geldt: tekortkomingen binnen 3 maanden oplossen, anders intrekking. Bij ISAE leiden onopgeloste afwijkingen tot een aantekening in het rapport dat klanten lezen.</div>
      <div className="row" style={{ marginBottom: 10 }}>
        <AddInline placeholder="Nieuwe bevinding (omschrijving)…" onAdd={desc => mut(q => { q.findings.push({ id: uid(), desc, source: "Interne audit", severity: "Minor", due: "", status: 0, owner: "", note: "" }); })} />
      </div>
      {(p.findings || []).length === 0 && <div className="empty">Geen bevindingen geregistreerd.</div>}
      {(p.findings || []).length > 0 && (
        <div className="card" style={{ padding: 0 }}>
          {p.findings.map((f, fi) => (
            <div key={f.id} className="list-row">
              <span className="stamp" style={{ color: FIND_COLOR[f.status], marginTop: 3 }}
                onClick={() => mut(q => { q.findings[fi].status = (q.findings[fi].status + 1) % 4; })}>{FIND_STATUS[f.status]}</span>
              <div style={{ flex: 1, minWidth: 200 }}>
                <b style={{ fontSize: 13.5 }}>{f.desc}</b>
                <input className="note-in" placeholder="Corrigerende maatregel / bewijs" value={f.note} onChange={e => mut(q => { q.findings[fi].note = e.target.value; })} />
                <div className="row" style={{ gap: 6 }}>
                  <input className="note-in" style={{ flex: 1 }} placeholder="Link naar herstelbewijs (SharePoint/Drive)" value={f.link || ""} onChange={e => mut(q => { q.findings[fi].link = e.target.value; })} />
                  {f.link && <a className="linkchip" style={{ marginTop: 6 }} href={f.link.startsWith("http") ? f.link : "https://" + f.link} target="_blank" rel="noreferrer">↗</a>}
                </div>
              </div>
              <select className="mini" style={{ width: 150 }} value={f.source} onChange={e => mut(q => { q.findings[fi].source = e.target.value; })}>{SRC.map(s => <option key={s}>{s}</option>)}</select>
              <select className="mini" style={{ width: 86 }} value={f.severity} onChange={e => mut(q => { q.findings[fi].severity = e.target.value; })}><option>Minor</option><option>Major</option></select>
              <input className="mini owner" placeholder="houder" value={f.owner} onChange={e => mut(q => { q.findings[fi].owner = e.target.value; })} />
              <input className="mini date" type="date" value={f.due} onChange={e => mut(q => { q.findings[fi].due = e.target.value; })} />
              <button className="crumb" style={{ color: "var(--red)" }} onClick={() => mut(q => { q.findings.splice(fi, 1); })}>×</button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function RisksTab({ p, mut }) {
  return (
    <>
      <div className="row" style={{ marginBottom: 10 }}>
        <AddInline placeholder="Nieuw risico (omschrijving)…" onAdd={desc => mut(q => { q.risks.push({ id: uid(), desc, impact: "M", mitigation: "", status: 0 }); })} />
      </div>
      {(p.risks || []).length === 0 && <div className="empty">Geen risico's geregistreerd. Denk aan: praktijkbewijs te dun, diploma's niet op tijd, vakantieperiode, afhankelijkheid van één persoon.</div>}
      {(p.risks || []).length > 0 && (
        <div className="card" style={{ padding: 0 }}>
          {p.risks.map((r, ri) => (
            <div key={r.id} className="list-row">
              <span className="stamp" style={{ color: RISK_COLOR[r.status], marginTop: 3 }}
                onClick={() => mut(q => { q.risks[ri].status = (q.risks[ri].status + 1) % 3; })}>{RISK_STATUS[r.status]}</span>
              <div style={{ flex: 1, minWidth: 200 }}>
                <b style={{ fontSize: 13.5 }}>{r.desc}</b>
                <input className="note-in" placeholder="Beheersmaatregel" value={r.mitigation} onChange={e => mut(q => { q.risks[ri].mitigation = e.target.value; })} />
              </div>
              <select className="mini" style={{ width: 120 }} value={r.impact} onChange={e => mut(q => { q.risks[ri].impact = e.target.value; })}>
                <option value="L">Impact: laag</option><option value="M">Impact: middel</option><option value="H">Impact: hoog</option>
              </select>
              <button className="crumb" style={{ color: "var(--red)" }} onClick={() => mut(q => { q.risks.splice(ri, 1); })}>×</button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function HoursTab({ p, mut }) {
  const [f, setF] = useState({ date: today(), cat: HOUR_CATS[2], hours: "", note: "" });
  const spent = sumHours(p), max = p.budget?.max || 0;
  const perCat = HOUR_CATS.map(c => [c, (p.hours || []).filter(h => h.cat === c).reduce((s, h) => s + (parseFloat(h.hours) || 0), 0)]).filter(([, v]) => v > 0);
  function add() {
    const h = parseFloat(f.hours);
    if (!h) return;
    mut(q => { q.hours.unshift({ id: uid(), ...f, hours: h }); });
    setF({ ...f, hours: "", note: "" });
  }
  return (
    <>
      <div className="card">
        <div className="row" style={{ flexWrap: "wrap", gap: 8 }}>
          <input className="mini date" type="date" value={f.date} onChange={e => setF({ ...f, date: e.target.value })} />
          <select className="mini" style={{ width: 190 }} value={f.cat} onChange={e => setF({ ...f, cat: e.target.value })}>{HOUR_CATS.map(c => <option key={c}>{c}</option>)}</select>
          <input className="mini" style={{ width: 70 }} type="number" step="0.25" placeholder="uren" value={f.hours} onChange={e => setF({ ...f, hours: e.target.value })} />
          <input className="mini" style={{ flex: 1, minWidth: 160 }} placeholder="omschrijving" value={f.note} onChange={e => setF({ ...f, note: e.target.value })} />
          <button className={"btn sm" + (parseFloat(f.hours) ? "" : " dis")} onClick={add}>＋ Boeken</button>
        </div>
        <div className="row" style={{ marginTop: 12 }}>
          <span className="mono" style={{ fontSize: 12.5, fontWeight: 600 }}>Totaal: {spent}u{max ? " / budget " + max + "u" : ""}</span>
          {max > 0 && spent / max >= 0.8 && spent <= max && <span className="tag her">80%+ van budget</span>}
          {max > 0 && spent > max && <span className="tag" style={{ background: "#F3DEDA", color: "var(--red)" }}>BUDGET OVERSCHREDEN</span>}
        </div>
        {perCat.length > 0 && <div className="sub" style={{ marginTop: 6 }}>{perCat.map(([c, v]) => c + " " + v + "u").join(" · ")}</div>}
      </div>
      {(p.hours || []).length > 0 && (
        <div className="card" style={{ padding: 0 }}>
          {p.hours.map((h, hi) => (
            <div key={h.id} className="alertline">
              <span className="mono" style={{ fontSize: 11.5, width: 86 }}>{fmt(h.date)}</span>
              <span className="mono" style={{ fontSize: 11.5, width: 56, fontWeight: 600 }}>{h.hours}u</span>
              <span className="tag" style={{ background: "#EEF0EA", color: "var(--ink2)" }}>{h.cat}</span>
              <span style={{ flex: 1 }}>{h.note}</span>
              <button className="crumb" style={{ color: "var(--red)" }} onClick={() => mut(q => { q.hours.splice(hi, 1); })}>×</button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function LogTab({ p, mut }) {
  const [txt, setTxt] = useState("");
  return (
    <>
      <div className="sub" style={{ marginBottom: 10 }}>Besluiten, telefoongesprekken en toezeggingen met datum. Jouw dekking als extern consultant.</div>
      <div className="card">
        <textarea rows={3} value={txt} onChange={e => setTxt(e.target.value)} placeholder="bijv. Bureau bevestigde telefonisch dat de interne audit op 30-06 plaatsvindt…" />
        <button className={"btn sm" + (txt.trim() ? "" : " dis")} style={{ marginTop: 8 }}
          onClick={() => { if (!txt.trim()) return; mut(q => { q.log.unshift({ id: uid(), date: today(), text: txt.trim() }); }); setTxt(""); }}>＋ Vastleggen</button>
      </div>
      {(p.log || []).map((l, li) => (
        <div key={l.id} className="card row" style={{ padding: "10px 14px" }}>
          <span className="mono" style={{ fontSize: 11.5, color: "var(--ink2)", width: 86, flexShrink: 0 }}>{fmt(l.date)}</span>
          <span style={{ flex: 1, fontSize: 13.5 }}>{l.text}</span>
          <button className="crumb" style={{ color: "var(--red)" }} onClick={() => mut(q => { q.log.splice(li, 1); })}>×</button>
        </div>
      ))}
    </>
  );
}

function SettingsTab({ p, mut, up, back }) {
  const [e, setE] = useState({ name: "", type: "Diploma", holder: "", date: "" });
  const isae = p.norm === "ISAE 3402";
  return (
    <>
      <div className="card">
        <b style={{ fontSize: 14 }}>Trajectgegevens</b>
        <div className="grid3" style={{ marginTop: 10 }}>
          <div><label>{isae ? "Datum Type II audit" : "Datum externe audit"}</label><input type="date" value={p.auditDate || ""} onChange={ev => mut(q => { q.auditDate = ev.target.value; })} /></div>
          <div><label>{isae ? "Accountant" : "Certificerende instantie"}</label><input value={p.ci || ""} onChange={ev => mut(q => { q.ci = ev.target.value; })} /></div>
          <div><label>Adviesbureau</label><input value={p.bureau || ""} onChange={ev => mut(q => { q.bureau = ev.target.value; })} /></div>
          <div><label>Urenbudget (max)</label><input type="number" value={p.budget?.max || ""} onChange={ev => mut(q => { q.budget = { ...(q.budget || {}), max: parseFloat(ev.target.value) || 0 }; })} /></div>
        </div>
      </div>
      <div className="card">
        <b style={{ fontSize: 14 }}>Vervaldata</b>
        <div className="sub" style={{ marginBottom: 10 }}>Diploma's, certificaatgeldigheid, controle-audits en rapportageperiodes. Items binnen 90 dagen verschijnen op het dashboard; dit is je signaal voor vervolgopdrachten.</div>
        <div className="row" style={{ flexWrap: "wrap", gap: 8 }}>
          <input className="mini" style={{ flex: 1, minWidth: 150 }} placeholder="bijv. VIL-VCU Lars / einde rapportageperiode" value={e.name} onChange={ev => setE({ ...e, name: ev.target.value })} />
          <select className="mini" style={{ width: 150 }} value={e.type} onChange={ev => setE({ ...e, type: ev.target.value })}>{EXP_TYPES.map(t => <option key={t}>{t}</option>)}</select>
          <input className="mini owner" placeholder="persoon" value={e.holder} onChange={ev => setE({ ...e, holder: ev.target.value })} />
          <input className="mini date" type="date" value={e.date} onChange={ev => setE({ ...e, date: ev.target.value })} />
          <button className={"btn sm" + (e.name.trim() && e.date ? "" : " dis")} onClick={() => { if (!e.name.trim() || !e.date) return; mut(q => { q.expiries.push({ id: uid(), ...e }); }); setE({ name: "", type: e.type, holder: "", date: "" }); }}>＋</button>
        </div>
        {(p.expiries || []).sort((a, b) => a.date < b.date ? -1 : 1).map(x => {
          const dd = daysTo(x.date);
          const xi = p.expiries.findIndex(z => z.id === x.id);
          return (
            <div key={x.id} className="alertline" style={{ borderTop: "1px solid #EFF0E9", marginTop: 6 }}>
              <span className="due" style={{ width: 80, color: dd < 0 ? "var(--red)" : dd < 90 ? "var(--amber)" : "var(--ink2)" }}>{dd < 0 ? "verlopen" : dd + "d"}</span>
              <span className="tag" style={{ background: "#EEF0EA", color: "var(--ink2)" }}>{x.type}</span>
              <span style={{ flex: 1 }}>{x.name}{x.holder ? " · " + x.holder : ""}</span>
              <span className="mono" style={{ fontSize: 11.5 }}>{fmt(x.date)}</span>
              <button className="crumb" style={{ color: "var(--red)" }} onClick={() => mut(q => { q.expiries.splice(xi, 1); })}>×</button>
            </div>
          );
        })}
      </div>
      <div className="card">
        <b style={{ fontSize: 14, color: "var(--red)" }}>Gevarenzone</b>
        <div style={{ marginTop: 10 }}>
          <button className="btn sm danger" onClick={() => { if (confirm("Dit traject definitief verwijderen?")) { up(s => { s.projects = s.projects.filter(x => x.id !== p.id); return s; }); back(); } }}>Traject verwijderen</button>
        </div>
      </div>
    </>
  );
}

/* ---------- Rapport / AI-analyse ---------- */

function buildReport(p, tenant) {
  const d = daysTo(p.auditDate);
  const tasks = p.phases.flatMap(f => f.tasks);
  const open = chaseItems({ tenants: tenant ? [tenant] : [], projects: [p] });
  const byOwner = {};
  for (const i of open) (byOwner[i.owner] = byOwner[i.owner] || []).push(i);
  const spent = sumHours(p), max = p.budget?.max || 0;
  let r = `STATUSRAPPORT ${p.norm} — ${tenant ? tenant.name : ""}\n`;
  r += `Datum: ${fmt(today())} · ${p.kind} · ${p.norm === "ISAE 3402" ? "Type II audit" : "Audit"}: ${fmt(p.auditDate)}${d !== null && d >= 0 ? ` (over ${d} dagen)` : ""}\n`;
  r += `${"=".repeat(54)}\n\nVOORTGANG: ${projProgress(p)}%\n`;
  r += `· Taken: ${tasks.filter(t => t.done).length}/${tasks.length} gereed\n`;
  r += `· Beheersmaatregelen aantoonbaar: ${p.controls.filter(c => c.status === 3).length}/${p.controls.length}\n`;
  r += `· Documenten aangeleverd: ${(p.docs || []).filter(x => x.status === 3).length}/${(p.docs || []).length}\n`;
  if (max) r += `· Uren: ${spent} van ${max} (${Math.round(spent / max * 100)}%)\n`;
  r += `\nFASEN\n`;
  for (const f of p.phases) r += `· ${f.name}: ${f.tasks.filter(t => t.done).length}/${f.tasks.length}\n`;
  if (Object.keys(byOwner).length) {
    r += `\nOPENSTAANDE ACTIES (per houder)\n`;
    for (const [o, list] of Object.entries(byOwner)) {
      r += `${o}:\n`;
      for (const i of list.slice(0, 8)) r += `  · [${i.kind}] ${i.what}${i.due ? " — " + fmt(i.due) : ""}\n`;
    }
  }
  const fOpen = (p.findings || []).filter(x => x.status < 2);
  if (fOpen.length) { r += `\nOPEN BEVINDINGEN\n`; for (const x of fOpen) r += `· [${x.severity}] ${x.desc}${x.due ? " — herstel uiterlijk " + fmt(x.due) : ""}\n`; }
  const rOpen = (p.risks || []).filter(x => x.status === 0);
  if (rOpen.length) { r += `\nRISICO'S\n`; for (const x of rOpen) r += `· (${x.impact}) ${x.desc}${x.mitigation ? " → " + x.mitigation : ""}\n`; }
  return r;
}

function Modal({ title, close, children }) {
  return (
    <div className="modal-bg" onClick={e => e.target === e.currentTarget && close()}>
      <div className="modal">
        <div className="row" style={{ marginBottom: 12 }}>
          <b style={{ fontSize: 16, flex: 1 }}>{title}</b>
          <button className="crumb" onClick={close}>sluiten ×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ReportModal({ p, tenant, close }) {
  const base = buildReport(p, tenant);
  const [txt, setTxt] = useState(base);
  const [busy, setBusy] = useState(false);
  async function aiMail() {
    setBusy(true);
    try {
      const out = await askClaude(
`Herschrijf het onderstaande statusrapport als een korte, zakelijke maar informele Nederlandse e-mail van consultant Dennis aan opdrachtgever ${tenant?.contact || "de opdrachtgever"}. Maximaal 180 woorden. Structuur: 1 zin stand van zaken, daarna 3-5 bullets met de belangrijkste punten (voortgang, wat ik nodig heb, risico's), afsluiten met de eerstvolgende mijlpaal. Geen em dashes gebruiken. Alleen de mailtekst teruggeven, inclusief onderwerpregel.

${base}`, 800);
      setTxt(out);
    } catch { setTxt(base + "\n\n[AI-versie mislukt; bovenstaand rapport is bruikbaar]"); }
    setBusy(false);
  }
  return (
    <Modal title="Statusrapport" close={close}>
      <div className="pre" style={{ maxHeight: 380, overflow: "auto" }}>{txt}</div>
      <div className="row" style={{ marginTop: 12, flexWrap: "wrap" }}>
        <button className="btn" onClick={() => copyText(txt)}>Kopiëren</button>
        <button className="btn ghost" onClick={() => setTxt(base)}>Ruwe versie</button>
        <button className={"btn ghost" + (busy ? " dis" : "")} onClick={() => !busy && aiMail()}>{busy ? "…" : "✦ Herschrijf als mail (AI)"}</button>
      </div>
    </Modal>
  );
}

function AnalysisModal({ p, tenant, close }) {
  const [txt, setTxt] = useState("");
  const [busy, setBusy] = useState(true);
  useEffect(() => {
    (async () => {
      try {
        const out = await askClaude(
`Je bent een ervaren certificerings-/assuranceadviseur (${p.norm}). Beoordeel op basis van onderstaande projectdata de audit-gereedheid. Antwoord in het Nederlands, beknopt, zonder em dashes, in deze structuur:

OORDEEL: één zin + rapportcijfer 1-10 voor slagingskans bij de huidige stand.
GROOTSTE GATEN: max 5 bullets, concreet.
PRIORITEITEN KOMENDE 2 WEKEN: max 5 bullets, met wie wat moet doen.
RODE VLAGGEN: alleen indien aanwezig.

Projectdata (JSON):
${JSON.stringify(projectSummaryForAI(p, tenant))}`, 1200);
        setTxt(out);
      } catch { setTxt("Analyse mislukt. Probeer het later opnieuw."); }
      setBusy(false);
    })();
  }, []);
  return (
    <Modal title={"AI-analyse: gereedheid " + p.norm} close={close}>
      {busy ? <div className="sub">Analyseren van fasen, maatregelen, documenten, bevindingen en risico's…</div> : <div className="pre" style={{ maxHeight: 420, overflow: "auto" }}>{txt}</div>}
      {!busy && (
        <div className="row" style={{ marginTop: 12 }}>
          <button className="btn" onClick={() => copyText(txt)}>Kopiëren</button>
          <button className="btn ghost" onClick={close}>Sluiten</button>
        </div>
      )}
    </Modal>
  );
}

/* ============================================================
   v4 — MIJN WEEK, PLANNING (GANTT), SNELLE UPDATE, AUDITMODUS
   ============================================================ */

function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10); }
const WD = ["zo", "ma", "di", "wo", "do", "vr", "za"];
function dayLabel(dateStr) {
  const d = new Date(dateStr);
  return WD[d.getDay()] + " " + d.getDate() + "/" + (d.getMonth() + 1);
}

/* ---------- Mijn week ---------- */

function WeekView({ state, open }) {
  const items = chaseItems(state);
  const exp = expiringItems(state, 30);
  const audits = state.projects
    .map(p => ({ p, d: daysTo(p.auditDate), tn: (state.tenants.find(t => t.id === p.tenantId) || {}).name }))
    .filter(x => x.d !== null && x.d >= 0 && x.d <= 21)
    .sort((a, b) => a.d - b.d);

  const late = items.filter(i => i.due && daysTo(i.due) < 0);
  const groups = [];
  for (let n = 0; n <= 6; n++) {
    const date = addDays(today(), n);
    const list = items.filter(i => i.due === date);
    if (list.length) groups.push({ label: n === 0 ? "Vandaag" : n === 1 ? "Morgen" : dayLabel(date), list });
  }
  const nextWeek = items.filter(i => { const dd = i.due ? daysTo(i.due) : null; return dd !== null && dd >= 7 && dd <= 14; });

  const Line = ({ i }) => (
    <div className="alertline" style={{ cursor: "pointer" }} onClick={() => open(i.proj.id)}>
      <span className="tag" style={{ background: "#EEF0EA", color: "var(--ink2)" }}>{i.kind}</span>
      <span style={{ flex: 1 }}>{i.what}</span>
      <span className="mono" style={{ fontSize: 11, color: "var(--ink2)" }}>{i.owner} · {i.tn}</span>
    </div>
  );

  return (
    <>
      <div className="h1">Mijn week</div>
      <div className="sub">Wat er deze week moet gebeuren, over alle klanten heen. Begin hier elke maandag.</div>

      {audits.length > 0 && (
        <div className="card" style={{ marginTop: 16, borderColor: "var(--amber)", padding: 0 }}>
          <div style={{ padding: "10px 14px" }}><b style={{ fontSize: 13.5 }}>Audits binnen 3 weken</b></div>
          {audits.map((a, k) => (
            <div key={k} className="alertline" style={{ cursor: "pointer" }} onClick={() => open(a.p.id)}>
              <span className="due" style={{ color: a.d <= 7 ? "var(--red)" : "var(--amber)", width: 70 }}>over {a.d}d</span>
              <span style={{ flex: 1 }}>{a.tn} · {a.p.norm} {a.p.norm === "ISAE 3402" ? "Type II" : "audit"} op {fmt(a.p.auditDate)}</span>
              <span className="mono" style={{ fontSize: 11, color: "var(--ink2)" }}>{projProgress(a.p)}% gereed</span>
            </div>
          ))}
        </div>
      )}

      {late.length > 0 && (
        <div className="card" style={{ padding: 0, borderColor: "var(--red)" }}>
          <div style={{ padding: "10px 14px" }}><b style={{ fontSize: 13.5, color: "var(--red)" }}>Te laat ({late.length}) — eerst dit najagen</b></div>
          {late.slice(0, 8).map((i, k) => <Line key={k} i={i} />)}
        </div>
      )}

      {groups.map((g, gi) => (
        <div key={gi} className="card" style={{ padding: 0 }}>
          <div style={{ padding: "10px 14px" }}><b style={{ fontSize: 13.5 }}>{g.label}</b></div>
          {g.list.map((i, k) => <Line key={k} i={i} />)}
        </div>
      ))}

      {nextWeek.length > 0 && (
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: "10px 14px" }}><b style={{ fontSize: 13.5, color: "var(--ink2)" }}>Volgende week ({nextWeek.length})</b></div>
          {nextWeek.slice(0, 6).map((i, k) => <Line key={k} i={i} />)}
        </div>
      )}

      {exp.length > 0 && (
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: "10px 14px" }}><b style={{ fontSize: 13.5 }}>Verloopt binnen 30 dagen</b></div>
          {exp.map((e, k) => (
            <div key={k} className="alertline" style={{ cursor: "pointer" }} onClick={() => open(e.proj.id)}>
              <span className="due" style={{ color: e.days < 7 ? "var(--red)" : "var(--amber)", width: 70 }}>{e.days < 0 ? "verlopen" : e.days + "d"}</span>
              <span style={{ flex: 1 }}>{e.type}: {e.name}{e.holder ? " (" + e.holder + ")" : ""}</span>
              <span className="mono" style={{ fontSize: 11, color: "var(--ink2)" }}>{e.tn}</span>
            </div>
          ))}
        </div>
      )}

      {late.length === 0 && groups.length === 0 && audits.length === 0 && nextWeek.length === 0 && exp.length === 0 && (
        <div className="empty" style={{ marginTop: 16 }}>Niets gepland deze week. Geef taken en documenten een deadline, dan vult dit overzicht zich vanzelf.</div>
      )}
    </>
  );
}

/* ---------- Planning per traject (Gantt) ---------- */

function PlanningTab({ p, mut }) {
  const phased = p.phases.filter(f => f.start && f.end);
  const allDates = [...phased.flatMap(f => [f.start, f.end]), today(), p.auditDate].filter(Boolean).sort();
  const min = allDates[0], max = allDates[allDates.length - 1];
  const span = Math.max(1, daysBetween(min, max));
  function daysBetween(a, b) { return Math.round((new Date(b) - new Date(a)) / 86400000); }
  const pos = d => Math.min(100, Math.max(0, (daysBetween(min, d) / span) * 100));

  function autoPlan() {
    mut(q => {
      const start = today();
      const end = q.auditDate && daysTo(q.auditDate) > 0 ? q.auditDate : addDays(today(), 90);
      const n = q.phases.length;
      const total = Math.max(n * 3, Math.round((new Date(end) - new Date(start)) / 86400000));
      const per = Math.floor(total / n);
      let cur = start;
      q.phases.forEach((f, i) => {
        f.start = cur;
        f.end = i === n - 1 ? end : addDays(cur, Math.max(2, per - 1));
        cur = addDays(f.end, 1);
      });
      q.log.unshift({ id: uid(), date: today(), text: "Planning automatisch gegenereerd tot " + fmt(end) });
    });
  }

  return (
    <>
      <div className="row" style={{ marginBottom: 12, flexWrap: "wrap" }}>
        <div className="sub" style={{ flex: 1, minWidth: 220 }}>Geef fasen een start- en einddatum, of laat de planning automatisch verdelen tussen vandaag en de auditdatum. Pas daarna handmatig aan.</div>
        <button className="btn sm" onClick={() => (phased.length === 0 || confirm("Bestaande fasedatums overschrijven?")) && autoPlan()}>⚙ Auto-plannen</button>
      </div>

      <div className="card">
        {p.phases.map((f, fi) => {
          const dn = f.tasks.length ? Math.round(f.tasks.filter(t => t.done).length / f.tasks.length * 100) : 0;
          const has = f.start && f.end;
          const lateBar = has && daysTo(f.end) < 0 && dn < 100;
          return (
            <div key={f.id} className="gantt-row">
              <div className="gantt-label">
                <b>{String(fi + 1).padStart(2, "0")} {f.name}</b>
                <div className="row" style={{ gap: 6, marginTop: 4 }}>
                  <input className="mini date" type="date" value={f.start} onChange={e => mut(q => { q.phases[fi].start = e.target.value; })} />
                  <input className="mini date" type="date" value={f.end} onChange={e => mut(q => { q.phases[fi].end = e.target.value; })} />
                </div>
              </div>
              <div className="gantt-lane">
                {has && (
                  <div className="gantt-bar" style={{ left: pos(f.start) + "%", width: Math.max(2, pos(f.end) - pos(f.start)) + "%", background: lateBar ? "var(--red)" : dn === 100 ? "var(--seal)" : "var(--navy)" }}
                    title={fmt(f.start) + " t/m " + fmt(f.end) + " · " + dn + "% gereed"}>
                    <i style={{ width: dn + "%" }} />
                  </div>
                )}
                <div className="gantt-today" style={{ left: pos(today()) + "%" }} title={"Vandaag " + fmt(today())} />
                {p.auditDate && <div className="gantt-audit" style={{ left: pos(p.auditDate) + "%" }} title={"Audit " + fmt(p.auditDate)} />}
              </div>
            </div>
          );
        })}
        <div className="row" style={{ marginTop: 10, gap: 16, flexWrap: "wrap" }}>
          <span className="mono" style={{ fontSize: 11, color: "var(--ink2)" }}>{fmt(min)} — {fmt(max)}</span>
          <span className="mono" style={{ fontSize: 11 }}><i style={{ display: "inline-block", width: 10, height: 10, background: "var(--ink)", borderRadius: 2, verticalAlign: -1 }} /> vandaag</span>
          {p.auditDate && <span className="mono" style={{ fontSize: 11, color: "var(--amber)" }}>▲ audit {fmt(p.auditDate)}</span>}
          <span className="mono" style={{ fontSize: 11, color: "var(--red)" }}>rood = einddatum voorbij, fase niet af</span>
        </div>
      </div>
    </>
  );
}

/* ---------- Snelle update (stoplicht) ---------- */

function buildQuickUpdate(p, tenant, kleur) {
  const emoji = kleur === "groen" ? "🟢" : kleur === "oranje" ? "🟠" : "🔴";
  const d = daysTo(p.auditDate);
  const open = chaseItems({ tenants: tenant ? [tenant] : [], projects: [p] });
  const late = open.filter(i => i.due && daysTo(i.due) < 0);
  const contact = tenant?.contact || "";
  const forSponsor = open.filter(i => contact && i.owner.toLowerCase().includes(contact.toLowerCase())).slice(0, 2);
  const next = open.filter(i => i.due && daysTo(i.due) >= 0).slice(0, 2);

  let t = `${emoji} Tussenstand ${p.norm} ${tenant ? "(" + tenant.name + ")" : ""}\n`;
  t += `Voortgang ${projProgress(p)}%${d !== null && d >= 0 ? `, ${p.norm === "ISAE 3402" ? "Type II audit" : "audit"} over ${d} dagen` : ""}.\n\n`;
  if (kleur === "groen") t += "We liggen op schema.\n";
  if (kleur === "oranje") t += "Op schema, maar een paar punten vragen aandacht.\n";
  if (kleur === "rood") t += "We lopen achter; ingrijpen nodig om de planning te halen.\n";
  if (late.length) t += `\nAandachtspunt${late.length > 1 ? "en" : ""}:\n` + late.slice(0, 3).map(i => `· ${i.what} (${i.owner}, ${-daysTo(i.due)}d te laat)`).join("\n") + "\n";
  if (next.length) t += `\nEerstvolgende stappen:\n` + next.map(i => `· ${i.what}${i.due ? " — " + fmt(i.due) : ""}`).join("\n") + "\n";
  if (forSponsor.length) t += `\nVan jou nodig:\n` + forSponsor.map(i => `· ${i.what}${i.due ? " — vóór " + fmt(i.due) : ""}`).join("\n") + "\n";
  t += `\nVragen? Bel gerust.\nDennis`;
  return t;
}

function QuickUpdateModal({ p, tenant, close }) {
  const [kleur, setKleur] = useState("groen");
  const [txt, setTxt] = useState(buildQuickUpdate(p, tenant, "groen"));
  const [copied, setCopied] = useState(false);
  function pick(k) { setKleur(k); setTxt(buildQuickUpdate(p, tenant, k)); setCopied(false); }
  return (
    <Modal title="Snelle update naar opdrachtgever" close={close}>
      <div className="sub" style={{ marginBottom: 10 }}>Kies de kleur, pas eventueel de tekst aan en kopieer naar WhatsApp of mail. Klaar in 30 seconden.</div>
      <div className="row" style={{ marginBottom: 10 }}>
        {[["groen", "🟢 Op schema"], ["oranje", "🟠 Aandacht"], ["rood", "🔴 Achterstand"]].map(([k, l]) => (
          <button key={k} className={"btn sm " + (kleur === k ? "" : "ghost")} onClick={() => pick(k)}>{l}</button>
        ))}
      </div>
      <textarea rows={13} value={txt} onChange={e => { setTxt(e.target.value); setCopied(false); }} style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 12.5 }} />
      <div className="row" style={{ marginTop: 12 }}>
        <button className="btn" onClick={() => { copyText(txt); setCopied(true); }}>{copied ? "✓ Gekopieerd" : "Kopiëren"}</button>
        <button className="btn ghost" onClick={close}>Sluiten</button>
      </div>
    </Modal>
  );
}

/* ---------- Auditmodus ---------- */

function nowTime() { return new Date().toTimeString().slice(0, 5); }

function AuditModeView({ p, tenant, mut, exit }) {
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState(null);
  const [capture, setCapture] = useState("");
  const [capMode, setCapMode] = useState("note"); // note | finding
  const [flash, setFlash] = useState("");

  const ql = q.toLowerCase();
  const ctrls = p.controls.filter(c => !ql || (c.code + " " + c.name + " " + c.desc + " " + c.note).toLowerCase().includes(ql));
  const docs = (p.docs || []).filter(dd => ql && (dd.name + " " + dd.link).toLowerCase().includes(ql));
  const todayLog = (p.log || []).filter(l => l.date === today());

  function save() {
    const text = capture.trim();
    if (!text) return;
    mut(qq => {
      if (capMode === "finding") {
        qq.findings.unshift({ id: uid(), desc: text, source: "Externe audit", severity: "Minor", due: "", status: 0, owner: "", note: "" });
        qq.log.unshift({ id: uid(), date: today(), text: nowTime() + " · Bevinding auditor: " + text });
      } else {
        qq.log.unshift({ id: uid(), date: today(), text: nowTime() + " · " + text });
      }
    });
    setCapture("");
    setFlash(capMode === "finding" ? "Bevinding vastgelegd" : "Notitie vastgelegd");
    setTimeout(() => setFlash(""), 1600);
  }

  return (
    <div className="auditwrap">
      <div className="row" style={{ flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div className="h1" style={{ color: "var(--amber)" }}>● Auditmodus</div>
          <div className="sub">{tenant ? tenant.name : ""} · {p.norm} · {fmt(today())}{p.ci ? " · " + p.ci : ""}</div>
        </div>
        <button className="btn sm ghost" onClick={exit}>✕ Auditmodus sluiten</button>
      </div>

      <div className="card" style={{ marginTop: 14, position: "sticky", top: 8, zIndex: 5, borderColor: "var(--amber)" }}>
        <input placeholder="Zoek maatregel, bewijs of document… (auditor vraagt iets → typ hier)" value={q} onChange={e => setQ(e.target.value)} style={{ fontSize: 15, padding: "11px 13px" }} autoFocus />
        <div className="row" style={{ marginTop: 10, flexWrap: "wrap", gap: 8 }}>
          <select className="mini" style={{ width: 110 }} value={capMode} onChange={e => setCapMode(e.target.value)}>
            <option value="note">Notitie</option>
            <option value="finding">Bevinding</option>
          </select>
          <input className="mini" style={{ flex: 1, minWidth: 180 }} placeholder={capMode === "finding" ? "Bevinding van de auditor…" : "Snelle notitie (vraag, toezegging, opmerking)…"}
            value={capture} onChange={e => setCapture(e.target.value)} onKeyDown={e => e.key === "Enter" && save()} />
          <button className={"btn sm" + (capture.trim() ? "" : " dis")} onClick={save}>＋ {nowTime()}</button>
          {flash && <span className="tag">{flash}</span>}
        </div>
      </div>

      {docs.length > 0 && (
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: "10px 14px" }}><b style={{ fontSize: 13 }}>Documenten ({docs.length})</b></div>
          {docs.map(dd => (
            <div key={dd.id} className="alertline">
              <span className="stamp" style={{ color: DOC_COLOR[dd.status] }}>{DOC_STATUS[dd.status]}</span>
              <span style={{ flex: 1 }}>{dd.name}</span>
              {dd.link && <a className="linkchip" href={dd.link.startsWith("http") ? dd.link : "https://" + dd.link} target="_blank" rel="noreferrer">↗ openen</a>}
            </div>
          ))}
        </div>
      )}

      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: "10px 14px" }}><b style={{ fontSize: 13 }}>Maatregelen ({ctrls.length})</b><span className="sub" style={{ display: "inline", marginLeft: 8 }}>klik voor spiekbrief + vindplaats</span></div>
        {ctrls.map(c => {
          const g = GUIDE[c.code];
          const open = openId === c.id;
          return (
            <div key={c.id} className="ctrl" style={{ cursor: "pointer" }} onClick={() => setOpenId(open ? null : c.id)}>
              <div className="ctrl-head">
                <span className="code">{c.code}</span>
                <div>
                  <b>{c.name}</b>
                  <small>{c.note ? "Vindplaats: " + c.note : c.desc}</small>
                  {c.link && <div><a className="linkchip" style={{ marginTop: 5, display: "inline-block" }} href={c.link.startsWith("http") ? c.link : "https://" + c.link} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}>↗ bewijs openen</a></div>}
                </div>
                <div style={{ textAlign: "right" }}>
                  <span className="stamp" style={{ color: CTRL_COLOR[c.status] }}>{CTRL_STATUS[c.status]}</span>
                </div>
              </div>
              {open && g && (
                <div className="guide" onClick={e => e.stopPropagation()}>
                  <h5>In één zin</h5><div>{g.u}</div>
                  <h5>Auditor verwacht</h5><ul>{g.v.map((x, i) => <li key={i}>{x}</li>)}</ul>
                  <h5>Bewijs</h5><ul>{g.b.map((x, i) => <li key={i}>{x}</li>)}</ul>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: "10px 14px" }}><b style={{ fontSize: 13 }}>Logboek van vandaag ({todayLog.length})</b></div>
        {todayLog.length === 0 && <div className="sub" style={{ padding: "0 14px 12px" }}>Nog niets vastgelegd. Alles wat je hierboven invoert komt hier met tijdstempel.</div>}
        {todayLog.map(l => (
          <div key={l.id} className="alertline"><span style={{ flex: 1, fontSize: 13 }}>{l.text}</span></div>
        ))}
      </div>
    </div>
  );
}
