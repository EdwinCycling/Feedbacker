import { useMemo, useState } from 'react';
import { ArrowDownToLine, Check, Copy, FilePlus2, FileText, MessagesSquare, ShieldCheck, Sparkles } from 'lucide-react';
import type { Feedback, Source } from './shared';
import type { Language } from './i18n';
import { buildAiExport, defaultExportOptions, type ExportOptions } from './aiExport';

type Tool = 'claude' | 'chatgpt' | 'code';

export const aiExportCopy = {
  nl: {
    nav: 'Chat met je feedback',
    title: 'Praat met je feedback in Claude of ChatGPT.',
    intro: 'Maak één exportbestand met alle geladen sessies en feedback. Zet het in je AI-tool en stel vragen in gewone taal — met verwijzingen naar de bron.',
    local: 'Het bestand wordt in je browser gemaakt. Feedbacker stuurt niets naar een AI-dienst; jij bepaalt waar je het bestand neerzet.',
    howTitle: 'Zo werkt het', howHint: 'In drie stappen van documenten naar een gesprek.',
    steps: [
      ['Download het exportbestand', 'Eén Markdown-bestand met overzicht, feedbackpunten, bewijs en (optioneel) de volledige sessietekst.'],
      ['Zet het in je AI-tool', 'Upload het in een Claude Project, ChatGPT-project of gesprek, of zet het in de map van Codex / Claude Code.'],
      ['Stel je vragen', 'De AI antwoordt op basis van het bestand en verwijst naar feedback-ID\'s, zodat je alles kunt terugvinden.'],
    ],
    toolTitle: 'Kies je AI-tool', toolHint: 'Stappen per tool. Gebruik alleen tools die jouw organisatie toestaat.',
    tools: { claude: 'Claude', chatgpt: 'ChatGPT', code: 'Codex / Claude Code' },
    toolSteps: {
      claude: ['Open claude.ai en maak een nieuw Project (bijv. "Klantfeedback Q4").', 'Voeg het exportbestand toe onder Project knowledge.', 'Plak de startinstructie hieronder in Project instructions.', 'Start een gesprek in het project en stel je vraag.'],
      chatgpt: ['Open ChatGPT en maak een Project, of start een nieuw gesprek.', 'Upload het exportbestand via de paperclip of als projectbestand.', 'Plak de startinstructie als eerste bericht of als projectinstructie.', 'Stel je vragen in hetzelfde gesprek of project.'],
      code: ['Zet het exportbestand in een (lege) projectmap.', 'Start Codex of Claude Code in die map.', 'Vraag bijvoorbeeld: "Lees feedbacker-ai-export-….md en volg de instructies erin."', 'Laat de AI desgewenst een rapport of backlog als bestand schrijven.'],
    },
    questionsTitle: 'Voorbeeldvragen', questionsHint: 'Klik om te kopiëren en plak in je AI-tool.',
    questions: [
      'Wat zijn de drie grootste pijnpunten, en bij welke klanten komen ze voor?',
      'Welke klanten zijn negatief over planning of performance? Geef citaten.',
      'Vergelijk de wensen per klant in een tabel.',
      'Maak een MoSCoW-prioritering van alle genoemde verbeterpunten.',
      'Welke onderwerpen komen steeds terug, en wat valt op in de tijd?',
      'Schrijf een managementsamenvatting van maximaal 200 woorden.',
    ],
    fileTitle: 'Je exportbestand', fileHint: 'Kies wat er in het bestand komt. Het voorbeeld werkt direct bij.',
    filtered: 'Huidige filters', all: 'Alle feedback',
    fullText: 'Volledige sessietekst meenemen', fullTextHint: 'Aanbevolen: de AI kan dan ook vragen beantwoorden buiten de herkende feedbackpunten.',
    notes: 'Teamnotities meenemen', notesHint: 'Jullie eigen notities, duidelijk gemarkeerd als intern.',
    mask: 'Bekende klantnamen vervangen', maskHint: 'Vervangt alleen exacte klantnamen door Klant 1, Klant 2, … Geen volledige anonimisering.',
    format: 'Formaat', markdown: 'Markdown (aanbevolen)', json: 'JSON (voor tools en scripts)',
    language: 'Taal van de instructies', nl: 'Nederlands', en: 'Engels',
    sessions: 'sessies', items: 'feedbackpunten', tokens: 'tokens (schatting)',
    download: 'Download bestand', copy: 'Kopieer inhoud', copied: 'Gekopieerd naar het klembord.', copyError: 'Kopiëren lukte niet. Gebruik Download.',
    large: 'Groot bestand: sommige AI-tools lezen dan maar een deel. Zet "Volledige sessietekst" uit of gebruik filters.',
    copyStarter: 'Kopieer instructie', starterTitle: 'Startinstructie', starterHint: 'Plak dit als projectinstructie of eerste bericht.',
    starter: 'Je bent een onderzoeksassistent voor klantfeedback. Gebruik alleen het bijgevoegde Feedbacker-exportbestand. Verwijs bij elk antwoord naar de feedback-ID\'s [fb:…] en de klant. Onderscheid letterlijke klantuitspraken van je eigen interpretatie, en zeg het eerlijk als iets niet in de feedback staat. Antwoord in het Nederlands.',
    emptyTitle: 'Nog geen documenten geladen', emptyText: 'Laad eerst je sessieverslagen; daarna kun je hier het exportbestand maken.', add: 'Documenten toevoegen',
    preview: 'Voorbeeld',
    privacyTitle: 'Let op privacy', privacyText: 'Zodra je het bestand in een AI-tool zet, verwerkt die aanbieder de inhoud. Controleer het beleid van je organisatie en de voorwaarden van de aanbieder, en vervang of verwijder gevoelige gegevens waar nodig. AI-antwoorden kunnen fouten bevatten: controleer belangrijke conclusies in de bron.',
  },
  en: {
    nav: 'Chat with your feedback',
    title: 'Talk to your feedback in Claude or ChatGPT.',
    intro: 'Create one export file with all loaded sessions and feedback. Add it to your AI tool and ask questions in plain language — with references to the source.',
    local: 'The file is created in your browser. Feedbacker sends nothing to an AI service; you decide where the file goes.',
    howTitle: 'How it works', howHint: 'From documents to a conversation in three steps.',
    steps: [
      ['Download the export file', 'One Markdown file with an overview, feedback items, evidence and (optionally) the full session text.'],
      ['Add it to your AI tool', 'Upload it to a Claude Project, ChatGPT project or chat, or place it in your Codex / Claude Code folder.'],
      ['Ask your questions', 'The AI answers from the file and cites feedback IDs, so everything stays traceable.'],
    ],
    toolTitle: 'Choose your AI tool', toolHint: 'Steps per tool. Only use tools your organization allows.',
    tools: { claude: 'Claude', chatgpt: 'ChatGPT', code: 'Codex / Claude Code' },
    toolSteps: {
      claude: ['Open claude.ai and create a new Project (e.g. "Customer feedback Q4").', 'Add the export file under Project knowledge.', 'Paste the starter instruction below into Project instructions.', 'Start a chat in the project and ask your question.'],
      chatgpt: ['Open ChatGPT and create a Project, or start a new chat.', 'Upload the export file with the paperclip or as a project file.', 'Paste the starter instruction as your first message or project instruction.', 'Ask your questions in the same chat or project.'],
      code: ['Put the export file in an (empty) project folder.', 'Start Codex or Claude Code in that folder.', 'Ask for example: "Read feedbacker-ai-export-….md and follow its instructions."', 'Optionally have the AI write a report or backlog file.'],
    },
    questionsTitle: 'Example questions', questionsHint: 'Click to copy and paste into your AI tool.',
    questions: [
      'What are the three biggest pain points, and which customers mention them?',
      'Which customers are negative about planning or performance? Include quotes.',
      'Compare the requests per customer in a table.',
      'Create a MoSCoW prioritization of all suggested improvements.',
      'Which topics keep coming back, and what changes over time?',
      'Write a management summary of at most 200 words.',
    ],
    fileTitle: 'Your export file', fileHint: 'Choose what goes into the file. The preview updates instantly.',
    filtered: 'Current filters', all: 'All feedback',
    fullText: 'Include full session text', fullTextHint: 'Recommended: lets the AI answer questions beyond the detected feedback items.',
    notes: 'Include team notes', notesHint: 'Your own notes, clearly marked as internal.',
    mask: 'Replace known customer names', maskHint: 'Replaces only exact customer names with Customer 1, Customer 2, … Not full anonymization.',
    format: 'Format', markdown: 'Markdown (recommended)', json: 'JSON (for tools and scripts)',
    language: 'Instruction language', nl: 'Dutch', en: 'English',
    sessions: 'sessions', items: 'feedback items', tokens: 'tokens (estimate)',
    download: 'Download file', copy: 'Copy content', copied: 'Copied to clipboard.', copyError: 'Copy failed. Use Download instead.',
    large: 'Large file: some AI tools only read part of it. Turn off "Full session text" or use filters.',
    copyStarter: 'Copy instruction', starterTitle: 'Starter instruction', starterHint: 'Paste this as project instruction or first message.',
    starter: 'You are a customer feedback research assistant. Use only the attached Feedbacker export file. Cite the feedback IDs [fb:…] and the customer in every answer. Separate literal customer statements from your own interpretation, and say so honestly when something is not in the feedback. Answer in English.',
    emptyTitle: 'No documents loaded yet', emptyText: 'Load your session summaries first; then you can create the export file here.', add: 'Add documents',
    preview: 'Preview',
    privacyTitle: 'Mind privacy', privacyText: 'Once you add the file to an AI tool, that provider processes its content. Check your organization\'s policy and the provider\'s terms, and replace or remove sensitive data where needed. AI answers can contain errors: verify important conclusions in the source.',
  },
};

