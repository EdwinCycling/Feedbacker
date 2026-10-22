import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ArrowDownToLine, ArrowLeft, ArrowRight, Baby, Bot, Briefcase, Building2, HardDrive, Sparkle, SquareTerminal, Check, Copy, FilePlus2, GraduationCap, HeartHandshake, Languages, LayoutList, Lightbulb, MessageSquarePlus, Microscope, Plus, RotateCcw, Ruler, Search, ShieldCheck, Target, Users, X } from 'lucide-react';
import type { Feedback, Source } from './shared';
import type { Language } from './i18n';
import { buildAiExport } from './aiExport';
import { answerLanguages, answerLayouts, answerTypes, buildChatPrompt, chatRoles, chatTools, defaultChatSettings, exampleQuestions, languageNames, levels, parseChatSettings, resolveLanguage, selectedQuestions, serializeChatSettings, type ChatSettings, type ChatTool } from './chatPrompt';

const toolIcons: Record<ChatTool, ReactNode> = { claude: <Bot size={18} />, chatgpt: <MessageSquarePlus size={18} />, copilot: <Building2 size={18} />, gemini: <Sparkle size={18} />, local: <HardDrive size={18} />, code: <SquareTerminal size={18} /> };
import { deleteCookie, readCookie, writeCookie } from './preferences';

const COOKIE = 'feedbacker-chat';

