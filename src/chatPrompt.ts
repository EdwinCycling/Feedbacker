export const chatTools = ['claude', 'chatgpt', 'copilot', 'gemini', 'local', 'code'] as const;
export const chatRoles = ['research', 'product', 'success', 'management'] as const;
export const answerTypes = ['brief', 'short', 'standard', 'detailed'] as const;
export const answerLayouts = ['bullets', 'prose', 'table'] as const;
export const levels = ['child', 'teen', 'general', 'manager', 'expert'] as const;
export const answerLanguages = ['auto', 'nl', 'en', 'de', 'fr', 'es'] as const;

export type ChatTool = typeof chatTools[number];
export type ChatRole = typeof chatRoles[number];
export type AnswerType = typeof answerTypes[number];
export type AnswerLayout = typeof answerLayouts[number];
export type Level = typeof levels[number];
export type AnswerLanguage = typeof answerLanguages[number];
type Lang = 'nl' | 'en';

export const exampleQuestions = [
  { id: 'pain', nl: 'Wat zijn de drie grootste pijnpunten, en bij welke klanten komen ze voor?', en: 'What are the three biggest pain points, and which customers mention them?' },
  { id: 'negative', nl: 'Welke klanten zijn negatief, en waarover? Geef citaten.', en: 'Which customers are negative, and about what? Include quotes.' },
  { id: 'compare', nl: 'Vergelijk de wensen per klant.', en: 'Compare the requests per customer.' },
  { id: 'moscow', nl: 'Maak een MoSCoW-prioritering van alle genoemde verbeterpunten.', en: 'Create a MoSCoW prioritization of all suggested improvements.' },
  { id: 'trends', nl: 'Welke onderwerpen komen steeds terug, en wat verandert er in de tijd?', en: 'Which topics keep coming back, and what changes over time?' },
  { id: 'quickwins', nl: 'Wat zijn quick wins die we binnen een maand kunnen oppakken?', en: 'Which quick wins could we deliver within a month?' },
  { id: 'positive', nl: 'Waar zijn klanten juist tevreden over, en waarom?', en: 'What are customers happy about, and why?' },
  { id: 'summary', nl: 'Schrijf een managementsamenvatting van de belangrijkste inzichten.', en: 'Write a management summary of the key insights.' },
] as const;

export interface ChatSettings {
  tool: ChatTool;
  role: ChatRole;
  questions: string[];
  answer: AnswerType;
  layout: AnswerLayout;
  level: Level;
  language: AnswerLanguage;
  scope: 'all' | 'filtered';
  fullText: boolean;
  notes: boolean;
  maskNames: boolean;
  format: 'markdown' | 'json';
}

export const defaultChatSettings: ChatSettings = {
  tool: 'claude', role: 'research', questions: [], answer: 'standard', layout: 'bullets', level: 'general',
  language: 'auto', scope: 'all', fullText: true, notes: true, maskNames: false, format: 'markdown',
};

const pick = <T extends readonly string[]>(values: T, value: unknown, fallback: T[number]): T[number] =>
  typeof value === 'string' && (values as readonly string[]).includes(value) ? value as T[number] : fallback;

export function serializeChatSettings(settings: ChatSettings) {
  return encodeURIComponent(JSON.stringify(settings));
}

