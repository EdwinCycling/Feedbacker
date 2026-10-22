import type { Language } from './i18n';

export const meetingSumUrl = 'https://meetingsum.netlify.app/';

export function summaryInstruction(language: Language): string {
  return language === 'nl'
    ? `Aanvullende instructie voor een vergelijkbare Feedbacker-samenvatting

Gebruik de geselecteerde MeetingSum-secties. Behoud het verplichte metadata-blok met exact de veldnamen Datum, Deelnemers, Tags en Executive Summary. Gebruik voor Datum JJJJ-MM-DD; neem een datum alleen over als die bekend is.

Vermeld in Meeting Details op aparte regels:
Klant: [vaste klantnaam of goedgekeurde klantcode]
Product: [vaste product- of modulenaam]
Datum: [JJJJ-MM-DD of Onbekend]
Onderwerp: [onderwerp van deze sessie]

Gebruik de secties Executive Summary, Meeting Details, Hoofdpunten (discussie) en Actiepunten. Schrijf onder Hoofdpunten (discussie) genummerde onderwerpen als "1. Korte, herkenbare titel". Neem per onderwerp de waargenomen klantbehoefte, concrete onderbouwing en indien genoemd "Gewenste verbetering:" op. Houd aanvullende beslissingen, risico's en citaten in aparte secties buiten de genummerde discussiepunten.

Gebruik dezelfde productnamen, tags, taal en formuleringen voor vergelijkbare onderwerpen in alle sessies. MeetingSum-tags gelden voor de hele sessie; Feedbacker neemt ze mee als onderwerpen bij de feedbackpunten.

Onderscheid feedback van de klant van voorstellen van de interviewer. Scheid observaties, wensen en daadwerkelijk genomen besluiten. Gebruik alleen informatie uit de bron, verzin geen citaten en markeer ontbrekende informatie als Onbekend. Laat AI geen sentiment, prioriteit of consensus als feit presenteren.

Controleer de samenvatting tegen het transcript. Bewaar één resultaat per sessie als .md, .txt of .docx. Gebruik alleen de door je organisatie goedgekeurde AI-omgeving en privacymaatregelen.`
    : `Additional instruction for comparable Feedbacker summaries

Use the selected MeetingSum sections. Preserve its mandatory metadata block with the exact field names Datum, Deelnemers, Tags and Executive Summary. Use YYYY-MM-DD for Datum and only report a date when known. Do not translate these metadata field names.

In Meeting Details, include these fields on separate lines:
Customer: [consistent customer name or approved identifier]
Product: [consistent product or module name]
Date: [YYYY-MM-DD or Unknown]
Subject: [session subject]

Use Executive Summary, Meeting Details, Key Points (Discussion) and Action Items. Under Key Points (Discussion), use numbered topics such as "1. Short, recognizable title". For each topic, include the observed customer need, concrete evidence and, if stated, "Requested improvement:". Keep additional decisions, risks and quotes in separate sections outside the numbered discussion points.

Use consistent product names, tags, language and topic wording across sessions. MeetingSum tags apply to the entire session; Feedbacker adds them as topics to its feedback items.

Distinguish customer feedback from interviewer suggestions. Separate observations, requests and actual decisions. Use only source information, do not invent quotes, and mark missing information as Unknown. Do not present AI-inferred sentiment, priority or consensus as fact.

Review the summary against the transcript. Save one result per session as .md, .txt or .docx. Use only your organization's approved AI environment and privacy safeguards.`;
}