export const aiExportCopy = {
  nl: {
    nav: 'Chat met je feedback',
    title: 'Praat met je feedback in je favoriete AI.',
    intro: 'Stel in zeven korte stappen je prompt samen. Je krijgt een kant-en-klare instructie plus een databestand voor je AI-tool, met verwijzingen naar de bron.',
    local: 'Alles wordt in je browser gemaakt. Feedbacker stuurt niets naar een AI-dienst; jij bepaalt waar de prompt en het bestand heen gaan.',
    steps: ['Instructie', 'Vragen', 'Antwoord', 'Niveau', 'Taal', 'Bron', 'Prompt'],
    heads: [
      ['Welke AI gebruik je, en welke rol krijgt hij?', 'Kies je tool en de rol die de AI aanneemt. Een extra instructie is optioneel.'],
      ['Welke vragen wil je stellen?', 'Kies voorbeeldvragen of schrijf je eigen vragen. Geen vragen mag ook: dan wacht de AI op je vragen in de chat.'],
      ['Hoe uitgebreid moet het antwoord zijn?', 'Van één zin tot een volledige analyse — en in welke vorm.'],
      ['Voor wie is het antwoord?', 'De AI past woordkeuze en diepgang aan op de lezer.'],
      ['In welke taal moet de AI antwoorden?', 'Standaard de taal van de app. Citaten blijven in de originele taal.'],
      ['Welke feedback gaat mee?', 'Kies de bron en hoe privacygevoelig de export moet zijn.'],
      ['Je prompt is klaar.', 'Kopieer of bewaar de prompt en zet hem samen met het databestand in je AI-tool.'],
    ],
    toolLabel: 'AI-tool', roleLabel: 'Rol van de AI',
    tools: { claude: 'Claude', chatgpt: 'ChatGPT', copilot: 'Microsoft Copilot', gemini: 'Google Gemini', local: 'Lokaal model', code: 'Codex / Claude Code' },
    toolHints: { claude: 'claude.ai — met Projects', chatgpt: 'chatgpt.com — gesprek of project', copilot: 'Microsoft 365 Copilot of copilot.microsoft.com', gemini: 'gemini.google.com — met Gems', local: 'Ollama, LM Studio — niets verlaat je pc', code: 'In een map op je computer' },
    toolExplain: 'Je keuze past de werkwijze in de prompt aan (bijv. geen e-mail of SharePoint bij Copilot, compact bij een lokaal model) en bepaalt de stappen bij G.',
    roles: {
      research: ['Onderzoeksassistent', 'Neutraal, zorgvuldig, met bewijs.'],
      product: ['Productmanager', 'Van feedback naar productkeuzes.'],
      success: ['Customer success', 'Risico\'s en kansen per klant.'],
      management: ['Management-adviseur', 'Kern, impact en besluiten.'],
    },
    extra: 'Extra instructie (optioneel)', extraPlaceholder: 'Bijv. "Focus op de module Functioneringsgesprekken" of "Noem geen concurrenten".', extraHint: 'Wordt niet bewaard in een cookie.',
    examples: 'Voorbeeldvragen', own: 'Eigen vragen', ownPlaceholder: 'Typ een vraag en druk op Enter…', add: 'Toevoegen', remove: 'Verwijderen',
    zeroQuestions: 'Geen vragen gekozen — prima. De AI bevestigt dan dat hij de export heeft gelezen en wacht op je vragen.',
    questionCount: (n: number) => n === 1 ? '1 vraag' : `${n} vragen`,
    answerLabel: 'Lengte', layoutLabel: 'Vorm',
    answers: { brief: ['Eén zin', '1–2 zinnen per vraag'], short: ['Kort', '± 100 woorden'], standard: ['Gebalanceerd', 'Kern + onderbouwing'], detailed: ['Gedetailleerd', 'Volledige analyse'] },
    layouts: { bullets: 'Opsomming', prose: 'Lopende tekst', table: 'Tabellen waar zinvol' },
    levels: {
      child: ['Kind van 8', 'Simpele woorden en een voorbeeld.'],
      teen: ['Scholier', 'Helder, weinig jargon.'],
      general: ['Collega', 'Zakelijk en begrijpelijk.'],
      manager: ['Management', 'Conclusie eerst, impact en besluiten.'],
      expert: ['Expert', 'Vaktaal, nuance en onzekerheden.'],
    },
    appLanguage: (name: string) => `Taal van de app (${name})`,
    scopeAll: 'Alle feedback', scopeFiltered: 'Huidige filters',
    fullText: 'Volledige sessietekst meenemen', fullTextHint: 'Aanbevolen: de AI kan dan ook vragen beantwoorden buiten de herkende feedbackpunten.',
    notes: 'Teamnotities meenemen', notesHint: 'Jullie eigen notities, duidelijk gemarkeerd als intern.',
    mask: 'Klantnamen anonimiseren', maskHint: 'Vervangt bekende klantnamen door Klant 1, Klant 2, … Geen volledige anonimisering: controleer vrije tekst op persoonsgegevens.',
    format: 'Formaat databestand', markdown: 'Markdown (aanbevolen)', json: 'JSON (voor tools en scripts)',
    sessions: 'sessies', items: 'feedbackpunten', tokens: 'tokens (schatting)',
    noData: 'Nog geen documenten geladen', noDataText: 'De prompt kun je al maken. Voor het databestand laad je eerst je sessieverslagen.', addDocs: 'Documenten toevoegen',
    prompt: 'Prompt', copyPrompt: 'Kopieer prompt', copyPromptHint: 'Plak als eerste bericht of projectinstructie, en voeg het databestand toe.',
    downloadData: 'Download databestand', downloadAll: 'Download alles-in-één', downloadAllHint: 'Prompt + data in één bestand: in één keer uploaden.',
    copyAll: 'Kopieer alles-in-één', copied: 'Gekopieerd naar het klembord.', copyError: 'Kopiëren lukte niet. Gebruik Download.',
    large: 'Groot bestand: sommige AI-tools lezen dan maar een deel. Zet "Volledige sessietekst" uit of gebruik filters.',
    next: 'Volgende', back: 'Terug', restart: 'Opnieuw beginnen', stepOf: (a: number, b: number) => `Stap ${a} van ${b}`,
    summary: 'Jouw keuzes', edit: 'Wijzig', yes: 'ja', no: 'nee', anonymous: 'anoniem',
    remember: 'Onthoud mijn keuzes voor de volgende keer', rememberHint: 'In een cookie in deze browser. Eigen vragen en de extra instructie worden niet bewaard.',
    nextSteps: 'Zo ga je verder',
    toolSteps: {
      claude: ['Maak op claude.ai een Project, bijv. "Klantfeedback".', 'Voeg het databestand toe onder Project knowledge.', 'Plak de prompt in Project instructions of als eerste bericht.', 'Stel je vragen in het project.'],
      chatgpt: ['Open ChatGPT en start een gesprek of Project.', 'Upload het databestand via de paperclip.', 'Plak de prompt als eerste bericht.', 'Stel vervolgvragen in hetzelfde gesprek.'],
      copilot: ['Open Microsoft 365 Copilot (Copilot Chat) met je werkaccount.', 'Voeg het databestand toe via de paperclip of zet het in een Copilot-notitieblok.', 'Plak de prompt als eerste bericht.', 'Controleer het beleid van je organisatie voor klantdata in Copilot.'],
      gemini: ['Open gemini.google.com of maak een Gem met de prompt als instructie.', 'Upload het databestand via de plus-knop.', 'Plak de prompt als eerste bericht (niet nodig in een Gem).', 'Stel vervolgvragen in hetzelfde gesprek.'],
      local: ['Start Ollama, LM Studio of Open WebUI met een model met groot contextvenster.', 'Zet bij een groot bestand Volledige sessietekst uit (stap F).', 'Plak het alles-in-één-bestand of upload het als document.', 'Alles blijft op je eigen computer.'],
      code: ['Zet het alles-in-één-bestand in een lege map.', 'Start Codex of Claude Code in die map.', 'Vraag: "Lees het Feedbacker-bestand en volg de instructie."', 'Laat desgewenst een rapport als bestand schrijven.'],
    },
    privacyTitle: 'Let op privacy', privacyText: 'Zodra je de data in een AI-tool zet, verwerkt die aanbieder de inhoud. Controleer het beleid van je organisatie en de voorwaarden van de aanbieder. AI-antwoorden kunnen fouten bevatten: controleer belangrijke conclusies in de bron.',
  },
  en: {
    nav: 'Chat with your feedback',
    title: 'Talk to your feedback in your favorite AI.',
    intro: 'Build your prompt in seven short steps. You get a ready-made instruction plus a data file for your AI tool, with references to the source.',
    local: 'Everything is created in your browser. Feedbacker sends nothing to an AI service; you decide where the prompt and file go.',
    steps: ['Instruction', 'Questions', 'Answer', 'Level', 'Language', 'Source', 'Prompt'],
    heads: [
      ['Which AI do you use, and what role does it play?', 'Choose your tool and the role the AI takes on. An extra instruction is optional.'],
      ['Which questions do you want to ask?', 'Pick example questions or write your own. No questions is fine too: the AI will then wait for your questions in the chat.'],
      ['How extensive should the answer be?', 'From one sentence to a full analysis — and in which form.'],
      ['Who is the answer for?', 'The AI adapts wording and depth to the reader.'],
      ['Which language should the AI answer in?', 'The app language by default. Quotes stay in their original language.'],
      ['Which feedback is included?', 'Choose the source and how privacy-sensitive the export should be.'],
      ['Your prompt is ready.', 'Copy or save the prompt and add it to your AI tool together with the data file.'],
    ],
    toolLabel: 'AI tool', roleLabel: 'Role of the AI',
    tools: { claude: 'Claude', chatgpt: 'ChatGPT', copilot: 'Microsoft Copilot', gemini: 'Google Gemini', local: 'Local model', code: 'Codex / Claude Code' },
    toolHints: { claude: 'claude.ai — with Projects', chatgpt: 'chatgpt.com — chat or project', copilot: 'Microsoft 365 Copilot or copilot.microsoft.com', gemini: 'gemini.google.com — with Gems', local: 'Ollama, LM Studio — nothing leaves your PC', code: 'In a folder on your computer' },
    toolExplain: 'Your choice adapts the working method in the prompt (e.g. no email or SharePoint for Copilot, compact for a local model) and sets the steps in G.',
    roles: {
      research: ['Research assistant', 'Neutral, careful, evidence-based.'],
      product: ['Product manager', 'From feedback to product decisions.'],
      success: ['Customer success', 'Risks and opportunities per customer.'],
      management: ['Management advisor', 'Key points, impact and decisions.'],
    },
    extra: 'Extra instruction (optional)', extraPlaceholder: 'E.g. "Focus on the performance review module" or "Do not mention competitors".', extraHint: 'Not stored in a cookie.',
    examples: 'Example questions', own: 'Your own questions', ownPlaceholder: 'Type a question and press Enter…', add: 'Add', remove: 'Remove',
    zeroQuestions: 'No questions selected — that\'s fine. The AI will confirm it has read the export and wait for your questions.',
    questionCount: (n: number) => n === 1 ? '1 question' : `${n} questions`,
    answerLabel: 'Length', layoutLabel: 'Layout',
    answers: { brief: ['One sentence', '1–2 sentences per question'], short: ['Short', '± 100 words'], standard: ['Balanced', 'Core + evidence'], detailed: ['Detailed', 'Full analysis'] },
    layouts: { bullets: 'Bullet points', prose: 'Flowing text', table: 'Tables where useful' },
    levels: {
      child: ['8-year-old', 'Simple words and an example.'],
      teen: ['Student', 'Clear, little jargon.'],
      general: ['Colleague', 'Professional and easy to follow.'],
      manager: ['Management', 'Conclusion first, impact and decisions.'],
      expert: ['Expert', 'Technical, nuanced, with uncertainties.'],
    },
    appLanguage: (name: string) => `App language (${name})`,
    scopeAll: 'All feedback', scopeFiltered: 'Current filters',
    fullText: 'Include full session text', fullTextHint: 'Recommended: lets the AI answer questions beyond the detected feedback items.',
    notes: 'Include team notes', notesHint: 'Your own notes, clearly marked as internal.',
    mask: 'Anonymize customer names', maskHint: 'Replaces known customer names with Customer 1, Customer 2, … Not full anonymization: check free text for personal data.',
    format: 'Data file format', markdown: 'Markdown (recommended)', json: 'JSON (for tools and scripts)',
    sessions: 'sessions', items: 'feedback items', tokens: 'tokens (estimate)',
    noData: 'No documents loaded yet', noDataText: 'You can already create the prompt. Load your session summaries first for the data file.', addDocs: 'Add documents',
    prompt: 'Prompt', copyPrompt: 'Copy prompt', copyPromptHint: 'Paste as first message or project instruction, and attach the data file.',
    downloadData: 'Download data file', downloadAll: 'Download all-in-one', downloadAllHint: 'Prompt + data in one file: upload in one go.',
    copyAll: 'Copy all-in-one', copied: 'Copied to clipboard.', copyError: 'Copy failed. Use Download instead.',
    large: 'Large file: some AI tools only read part of it. Turn off "Full session text" or use filters.',
    next: 'Next', back: 'Back', restart: 'Start over', stepOf: (a: number, b: number) => `Step ${a} of ${b}`,
    summary: 'Your choices', edit: 'Edit', yes: 'yes', no: 'no', anonymous: 'anonymized',
    remember: 'Remember my choices for next time', rememberHint: 'In a cookie in this browser. Your own questions and the extra instruction are never stored.',
    nextSteps: 'What to do next',
    toolSteps: {
      claude: ['Create a Project on claude.ai, e.g. "Customer feedback".', 'Add the data file under Project knowledge.', 'Paste the prompt into Project instructions or as first message.', 'Ask your questions in the project.'],
      chatgpt: ['Open ChatGPT and start a chat or Project.', 'Upload the data file with the paperclip.', 'Paste the prompt as your first message.', 'Ask follow-up questions in the same chat.'],
      copilot: ['Open Microsoft 365 Copilot (Copilot Chat) with your work account.', 'Attach the data file with the paperclip or add it to a Copilot Notebook.', 'Paste the prompt as your first message.', 'Check your organization\'s policy for customer data in Copilot.'],
      gemini: ['Open gemini.google.com or create a Gem with the prompt as instructions.', 'Upload the data file with the plus button.', 'Paste the prompt as your first message (not needed in a Gem).', 'Ask follow-up questions in the same chat.'],
      local: ['Start Ollama, LM Studio or Open WebUI with a large-context model.', 'For a large file, turn off Full session text (step F).', 'Paste the all-in-one file or upload it as a document.', 'Everything stays on your own computer.'],
      code: ['Put the all-in-one file in an empty folder.', 'Start Codex or Claude Code in that folder.', 'Ask: "Read the Feedbacker file and follow its instruction."', 'Optionally have it write a report file.'],
    },
    privacyTitle: 'Mind privacy', privacyText: 'Once you add the data to an AI tool, that provider processes its content. Check your organization\'s policy and the provider\'s terms. AI answers can contain errors: verify important conclusions in the source.',
  },
};