interface Props { lang: Language; feedback: Feedback[]; filtered: Feedback[]; sources: Source[]; onAdd: () => void }

export function AiExportPage({ lang, feedback, filtered, sources, onAdd }: Props) {
  const t = aiExportCopy[lang];
  const [scope, setScope] = useState<'filtered' | 'all'>('all');
  const [tool, setTool] = useState<Tool>('claude');
  const [options, setOptions] = useState<ExportOptions>({ ...defaultExportOptions, language: lang });
  const [status, setStatus] = useState<{ key: string; ok: boolean } | null>(null);
  const selected = scope === 'filtered' ? filtered : feedback;
  const result = useMemo(() => buildAiExport(options, selected, sources), [options, selected, sources]);
  const starter = aiExportCopy[options.language].starter;
  const hasData = feedback.length > 0;
  const update = <K extends keyof ExportOptions>(key: K, value: ExportOptions[K]) => setOptions(current => ({ ...current, [key]: value }));

  async function copy(text: string, key: string) {
    try { await navigator.clipboard.writeText(text); setStatus({ key, ok: true }); }
    catch { setStatus({ key, ok: false }); }
    window.setTimeout(() => setStatus(current => current?.key === key ? null : current), 2500);
  }
  function download() {
    const url = URL.createObjectURL(new Blob([result.content], { type: result.mime }));
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = result.filename; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const copied = (key: string) => status?.key === key && status.ok;

  return <div className="prompt-builder ai-export">
    <div className="prompt-local-note"><ShieldCheck size={16} /><span>{t.local}</span></div>
    <div className="builder-layout">
      <div className="builder-controls">
        <section className="panel builder-section">
          <div className="builder-section-heading"><span className="builder-number">01</span><div><h2>{t.howTitle}</h2><p>{t.howHint}</p></div><MessagesSquare size={19} /></div>
          <ol className="export-steps">{t.steps.map(([title, text], i) => <li key={title}><span>{i + 1}</span><div><strong>{title}</strong><p>{text}</p></div></li>)}</ol>
        </section>
        <section className="panel builder-section">
          <div className="builder-section-heading"><span className="builder-number">02</span><div><h2>{t.toolTitle}</h2><p>{t.toolHint}</p></div><Sparkles size={19} /></div>
          <div className="analysis-tabs" role="tablist" aria-label={t.toolTitle}>{(['claude', 'chatgpt', 'code'] as const).map(id => <button key={id} role="tab" aria-selected={tool === id} aria-pressed={tool === id} onClick={() => setTool(id)}>{t.tools[id]}</button>)}</div>
          <ol className="tool-steps" role="tabpanel">{t.toolSteps[tool].map(step => <li key={step}>{step}</li>)}</ol>
          <div className="starter-box">
            <div><strong>{t.starterTitle}</strong><small>{t.starterHint}</small></div>
            <p>{starter}</p>
            <button className="button secondary" onClick={() => void copy(starter, 'starter')}>{copied('starter') ? <Check size={14} /> : <Copy size={14} />}{copied('starter') ? t.copied : t.copyStarter}</button>
          </div>
        </section>
        <section className="panel builder-section">
          <div className="builder-section-heading"><span className="builder-number">03</span><div><h2>{t.questionsTitle}</h2><p>{t.questionsHint}</p></div><FileText size={19} /></div>
          <div className="example-questions">{t.questions.map((question, i) => <button key={question} className={copied(`q${i}`) ? 'copied' : ''} onClick={() => void copy(question, `q${i}`)}><span>{question}</span>{copied(`q${i}`) ? <Check size={14} /> : <Copy size={14} />}</button>)}</div>
        </section>
      </div>
      <aside className="builder-preview-column">
        <section className="panel prompt-preview">
          <div className="builder-section-heading"><span className="builder-number">04</span><div><h2>{t.fileTitle}</h2><p>{t.fileHint}</p></div></div>
          {!hasData ? <div className="export-empty"><FilePlus2 size={22} /><strong>{t.emptyTitle}</strong><p>{t.emptyText}</p><button className="button primary" onClick={onAdd}><FilePlus2 size={15} />{t.add}</button></div> : <>
            <fieldset className="scope-choice"><legend className="sr-only">{t.fileTitle}</legend>{(['all', 'filtered'] as const).map(value => <label key={value} className={scope === value ? 'selected' : ''}><input type="radio" name="export-scope" checked={scope === value} onChange={() => setScope(value)} /><span>{t[value]}</span><strong>{value === 'filtered' ? filtered.length : feedback.length}</strong></label>)}</fieldset>
            <div className="builder-checks">{([['fullText', t.fullText, t.fullTextHint], ['notes', t.notes, t.notesHint], ['maskNames', t.mask, t.maskHint]] as const).map(([key, title, hint]) => <label key={key}><input type="checkbox" checked={options[key]} onChange={event => update(key, event.target.checked)} /><span><strong>{title}</strong><small>{hint}</small></span></label>)}</div>
            <div className="builder-options">
              <label>{t.format}<select value={options.format} onChange={event => update('format', event.target.value === 'json' ? 'json' : 'markdown')}><option value="markdown">{t.markdown}</option><option value="json">{t.json}</option></select></label>
              <label>{t.language}<select value={options.language} onChange={event => update('language', event.target.value === 'en' ? 'en' : 'nl')}><option value="nl">{t.nl}</option><option value="en">{t.en}</option></select></label>
            </div>
            <div className="prompt-metrics export-metrics"><span>{result.sessions} {t.sessions}</span><span>{result.feedback} {t.items}</span><strong>~{result.estimatedTokens.toLocaleString(lang)} {t.tokens}</strong></div>
            <textarea className="prompt-output export-output" aria-label={t.preview} readOnly value={result.content} spellCheck={false} />
            {result.estimatedTokens > 150000 && <p className="builder-validation" role="status">{t.large}</p>}
            <div className="prompt-actions"><button className="button primary" disabled={!result.feedback} onClick={download}><ArrowDownToLine size={15} />{t.download}</button><button className="button secondary" disabled={!result.feedback} onClick={() => void copy(result.content, 'content')}>{copied('content') ? <Check size={15} /> : <Copy size={15} />}{t.copy}</button></div>
            {status && (status.key === 'content' || !status.ok) && <p className={`copy-result ${status.ok ? 'copied' : 'error'}`} role={status.ok ? 'status' : 'alert'}>{status.ok ? t.copied : t.copyError}</p>}
            <p className="token-note export-filename">{result.filename}</p>
          </>}
        </section>
        <section className="builder-how"><ShieldCheck size={20} /><h3>{t.privacyTitle}</h3><p>{t.privacyText}</p></section>
      </aside>
    </div>
  </div>;
}