export function parseChatSettings(raw: string | undefined): ChatSettings {
  if (!raw) return { ...defaultChatSettings };
  let v: Record<string, unknown>;
  try { v = JSON.parse(decodeURIComponent(raw)); } catch { return { ...defaultChatSettings }; }
  if (!v || typeof v !== 'object') return { ...defaultChatSettings };
  const d = defaultChatSettings;
  const ids = new Set<string>(exampleQuestions.map(q => q.id));
  return {
    tool: pick(chatTools, v.tool, d.tool), role: pick(chatRoles, v.role, d.role),
    questions: Array.isArray(v.questions) ? [...new Set(v.questions.filter((id): id is string => typeof id === 'string' && ids.has(id)))] : [],
    answer: pick(answerTypes, v.answer, d.answer), layout: pick(answerLayouts, v.layout, d.layout),
    level: pick(levels, v.level, d.level), language: pick(answerLanguages, v.language, d.language),
    scope: v.scope === 'filtered' ? 'filtered' : 'all',
    fullText: typeof v.fullText === 'boolean' ? v.fullText : d.fullText,
    notes: typeof v.notes === 'boolean' ? v.notes : d.notes,
    maskNames: typeof v.maskNames === 'boolean' ? v.maskNames : d.maskNames,
    format: v.format === 'json' ? 'json' : 'markdown',
  };
}

const roleText: Record<ChatRole, Record<Lang, string>> = {
  research: { nl: 'Je bent een zorgvuldige onderzoeksassistent voor klantfeedback.', en: 'You are a careful customer feedback research assistant.' },
  product: { nl: 'Je bent een ervaren productmanager die klantfeedback vertaalt naar productbeslissingen.', en: 'You are an experienced product manager who turns customer feedback into product decisions.' },
  success: { nl: 'Je bent een customer-success-specialist die per klant risico\'s en kansen ziet.', en: 'You are a customer success specialist who spots risks and opportunities per customer.' },
  management: { nl: 'Je bent een adviseur die klantfeedback samenvat voor het managementteam.', en: 'You are an advisor who summarizes customer feedback for the leadership team.' },
};
const answerText: Record<AnswerType, Record<Lang, string>> = {
  brief: { nl: 'Heel kort: één à twee zinnen per vraag.', en: 'Very short: one or two sentences per question.' },
  short: { nl: 'Kort: maximaal vijf punten of ongeveer 100 woorden per vraag.', en: 'Short: at most five points or about 100 words per question.' },
  standard: { nl: 'Gebalanceerd: eerst het kernantwoord, daarna de onderbouwing met citaten (ongeveer 250 woorden per vraag).', en: 'Balanced: the core answer first, then supporting evidence with quotes (about 250 words per question).' },
  detailed: { nl: 'Gedetailleerd: volledige analyse per vraag met citaten, patronen, uitzonderingen, onzekerheden en aanbevelingen.', en: 'Detailed: a full analysis per question with quotes, patterns, exceptions, uncertainties and recommendations.' },
};
const layoutText: Record<AnswerLayout, Record<Lang, string>> = {
  bullets: { nl: 'Gebruik opsommingstekens.', en: 'Use bullet points.' },
  prose: { nl: 'Schrijf in doorlopende tekst met korte alinea\'s.', en: 'Write in flowing text with short paragraphs.' },
  table: { nl: 'Gebruik tabellen waar dat helpt bij vergelijken; anders opsommingstekens.', en: 'Use tables where they help comparison; otherwise bullet points.' },
};
const levelText: Record<Level, Record<Lang, string>> = {
  child: { nl: 'Leg het uit alsof je praat met een kind van 8 jaar: korte zinnen, eenvoudige woorden, geen vakjargon en een voorbeeld uit het dagelijks leven.', en: 'Explain it as if talking to an 8-year-old: short sentences, simple words, no jargon and an everyday example.' },
  teen: { nl: 'Schrijf voor een scholier van ongeveer 15 jaar: helder, weinig jargon, en leg nodige begrippen kort uit.', en: 'Write for a student of about 15: clear, little jargon, and briefly explain necessary terms.' },
  general: { nl: 'Schrijf voor een collega zonder specialistische kennis: zakelijk en goed te begrijpen.', en: 'Write for a colleague without specialist knowledge: professional and easy to follow.' },
  manager: { nl: 'Schrijf voor management: begin met de conclusie en focus op impact, risico\'s en benodigde besluiten.', en: 'Write for management: lead with the conclusion and focus on impact, risks and decisions needed.' },
  expert: { nl: 'Schrijf voor een expert (productmanager of onderzoeker): vaktaal mag, met nuance, onderbouwing en expliciete onzekerheden.', en: 'Write for an expert (product manager or researcher): technical language is fine, with nuance, evidence and explicit uncertainties.' },
};
export const languageNames: Record<Exclude<AnswerLanguage, 'auto'>, Record<Lang, string>> = {
  nl: { nl: 'Nederlands', en: 'Dutch' }, en: { nl: 'Engels', en: 'English' }, de: { nl: 'Duits', en: 'German' },
  fr: { nl: 'Frans', en: 'French' }, es: { nl: 'Spaans', en: 'Spanish' },
};