const roleIcons = { research: <Microscope size={18} />, product: <Target size={18} />, success: <HeartHandshake size={18} />, management: <Briefcase size={18} /> };
const levelIcons = { child: <Baby size={18} />, teen: <GraduationCap size={18} />, general: <Users size={18} />, manager: <Briefcase size={18} />, expert: <Microscope size={18} /> };
const stepIcons = [<Bot size={14} />, <MessageSquarePlus size={14} />, <Ruler size={14} />, <Users size={14} />, <Languages size={14} />, <Search size={14} />, <Lightbulb size={14} />];

interface Props { lang: Language; feedback: Feedback[]; filtered: Feedback[]; sources: Source[]; onAdd: () => void; remember: boolean; changePreferences: (remember: boolean) => void }

function Choice({ selected, onSelect, icon, title, hint, name }: { selected: boolean; onSelect: () => void; icon?: ReactNode; title: string; hint?: string; name: string }) {
  return <label className={`choice-card ${selected ? 'selected' : ''}`}>
    <input type="radio" name={name} checked={selected} onChange={onSelect} />
    {icon && <span className="choice-icon">{icon}</span>}
    <span className="choice-text"><strong>{title}</strong>{hint && <small>{hint}</small>}</span>
    <span className="choice-check" aria-hidden="true"><Check size={12} /></span>
  </label>;
}

