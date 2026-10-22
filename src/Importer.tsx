import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, CloudUpload, FilePlus2, FileText, LockKeyhole, RefreshCw, Sparkles } from 'lucide-react';
import type { Language } from './i18n';
import { acceptedExtensions, type ImportIssue } from './documents';

export const importCopy = {
  nl: {
    add: 'Documenten toevoegen', addMore: 'Meer documenten toevoegen', choose: 'Kies bestanden', or: 'of',
    clear: 'Alles wissen', clearTitle: 'Werkruimte leegmaken?',
    clearText: 'Alle geladen documenten, observaties en je beoordelingen in deze sessie worden verwijderd. De oorspronkelijke bestanden op je computer blijven ongewijzigd.',
    clearNotes: 'Ook mijn notitiepagina in deze browser wissen', clearConfirm: 'Ja, alles wissen', cleared: 'De werkruimte is leeg. Je kunt opnieuw beginnen.',
    eyebrow: 'BEGIN HIER', emptyTitle: 'Nog geen documenten geladen.',
    emptyText: 'Sleep je sessiesamenvattingen hierheen of kies ze op je computer. Feedbacker leest ze direct in je browser en maakt er herleidbare feedback van.',
    steps: ['Kies .docx-, .md- of .txt-bestanden', 'Feedbacker vindt onderwerpen en sentiment', 'Filter, beoordeel en exporteer'],
    drop: 'Sleep bestanden hierheen', dropHint: 'Of klik om te kiezen', formats: '.docx · .md · .txt · max. 20 MB per bestand',
    privacy: 'Blijft in je browser · leeg na vernieuwen', guide: 'Zo maak je vergelijkbare samenvattingen',
    overlay: 'Laat los om toe te voegen', overlayText: 'Bestanden worden alleen in deze browser gelezen.',
    reading: (done: number, total: number) => `Bestand ${Math.min(done + 1, total)} van ${total} lezen…`,
    added: (documents: number, items: number) => `${documents} ${documents === 1 ? 'document' : 'documenten'} toegevoegd · ${items} observaties gevonden.`,
    nothing: 'Er is geen document toegevoegd. Bekijk de meldingen hieronder.',
    issuesTitle: (count: number) => `${count} ${count === 1 ? 'melding' : 'meldingen'} bij het inlezen`,
    remove: 'Document verwijderen', removed: (name: string) => `${name} is verwijderd.`, undo: 'Ongedaan maken',
    leave: 'Geladen documenten en beoordelingen verdwijnen als je de pagina verlaat.',
    tourTitle: 'Begin met je documenten', tourText: 'Sleep sessiesamenvattingen in dit vak of kies bestanden. Ze worden alleen in je browser gelezen en verdwijnen bij vernieuwen. Daarna vullen grafieken, inbox en bibliotheek zich automatisch.',
    reasons: {
      legacy: 'oud .doc-formaat. Sla het in Word op als .docx.', type: 'bestandstype niet ondersteund. Gebruik .docx, .md of .txt.',
      size: 'groter dan 20 MB.', duplicate: 'dubbel in deze selectie; de eerste versie is gebruikt.', invalid: 'geen geldig Word-document (.docx).',
      empty: 'bevat geen leesbare tekst.', limit: 'bestanden overgeslagen: voeg maximaal 100 bestanden tegelijk toe.', conversion: 'conversiemelding', other: 'kon niet worden gelezen.',
    },
  },
  en: {
    add: 'Add documents', addMore: 'Add more documents', choose: 'Choose files', or: 'or',
    clear: 'Clear all', clearTitle: 'Clear the workspace?',
    clearText: 'All loaded documents, observations and your reviews in this session will be removed. The original files on your computer remain unchanged.',
    clearNotes: 'Also clear my notebook in this browser', clearConfirm: 'Yes, clear everything', cleared: 'The workspace is empty. You can start again.',
    eyebrow: 'START HERE', emptyTitle: 'No documents loaded yet.',
    emptyText: 'Drag your session summaries here or choose them from your computer. Feedbacker reads them directly in your browser and turns them into traceable feedback.',
    steps: ['Choose .docx, .md or .txt files', 'Feedbacker finds topics and sentiment', 'Filter, review and export'],
    drop: 'Drag files here', dropHint: 'Or click to choose', formats: '.docx · .md · .txt · max. 20 MB per file',
    privacy: 'Stays in your browser · empty after refresh', guide: 'How to create comparable summaries',
    overlay: 'Drop to add', overlayText: 'Files are read only in this browser.',
    reading: (done: number, total: number) => `Reading file ${Math.min(done + 1, total)} of ${total}…`,
    added: (documents: number, items: number) => `${documents} ${documents === 1 ? 'document' : 'documents'} added · ${items} observations found.`,
    nothing: 'No document was added. See the notices below.',
    issuesTitle: (count: number) => `${count} ${count === 1 ? 'notice' : 'notices'} while reading`,
    remove: 'Remove document', removed: (name: string) => `${name} was removed.`, undo: 'Undo',
    leave: 'Loaded documents and reviews disappear when you leave the page.',
    tourTitle: 'Start with your documents', tourText: 'Drag session summaries into this area or choose files. They are read only in your browser and disappear on refresh. Charts, inbox and library then fill automatically.',
    reasons: {
      legacy: 'legacy .doc format. Save it as .docx in Word.', type: 'unsupported file type. Use .docx, .md or .txt.',
      size: 'larger than 20 MB.', duplicate: 'duplicate in this selection; the first copy was used.', invalid: 'not a valid Word document (.docx).',
      empty: 'contains no readable text.', limit: 'files skipped: add at most 100 files at once.', conversion: 'conversion notice', other: 'could not be read.',
    },
  },
};

