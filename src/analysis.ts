import type { Feedback, Sentiment, Source } from './shared';

export function hash(value: string) {
  let a = 0x811c9dc5, b = 0x9e3779b9;
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    a = Math.imul(a ^ code, 0x01000193);
    b = Math.imul(b ^ code, 0x5bd1e995);
    b ^= b >>> 15;
  }
  a = Math.imul(a ^ (a >>> 16), 0x85ebca6b) ^ Math.imul(b ^ (b >>> 13), 0xc2b2ae35);
  b = Math.imul(b ^ (b >>> 16), 0x85ebca6b) ^ Math.imul(a ^ (a >>> 13), 0xc2b2ae35);
  return (a >>> 0).toString(16).padStart(8, '0') + (b >>> 0).toString(16).padStart(8, '0');
}

const monthNames = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'];

export function extractDate(text: string): string {
  const iso = text.match(/(?:Datum|Date):\s*(\d{4}-\d{2}-\d{2})/i);
  const validDate = (value: string) => {
    const parsed = new Date(value);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value ? value : '';
  };
  if (iso) return validDate(iso[1]);
  const match = text.match(/(?:Datum|Date):\s*(\d{1,2})\s+([a-z]+)\s+(\d{4})/i);
  if (!match) return '';
  const month = monthNames.indexOf(match[2].toLowerCase());
  return month < 0 ? '' : validDate(`${match[3]}-${String(month + 1).padStart(2, '0')}-${match[1].padStart(2, '0')}`);
}

const topicRules: [string, RegExp][] = [
  ['Selection & filtering', /select|filter|afdeling|medewerkerstype|department|employee type/i],
  ['Workflow & status', /status|flow|afrond|proces|goedkeur|akkoord|indien|approv|submit|submission/i],
  ['Questions & ratings', /vraag|schaal|score|beoordeling|terugblik|question|rating|assessment/i],
  ['Reporting & history', /overzicht|historie|export|rapport|dashboard|report|history|overview/i],
  ['Clarity & usability', /duidelijk|terminologie|uitleg|benaming|begrijp|clarity|usability|terminology|explanation|confus/i],
  ['Notifications', /herinner|melding|notificatie|notification|reminder/i],
  ['Roles & access', /rol|rechten|vertrouwelijk|autorisatie|permission|confidential|access/i],
  ['Planning', /datum|datums|periode|looptijd|planning|schedule|date|period/i],
];

export function classify(text: string): { topics: string[]; sentiment: Sentiment } {
  const negative = (text.match(/\b(?:onduidelijk\w*|onvoldoende|onpraktisch|risico\w*|knelpunt\w*|verwarring|fout\w*|ontbreekt|beperkt\w*|verbeter\w*|niet duidelijk|unclear|confusing|missing|issue\w*|problem\w*|improve\w*)\b/gi) ?? []).length;
  const positiveText = text.replace(/\b(?:niet|onvoldoende)\s+(?:duidelijk|logisch|bruikbaar|werkbaar)\b/gi, '');
  const positive = (positiveText.match(/\b(?:duidelijk|logisch|bruikbaar|werkbaar|waardevol|positief|goed begrepen|useful|clear|intuitive|helpful|positive)\b/gi) ?? []).length;
  return {
    topics: topicRules.filter(([, rule]) => rule.test(text)).map(([name]) => name).slice(0, 3),
    sentiment: negative > 0 ? (positive > 0 ? 'Mixed' : 'Needs attention') : positive > 0 ? 'Positive' : 'Neutral',
  };
}

function headingText(line: string) {
  return line.replace(/^\d+[.)]\s+/, '').replace(/:$/, '');
}

function isSectionHeading(line: string) {
  return /^(?:Meeting Details|Executive Summary|Samenvatting|Doel van de meeting|Meeting (?:purpose|goal)|Purpose of the meeting|Hoofdpunten(?:\s*\(discussie\))?|(?:Main|Key) points(?:\s*\(discussion\))?|Discussion points|Key discussion points|Genomen beslissingen|Decisions(?: made)?|Actiepunten|Action items|Parkeerplaats(?: en vervolgstappen)?|Parking lot(?: (?:and|&) next steps)?|Slotzin|Closing (?:sentence|statement)|Punten voor verbetering|Areas for improvement|Punten die goed gingen|What went well|Sentiment en sfeer|Sentiment (?:and|&) atmosphere|Risico.s en knelpunten|Risks (?:and bottlenecks|& issues)|Kernwoorden\s*\/\s*tags|Keywords\s*\/\s*tags|Belangrijke citaten|Key quotes|Important quotes|Verbeteringen.*|Conclusie.*|Conclusions?|Sfeer|Citaten|Vervolgstappen|Recommendations|Next steps)$/i.test(headingText(line));
}