export function AiExportPage({ lang, feedback, filtered, sources, onAdd, remember, changePreferences }: Props) {
  const t = aiExportCopy[lang];
  const [settings, setSettings] = useState<ChatSettings>(() => parseChatSettings(remember ? readCookie(COOKIE) : undefined));
  const [step, setStep] = useState(0);
  const [custom, setCustom] = useState<string[]>([]);
  const [draft, setDraft] = useState('');
  const [extra, setExtra] = useState('');
  const [status, setStatus] = useState<{ key: string; ok: boolean } | null>(null);
  const top = useRef<HTMLDivElement>(null);
  const last = t.steps.length - 1;

  useEffect(() => {
    if (!remember) { deleteCookie(COOKIE); return; }
    writeCookie(COOKIE, serializeChatSettings(settings));
  }, [settings, remember]);

  const selected = settings.scope === 'filtered' ? filtered : feedback;
  const hasData = feedback.length > 0;
  const data = useMemo(() => buildAiExport({ language: lang, format: settings.format, fullText: settings.fullText, notes: settings.notes, maskNames: settings.maskNames }, selected, sources), [lang, settings.format, settings.fullText, settings.notes, settings.maskNames, selected, sources]);
  const prompt = useMemo(() => buildChatPrompt(settings, lang, custom, extra), [settings, lang, custom, extra]);
  const allInOne = useMemo(() => `${prompt}\n\n---\n\n${settings.format === 'json' ? `# Feedbacker export (JSON)\n\n\`\`\`json\n${data.content}\n\`\`\`` : data.content}\n`, [prompt, data.content, settings.format]);
  const questionCount = selectedQuestions(settings, custom, lang).length;
  const languageName = languageNames[resolveLanguage(settings, lang)][lang];

  const update = <K extends keyof ChatSettings>(key: K, value: ChatSettings[K]) => setSettings(current => ({ ...current, [key]: value }));
  function go(next: number) {
    setStep(Math.max(0, Math.min(last, next)));
    setStatus(null);
    top.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function toggleQuestion(id: string) {
    update('questions', settings.questions.includes(id) ? settings.questions.filter(q => q !== id) : [...settings.questions, id]);
  }
  function addCustom() {
    const value = draft.trim();
    if (!value || custom.includes(value) || custom.length >= 20) return;
    setCustom([...custom, value.slice(0, 500)]);
    setDraft('');
  }
  async function copy(text: string, key: string) {
    try { await navigator.clipboard.writeText(text); setStatus({ key, ok: true }); }
    catch { setStatus({ key, ok: false }); }
  }
  function download(content: string, filename: string, mime: string) {
    const url = URL.createObjectURL(new Blob([content], { type: mime }));
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = filename; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function restart() {
    setSettings({ ...defaultChatSettings }); setCustom([]); setExtra(''); setDraft(''); go(0);
  }
  const copied = (key: string) => status?.key === key && status.ok;
  const stamp = data.filename.replace(/\.(md|json)$/, '');

  const summary: [string, string][] = [
    [t.steps[0], `${t.tools[settings.tool]} · ${t.roles[settings.role][0]}${extra.trim() ? ' +' : ''}`],
    [t.steps[1], t.questionCount(questionCount)],
    [t.steps[2], `${t.answers[settings.answer][0]} · ${t.layouts[settings.layout]}`],
    [t.steps[3], t.levels[settings.level][0]],
    [t.steps[4], languageName],
    [t.steps[5], hasData ? `${data.sessions} ${t.sessions} · ${data.feedback} ${t.items}${settings.maskNames ? ` · ${t.anonymous}` : ''}` : t.noData],
  ];

  const body = [
    <>
      <div className="wizard-group"><span className="wizard-label">{t.toolLabel}</span>
        <div className="choice-grid three">{chatTools.map(id => <Choice key={id} name="chat-tool" selected={settings.tool === id} onSelect={() => update('tool', id)} icon={toolIcons[id]} title={t.tools[id]} hint={t.toolHints[id]} />)}</div>
          <p className="wizard-note"><Lightbulb size={14} />{t.toolExplain}</p>
      </div>
      <div className="wizard-group"><span className="wizard-label">{t.roleLabel}</span>
        <div className="choice-grid two">{chatRoles.map(id => <Choice key={id} name="chat-role" selected={settings.role === id} onSelect={() => update('role', id)} icon={roleIcons[id]} title={t.roles[id][0]} hint={t.roles[id][1]} />)}</div>
      </div>
      <label className="builder-question">{t.extra}<textarea rows={3} maxLength={2000} value={extra} placeholder={t.extraPlaceholder} onChange={event => setExtra(event.target.value)} /><small>{t.extraHint}</small></label>
    </>,
    <>
      <div className="wizard-group"><span className="wizard-label">{t.examples}</span>
        <div className="chip-list">{exampleQuestions.map(q => { const on = settings.questions.includes(q.id); return <button key={q.id} type="button" className={`chip ${on ? 'selected' : ''}`} aria-pressed={on} onClick={() => toggleQuestion(q.id)}>{on ? <Check size={13} /> : <Plus size={13} />}{q[lang]}</button>; })}</div>
      </div>
      <div className="wizard-group"><span className="wizard-label">{t.own}</span>
        <div className="question-input"><input value={draft} maxLength={500} placeholder={t.ownPlaceholder} aria-label={t.own} onChange={event => setDraft(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); addCustom(); } }} /><button className="button secondary" type="button" onClick={addCustom} disabled={!draft.trim()}><Plus size={14} />{t.add}</button></div>
        {custom.length > 0 && <ol className="custom-questions">{custom.map((q, i) => <li key={q}><span>{q}</span><button className="icon-button" type="button" aria-label={`${t.remove}: ${q}`} onClick={() => setCustom(custom.filter((_, index) => index !== i))}><X size={14} /></button></li>)}</ol>}
      </div>
      <p className={`wizard-note ${questionCount ? 'ok' : ''}`}>{questionCount ? <><Check size={14} />{t.questionCount(questionCount)}</> : <><Lightbulb size={14} />{t.zeroQuestions}</>}</p>
    </>,
    <>
      <div className="wizard-group"><span className="wizard-label">{t.answerLabel}</span>
        <div className="choice-grid four">{answerTypes.map((id, i) => <Choice key={id} name="chat-answer" selected={settings.answer === id} onSelect={() => update('answer', id)} icon={<span className="length-bars" aria-hidden="true">{[0, 1, 2, 3].map(bar => <i key={bar} className={bar <= i ? 'on' : ''} />)}</span>} title={t.answers[id][0]} hint={t.answers[id][1]} />)}</div>
      </div>
      <div className="wizard-group"><span className="wizard-label">{t.layoutLabel}</span>
        <div className="segmented" role="radiogroup" aria-label={t.layoutLabel}>{answerLayouts.map(id => <button key={id} type="button" role="radio" aria-checked={settings.layout === id} onClick={() => update('layout', id)}>{id === 'bullets' ? <LayoutList size={14} /> : id === 'prose' ? <Ruler size={14} /> : <Target size={14} />}{t.layouts[id]}</button>)}</div>
      </div>
    </>,
    <>
      <div className="level-scale" aria-hidden="true"><span style={{ width: `${(levels.indexOf(settings.level) / (levels.length - 1)) * 100}%` }} /></div>
      <div className="choice-grid five">{levels.map(id => <Choice key={id} name="chat-level" selected={settings.level === id} onSelect={() => update('level', id)} icon={levelIcons[id]} title={t.levels[id][0]} hint={t.levels[id][1]} />)}</div>
    </>,
    <div className="choice-grid three">{answerLanguages.map(id => <Choice key={id} name="chat-language" selected={settings.language === id} onSelect={() => update('language', id)} icon={<Languages size={18} />} title={id === 'auto' ? t.appLanguage(languageNames[lang][lang]) : languageNames[id][lang]} />)}</div>,
    !hasData ? <div className="export-empty"><FilePlus2 size={22} /><strong>{t.noData}</strong><p>{t.noDataText}</p><button className="button primary" onClick={onAdd}><FilePlus2 size={15} />{t.addDocs}</button></div> : <>
      <fieldset className="scope-choice"><legend className="sr-only">{t.steps[5]}</legend>{(['all', 'filtered'] as const).map(value => <label key={value} className={settings.scope === value ? 'selected' : ''}><input type="radio" name="chat-scope" checked={settings.scope === value} onChange={() => update('scope', value)} /><span>{value === 'all' ? t.scopeAll : t.scopeFiltered}</span><strong>{value === 'filtered' ? filtered.length : feedback.length}</strong></label>)}</fieldset>
      <div className="builder-checks">{([['maskNames', t.mask, t.maskHint], ['fullText', t.fullText, t.fullTextHint], ['notes', t.notes, t.notesHint]] as const).map(([key, title, hint]) => <label key={key}><input type="checkbox" checked={settings[key]} onChange={event => update(key, event.target.checked)} /><span><strong>{title}</strong><small>{hint}</small></span></label>)}</div>
      <div className="builder-options single"><label>{t.format}<select value={settings.format} onChange={event => update('format', event.target.value === 'json' ? 'json' : 'markdown')}><option value="markdown">{t.markdown}</option><option value="json">{t.json}</option></select></label></div>
      <div className="prompt-metrics export-metrics"><span>{data.sessions} {t.sessions}</span><span>{data.feedback} {t.items}</span><strong>~{data.estimatedTokens.toLocaleString(lang)} {t.tokens}</strong></div>
      {data.estimatedTokens > 150000 && <p className="builder-validation" role="status">{t.large}</p>}
    </>,
    <>
      <textarea className="prompt-output wizard-prompt" aria-label={t.prompt} readOnly value={prompt} spellCheck={false} />
      <div className="final-actions">
        <div className="final-action primary-action"><button className="button primary" onClick={() => void copy(prompt, 'prompt')}>{copied('prompt') ? <Check size={15} /> : <Copy size={15} />}{copied('prompt') ? t.copied : t.copyPrompt}</button><small>{t.copyPromptHint}</small></div>
        <div className="final-action"><button className="button secondary" disabled={!data.feedback} onClick={() => download(data.content, data.filename, data.mime)}><ArrowDownToLine size={15} />{t.downloadData}</button><small>{hasData ? data.filename : t.noData}</small></div>
        <div className="final-action"><button className="button secondary" disabled={!data.feedback} onClick={() => download(allInOne, `${stamp}-chat.md`, 'text/markdown;charset=utf-8')}><ArrowDownToLine size={15} />{t.downloadAll}</button><small>{t.downloadAllHint}</small></div>
        <div className="final-action"><button className="button ghost" disabled={!data.feedback} onClick={() => void copy(allInOne, 'all')}>{copied('all') ? <Check size={15} /> : <Copy size={15} />}{copied('all') ? t.copied : t.copyAll}</button></div>
      </div>
      {status && !status.ok && <p className="copy-result error" role="alert">{t.copyError}</p>}
      <div className="builder-remember"><label><input type="checkbox" checked={remember} onChange={event => changePreferences(event.target.checked)} />{t.remember}</label><p>{t.rememberHint}</p></div>
      <div className="wizard-group"><span className="wizard-label">{t.nextSteps} · {t.tools[settings.tool]}</span><ol className="tool-steps">{t.toolSteps[settings.tool].map(s => <li key={s}>{s}</li>)}</ol></div>
    </>,
  ];

  return <div className="prompt-builder ai-export chat-wizard" ref={top}>
    <div className="prompt-local-note"><ShieldCheck size={16} /><span>{t.local}</span></div>
    <nav className="wizard-steps" aria-label={t.stepOf(step + 1, t.steps.length)}>
      <span className="wizard-progress" aria-hidden="true"><span style={{ width: `${(step / last) * 100}%` }} /></span>
      <ol>{t.steps.map((name, i) => <li key={name}><button type="button" className={i === step ? 'current' : i < step ? 'done' : ''} aria-current={i === step ? 'step' : undefined} onClick={() => go(i)}><span className="wizard-dot">{i < step ? <Check size={12} /> : String.fromCharCode(65 + i)}</span><span className="wizard-name">{name}</span></button></li>)}</ol>
    </nav>
    <div className="wizard-layout">
      <section className="panel wizard-panel">
        <div className="builder-section-heading"><span className="builder-number">{String.fromCharCode(65 + step)}</span><div><h2>{t.heads[step][0]}</h2><p>{t.heads[step][1]}</p></div>{stepIcons[step]}</div>
        <div className="wizard-body" key={step}>{body[step]}</div>
        <div className="wizard-footer">
          <button type="button" className="button ghost" onClick={() => go(step - 1)} disabled={step === 0}><ArrowLeft size={15} />{t.back}</button>
          <span>{t.stepOf(step + 1, t.steps.length)}</span>
          {step < last
            ? <button type="button" className="button primary" onClick={() => go(step + 1)}>{t.next}: {t.steps[step + 1]}<ArrowRight size={15} /></button>
            : <button type="button" className="button secondary" onClick={restart}><RotateCcw size={15} />{t.restart}</button>}
        </div>
      </section>
      <aside className="wizard-aside">
        <section className="panel wizard-summary">
          <h3>{t.summary}</h3>
          <ul>{summary.map(([label, value], i) => <li key={label} className={i === step ? 'current' : ''}><button type="button" onClick={() => go(i)}><span className="summary-key"><span className="wizard-dot small">{String.fromCharCode(65 + i)}</span>{label}</span><span className="summary-value">{value}</span></button></li>)}</ul>
          {step < last && <button type="button" className="button primary wide" onClick={() => go(last)}><Lightbulb size={15} />{t.steps[last]}<ArrowRight size={15} /></button>}
        </section>
        <section className="builder-how"><ShieldCheck size={20} /><h3>{t.privacyTitle}</h3><p>{t.privacyText}</p></section>
      </aside>
    </div>
  </div>;
}