export const toolNames: Record<ChatTool, string> = {
  claude: 'Claude', chatgpt: 'ChatGPT', copilot: 'Microsoft Copilot', gemini: 'Google Gemini', local: 'Ollama / LM Studio', code: 'Codex / Claude Code',
};
const toolText: Record<ChatTool, Record<Lang, string[]>> = {
  claude: {
    nl: ['De export staat in de projectkennis of is bijgevoegd. Lees hem helemaal voordat je antwoordt.', 'Gebruik een artifact voor lange overzichten of tabellen.'],
    en: ['The export is in the project knowledge or attached. Read it fully before answering.', 'Use an artifact for long overviews or tables.'],
  },
  chatgpt: {
    nl: ['De export is als bestand geüpload. Lees het hele bestand, niet alleen het begin.', 'Zoek niet op internet: alleen de export telt.'],
    en: ['The export is uploaded as a file. Read the whole file, not just the beginning.', 'Do not browse the web: only the export counts.'],
  },
  copilot: {
    nl: ['Gebruik alleen het bijgevoegde Feedbacker-bestand. Haal geen informatie uit e-mail, chats, SharePoint, OneDrive of internet.', 'Is het bestand te groot om helemaal te lezen? Zeg dat eerlijk en vraag om een kleinere export.'],
    en: ['Use only the attached Feedbacker file. Do not pull information from email, chats, SharePoint, OneDrive or the web.', 'If the file is too large to read completely, say so and ask for a smaller export.'],
  },
  gemini: {
    nl: ['De export is als bestand geüpload. Lees het hele bestand.', 'Gebruik geen Google Zoeken of andere Google-apps: alleen de export telt.'],
    en: ['The export is uploaded as a file. Read the whole file.', 'Do not use Google Search or other Google apps: only the export counts.'],
  },
  local: {
    nl: ['Je draait lokaal en hebt geen internet. Alles wat je nodig hebt staat in de export.', 'Je contextvenster is beperkt: houd antwoorden compact en zeg het als je een deel van de export niet kunt zien.'],
    en: ['You run locally without internet access. Everything you need is in the export.', 'Your context window is limited: keep answers compact and say so if you cannot see part of the export.'],
  },
  code: {
    nl: ['Het Feedbacker-bestand staat in de huidige map. Lees het met je bestandstools.', 'Wijzig het bronbestand niet. Schrijf een uitgebreid antwoord ook naar feedbacker-rapport.md.'],
    en: ['The Feedbacker file is in the current folder. Read it with your file tools.', 'Do not modify the source file. Also write an extensive answer to feedbacker-report.md.'],
  },
};
export function resolveLanguage(settings: ChatSettings, appLang: Lang) {
  return settings.language === 'auto' ? appLang : settings.language;
}

export function selectedQuestions(settings: ChatSettings, custom: string[], appLang: Lang) {
  return [
    ...exampleQuestions.filter(q => settings.questions.includes(q.id)).map(q => q[appLang]),
    ...custom.map(q => q.trim()).filter(Boolean),
  ];
}