export function parseDocument(filename: string, rawText: string, modifiedAt: string): { source: Source; feedback: Feedback[] } {
  const originalLines = rawText.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const lines = originalLines.map(line => line.replace(/^#{1,6}\s+/, '').replace(/\*\*([^*]+)\*\*/g, '$1').replace(/^[-*]\s+(?=(?:Datum|Date|Klant|Customer|Product|Onderwerp|Subject|Tags|Executive Summary):)/i, ''));
  if (!lines.length) throw new Error('Document contains no readable text.');
  const text = lines.join('\n');
  const sourceId = hash(filename);
  const field = (pattern: string) => lines.map(line => line.match(new RegExp(`^(?:${pattern}):\\s*(.+)$`, 'i'))?.[1]).find(Boolean);
  const known = (value: string | undefined) => value && !/^(Onbekend|Unknown|Niet vermeld|Not specified)$/i.test(value) ? value : undefined;
  const customer = known(field('Klant|Customer')) ?? filename.split(/[\\/]/).at(-1)!.replace(/\.(docx|md|txt)$/i, '').replace(/^\[Summary\]\s*/i, '').split(/\s+-\s+Interview/i)[0].trim();
  const product = known(field('Product')) ?? (field('Onderwerp|Subject') ?? 'Unclassified').replace(/^Interviewsessie over de module voor /i, '');
  const metadataStart = lines.findIndex(line => /^\[METADATA START\]$/i.test(line));
  const metadataEnd = lines.findIndex((line, index) => index > metadataStart && /^\[METADATA (?:EINDE|END)\]$/i.test(line));
  if (metadataStart >= 0 && metadataEnd < 0) throw new Error('Incomplete MeetingSum metadata block: missing [METADATA EINDE].');
  const metadata = metadataStart >= 0 ? lines.slice(metadataStart + 1, metadataEnd) : [];
  const summaryField = metadata.findIndex(line => /^Executive Summary:/i.test(line));
  const metadataSummary = summaryField >= 0 ? metadata.slice(summaryField).join(' ').replace(/^Executive Summary:\s*/i, '') : '';
  const tags = [...new Set((metadata.find(line => /^Tags:/i.test(line))?.replace(/^Tags:\s*/i, '') ?? '').split(/[,;]/).map(tag => known(tag.trim())).filter((tag): tag is string => Boolean(tag)))];
  const summaryIndex = lines.findIndex(line => /^(Executive Summary|Samenvatting)$/i.test(headingText(line)));
  const summaryLines = summaryIndex >= 0 ? lines.slice(summaryIndex + 1) : [];
  const summaryEnd = summaryLines.findIndex(isSectionHeading);
  const summary = known(metadataSummary) ?? (summaryEnd >= 0 ? summaryLines.slice(0, summaryEnd) : summaryLines).join(' ');
  const source: Source = {
    id: sourceId, filename, customer, product,
    date: extractDate(text), text: originalLines.join('\n'), modifiedAt, tags,
    summary: summary || lines.slice(0, 3).join(' '),
  };
  const start = lines.findIndex(line => /^(Hoofdpunten|(?:Main|Key) points|Discussion points|Key discussion points)/i.test(headingText(line)));
  const sectionLines = start >= 0 ? lines.slice(start + 1) : lines;
  const stop = sectionLines.findIndex(isSectionHeading);
  const body = stop >= 0 ? sectionLines.slice(0, stop) : sectionLines;
  const headings = body.map((line, index) => ({ line, index })).filter(({ line }) => /^\d+[.)]\s+\S/.test(line));
  const chunks = headings.length ? headings.map((heading, i) => ({
    title: heading.line.replace(/^\d+[.)]\s+/, ''),
    evidence: body.slice(heading.index + 1, headings[i + 1]?.index ?? body.length).join('\n'),
  })) : [{ title: source.summary.slice(0, 100), evidence: text }];
  const occurrences = new Map<string, number>();
  const feedback = chunks.map(({ title, evidence }): Feedback => {
    const duplicate = occurrences.get(title) ?? 0;
    occurrences.set(title, duplicate + 1);
    const action = evidence.split('\n').find(line => /^(Gewenste verbetering|Actiepunt|Vastgestelde behoefte|Strategische uitkomst|Belangrijk knelpunt|Belangrijk risico|Requested improvement|Action item|Identified need|Strategic outcome):/i.test(line));
    const analysis = classify(`${title}\n${evidence}`);
    return {
      id: hash(`${sourceId}:${title}:${duplicate}`), sourceId, title,
      customer, product, date: source.date, ...analysis, topics: [...new Set([...analysis.topics, ...tags])],
      priority: 'Medium', status: 'New', notes: '',
      excerpt: action ?? evidence.split('\n').slice(0, 2).join(' '),
      evidence,
    };
  });
  return { source, feedback };
}