export function formatIssue(issue: ImportIssue, lang: Language) {
  const reason = importCopy[lang].reasons[issue.reason];
  if (issue.reason === 'limit') return `${issue.file} ${reason}`;
  return `${issue.file}: ${reason}${issue.detail && (issue.reason === 'conversion' || issue.reason === 'other') ? ` ${issue.detail}` : ''}`;
}

const filesFrom = (event: React.DragEvent | DragEvent) => [...(event.dataTransfer?.files ?? [])];
const hasFiles = (event: React.DragEvent | DragEvent) => [...(event.dataTransfer?.types ?? [])].includes('Files');

export function FilePicker({ inputRef, onFiles }: { inputRef: React.RefObject<HTMLInputElement | null>; onFiles: (files: File[]) => void }) {
  return <input ref={inputRef} className="visually-hidden" type="file" multiple accept={acceptedExtensions.join(',')} tabIndex={-1} aria-hidden="true"
    onChange={event => { onFiles([...(event.target.files ?? [])]); event.target.value = ''; }} />;
}

export function UploadZone({ lang, busy, progress, pick, onFiles, compact = false }: { lang: Language; busy: boolean; progress: [number, number]; pick: () => void; onFiles: (files: File[]) => void; compact?: boolean }) {
  const t = importCopy[lang];
  const [over, setOver] = useState(false);
  const status = busy ? <span className="upload-progress" role="status"><RefreshCw size={15} className="spin" />{t.reading(...progress)}<span className="progress-track"><span style={{ width: `${progress[1] ? progress[0] / progress[1] * 100 : 0}%` }} /></span></span> : null;
  return <div className={`upload-zone ${compact ? 'compact' : ''} ${over ? 'over' : ''} ${busy ? 'busy' : ''}`}
    onDragOver={event => { if (!hasFiles(event)) return; event.preventDefault(); event.stopPropagation(); setOver(true); }}
    onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setOver(false); }}
    onDrop={event => { if (!hasFiles(event)) return; event.preventDefault(); event.stopPropagation(); setOver(false); if (!busy) onFiles(filesFrom(event)); }}>
    {compact ? <>
      <span className="upload-icon small"><FilePlus2 size={18} /></span>
      <div><strong>{t.addMore}</strong><small>{t.formats}</small></div>
      {status ?? <button type="button" className="button secondary small" onClick={pick}>{t.choose}</button>}
    </> : <>
      <span className="upload-rings" aria-hidden="true"><span /><span /></span>
      <span className="upload-icon"><CloudUpload size={28} strokeWidth={1.7} /></span>
      <strong>{t.drop}</strong>
      <span className="upload-or">{t.or}</span>
      {status ?? <button type="button" className="button primary" onClick={pick}><FileText size={16} />{t.choose}</button>}
      <small>{t.formats}</small>
      <span className="upload-privacy"><LockKeyhole size={12} />{t.privacy}</span>
    </>}
  </div>;
}

export function EmptyWorkspace({ lang, busy, progress, pick, onFiles }: { lang: Language; busy: boolean; progress: [number, number]; pick: () => void; onFiles: (files: File[]) => void }) {
  const t = importCopy[lang];
  return <section className="panel upload-hero">
    <div className="upload-copy">
      <span className="eyebrow"><Sparkles size={13} />{t.eyebrow}</span>
      <h2>{t.emptyTitle}</h2>
      <p>{t.emptyText}</p>
      <ol>{t.steps.map((step, index) => <li key={step}><span>0{index + 1}</span>{step}</li>)}</ol>
      <a className="text-link" href="#structured-summaries">{t.guide}<ArrowUpRight size={14} /></a>
    </div>
    <UploadZone lang={lang} busy={busy} progress={progress} pick={pick} onFiles={onFiles} />
  </section>;
}

/** Full-window drop target so files can be dropped anywhere in the workspace. */
export function DropOverlay({ lang, enabled, onFiles }: { lang: Language; enabled: boolean; onFiles: (files: File[]) => void }) {
  const t = importCopy[lang];
  const [visible, setVisible] = useState(false);
  const depth = useRef(0);
  useEffect(() => {
    if (!enabled) { setVisible(false); depth.current = 0; return; }
    const enter = (event: DragEvent) => { if (!hasFiles(event)) return; depth.current++; setVisible(true); };
    const leave = () => { depth.current = Math.max(0, depth.current - 1); if (!depth.current) setVisible(false); };
    const over = (event: DragEvent) => { if (hasFiles(event)) event.preventDefault(); };
    const drop = (event: DragEvent) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      depth.current = 0; setVisible(false);
      onFiles(filesFrom(event));
    };
    window.addEventListener('dragenter', enter);
    window.addEventListener('dragleave', leave);
    window.addEventListener('dragover', over);
    window.addEventListener('drop', drop);
    return () => {
      window.removeEventListener('dragenter', enter);
      window.removeEventListener('dragleave', leave);
      window.removeEventListener('dragover', over);
      window.removeEventListener('drop', drop);
    };
  }, [enabled, onFiles]);
  if (!visible) return null;
  return <div className="drop-overlay" aria-hidden="true"><div><span className="upload-icon"><CloudUpload size={30} strokeWidth={1.7} /></span><strong>{t.overlay}</strong><span>{t.overlayText}</span></div></div>;
}