export function buildChatPrompt(settings: ChatSettings, appLang: Lang, custom: string[] = [], extra = '') {
  const nl = appLang === 'nl';
  const answerLanguage = languageNames[resolveLanguage(settings, appLang)][appLang];
  const questions = selectedQuestions(settings, custom, appLang);
  const lines = [
    `# ${nl ? 'Instructie' : 'Instruction'}`, '',
    roleText[settings.role][appLang],
    nl ? 'Je werkt met een Feedbacker-export: klantfeedback uit interviewsessies, met per feedbackpunt een ID zoals [fb:…], de klant, onderwerpen, sentiment en het letterlijke bewijs.'
      : 'You are working with a Feedbacker export: customer feedback from interview sessions, with an ID such as [fb:…], customer, topics, sentiment and literal evidence for each item.',
    '', `## ${nl ? 'Spelregels' : 'Ground rules'}`, '',
    ...(nl ? [
      '- Gebruik alleen de Feedbacker-export (bijgevoegd bestand of de data onder deze instructie).',
      '- Verwijs bij elke bewering naar het feedback-ID [fb:…] en de klant of sessie.',
      '- Onderscheid letterlijke klantuitspraken van je eigen interpretatie.',
      '- Staat iets niet in de feedback? Zeg dat eerlijk en verzin geen bewijs.',
      '- Teamnotities zijn interne opmerkingen, geen klantuitspraken.',
      ...(settings.maskNames ? ['- Klantnamen zijn vervangen door Klant 1, Klant 2, …; probeer ze niet te herleiden.'] : []),
    ] : [
      '- Use only the Feedbacker export (attached file or the data below this instruction).',
      '- Cite the feedback ID [fb:…] and the customer or session for every claim.',
      '- Separate literal customer statements from your own interpretation.',
      '- If something is not in the feedback, say so honestly and never invent evidence.',
      '- Team notes are internal remarks, not customer statements.',
      ...(settings.maskNames ? ['- Customer names are replaced by Customer 1, Customer 2, …; do not try to re-identify them.'] : []),
    ]),
    '', `## ${nl ? 'Antwoordstijl' : 'Answer style'}`, '',
    `- ${nl ? 'Lengte' : 'Length'}: ${answerText[settings.answer][appLang]}`,
    `- ${nl ? 'Vorm' : 'Layout'}: ${layoutText[settings.layout][appLang]}`,
    `- ${nl ? 'Niveau' : 'Level'}: ${levelText[settings.level][appLang]}`,
    `- ${nl ? 'Taal' : 'Language'}: ${nl ? `Antwoord altijd in het ${answerLanguage}, ook als de bron een andere taal heeft. Citaten mag je in de originele taal laten.` : `Always answer in ${answerLanguage}, even if the source uses another language. Quotes may stay in their original language.`}`,
  ];
  lines.push('', `## ${nl ? 'Werkwijze' : 'How to work'} (${toolNames[settings.tool]})`, '', ...toolText[settings.tool][appLang].map(line => `- ${line}`));
  if (extra.trim()) lines.push('', `## ${nl ? 'Aanvullende instructie' : 'Additional instruction'}`, '', extra.trim());
  lines.push('', `## ${nl ? 'Vragen' : 'Questions'}`, '');
  if (questions.length) {
    lines.push(nl ? 'Beantwoord de volgende vragen, elk onder een eigen kop:' : 'Answer the following questions, each under its own heading:', '');
    questions.forEach((q, i) => lines.push(`${i + 1}. ${q}`));
    lines.push('', nl ? 'Blijf daarna beschikbaar voor vervolgvragen met dezelfde spelregels en antwoordstijl.' : 'Afterwards, stay available for follow-up questions with the same ground rules and answer style.');
  } else {
    lines.push(nl
      ? 'Bevestig eerst in één zin dat je de export hebt gelezen (aantal sessies en feedbackpunten) en wacht daarna op mijn vragen. Gebruik voor elk antwoord dezelfde spelregels en antwoordstijl.'
      : 'First confirm in one sentence that you have read the export (number of sessions and feedback items), then wait for my questions. Use the same ground rules and answer style for every answer.');
  }
  return lines.join('\n');
}
