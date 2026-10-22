import { useCallback, useEffect, useRef, useState } from 'react';
import { Download, Mail, Save, StickyNote, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import type { Language } from './i18n';
import type { Notebook } from './shared';
import { clearNotebook, emptyNotebook, notebookKey, readNotebook, writeNotebook } from './notebookStorage';

export const notebookCopy = {
  nl: {
    nav: 'Notitiepagina', title: 'Jouw verzamelde inzichten.', intro: 'Selecteer tekst op een pagina of in een bron en kies Bewaar in notities. Verzamel, bewerk en deel je inzichten hier.',
    add: 'Bewaar in notities', open: 'Open notities', save: 'Notities opslaan', download: 'Download (.md)', mail: 'Open mailprogramma',
    titleLabel: 'Titel notitiepagina', content: 'Notities (Markdown)', hint: 'Gebruik # voor koppen, - voor lijsten en > voor citaten. Tekst wordt veilig als tekst bewaard, niet als HTML.',
    dirty: 'Niet-opgeslagen wijzigingen', saved: 'Lokaal opgeslagen', loading: 'Notities laden…', error: 'Notities konden niet worden geladen of opgeslagen. Je concept blijft staan. Probeer opnieuw.',
    retry: 'Opnieuw laden', source: 'Bron', clipped: 'Tekst toegevoegd aan je conceptnotities. Open de notitiepagina om te bewerken en op te slaan.',
    mailHint: 'Je mailprogramma wordt geopend; er wordt niets automatisch verstuurd. Download zelf een bijlage indien nodig.',
    mailLong: 'Deze notitie is te lang voor een betrouwbare mail-link. Download het bestand en voeg het zelf toe aan je e-mail.',
    selectionLong: 'Deze selectie past niet meer in de notitiepagina (maximaal 200.000 tekens). Verklein de selectie of je notities.',
    dismiss: 'Sluiten', local: 'Notities worden alleen in deze browser op dit apparaat bewaard en kunnen klantgegevens bevatten. Deel ze alleen met bevoegde personen.',
    conflict: 'De notities zijn in een ander tabblad gewijzigd. Download je concept en laad de pagina opnieuw om samen te voegen.',
    failedSelection: 'Notities zijn nog niet geladen. Probeer laden opnieuw voordat je tekst toevoegt.',
    clipPage: 'Kopieer selectie of pagina naar notities',
  },
  en: {
    nav: 'Notebook', title: 'Your collected insights.', intro: 'Select text on a page or inside a source and choose Save to notes. Collect, edit and share insights here.',
    add: 'Save to notes', open: 'Open notes', save: 'Save notes', download: 'Download (.md)', mail: 'Open email app',
    titleLabel: 'Notebook title', content: 'Notes (Markdown)', hint: 'Use # for headings, - for lists and > for quotes. Content is safely stored as text, not HTML.',
    dirty: 'Unsaved changes', saved: 'Saved locally', loading: 'Loading notes…', error: 'Notes could not be loaded or saved. Your draft is retained. Please retry.',
    retry: 'Retry loading', source: 'Source', clipped: 'Text added to your draft notes. Open the notebook to edit and save.',
    mailHint: 'Your email app will open; nothing is sent automatically. Download and attach a file yourself if needed.',
    mailLong: 'These notes are too long for a reliable email link. Download the file and attach it to your email.',
    selectionLong: 'This selection exceeds the notebook limit (200,000 characters). Shorten the selection or your notes.',
    dismiss: 'Close', local: 'Notes are stored only in this browser on this device and may contain customer data. Share only with authorized people.',
    conflict: 'Notes were changed in another tab. Download your draft, then reload the page to merge your changes.',
    failedSelection: 'Notes have not loaded yet. Retry loading before adding text.',
    clipPage: 'Copy selection or page to notes',
  },
};

export function useNotebook(lang: Language) {
  const t = notebookCopy[lang];
  const [draft, setDraft] = useState<Notebook | null>(null);
  const [baseline, setBaseline] = useState<Notebook | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);
  const dirty = !!draft && (draft.title !== baseline?.title || draft.content !== baseline?.content);
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;
  const load = useCallback(async () => {
    setError('');
    try {
      const value = readNotebook(localStorage);
      setDraft(value); setBaseline(value);
    } catch (err) { setError(err instanceof Error ? err.message : 'Storage unavailable'); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key !== notebookKey || dirtyRef.current) return;
      void load();
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, [load]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (dirty) event.preventDefault(); };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  async function save() {
    if (!draft) return;
    setSaving(true); setError(''); setNotice('');
    const submitted = draft;
    try {
      const value = writeNotebook(localStorage, submitted);
      if (!value) throw Error(t.conflict);
      setBaseline(value);
      setDraft(current => current ? { ...current, revision: value.revision, updatedAt: value.updatedAt } : value);
      setNotice(t.saved);
    } catch (err) { setError(err instanceof Error ? err.message : 'Request failed'); }
    finally { setSaving(false); }
  }
  function capture(text: string, source: string) {
    if (!draft) { setNotice(t.failedSelection); return false; }
    const addition = `\n\n> ${text.trim().replace(/\n/g, '\n> ')}\n\n${t.source}: ${source}\n`;
    if (draft.content.length + addition.length > 200000) { setNotice(t.selectionLong); return false; }
    setDraft({ ...draft, content: draft.content + addition });
    setNotice(t.clipped);
    return true;
  }
  function download() {
    if (!draft) return;
    const url = URL.createObjectURL(new Blob([`# ${draft.title}\n\n${draft.content}`], { type: 'text/markdown;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = 'feedbacker-notities.md'; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function email() {
    if (!draft) return;
    const href = `mailto:?subject=${encodeURIComponent(draft.title)}&body=${encodeURIComponent(draft.content)}`;
    if (href.length > 1800) { setNotice(t.mailLong); return; }
    location.href = href; setNotice(t.mailHint);
  }
  function clear() {
    try { clearNotebook(localStorage); } catch { /* storage unavailable: clearing the draft is still useful */ }
    const value = emptyNotebook();
    setDraft(value); setBaseline(value);
  }
  return { draft, setDraft, dirty, error, notice, setNotice, saving, load, save, capture, download, email, clear };
}

export function NotebookPage({ lang, model }: { lang: Language; model: ReturnType<typeof useNotebook> }) {
  const t = notebookCopy[lang];
  const { draft } = model;
  return <section className="panel notebook-page">
    <div className="notebook-toolbar">
      <span role="status">{model.dirty ? t.dirty : draft?.updatedAt ? `${t.saved} · ${new Date(draft.updatedAt).toLocaleString(lang)}` : ''}</span>
      <button className="button primary small" disabled={!draft || model.saving || !draft.title.trim()} onClick={() => void model.save()}><Save size={15} />{t.save}</button>
      <button className="button secondary small" disabled={!draft} onClick={model.download}><Download size={15} />{t.download}</button>
      <button className="button secondary small" disabled={!draft} onClick={model.email}><Mail size={15} />{t.mail}</button>
    </div>
    {model.error && <div className="alert error" role="alert"><span>{t.error} {model.error}</span>{!draft && <button onClick={() => void model.load()}>{t.retry}</button>}</div>}
    {!draft ? <p>{t.loading}</p> : <>
      <label>{t.titleLabel}<input maxLength={200} value={draft.title} onChange={event => model.setDraft({ ...draft, title: event.target.value })} /></label>
      <label>{t.content}<textarea className="notebook-editor" maxLength={200000} value={draft.content} onChange={event => model.setDraft({ ...draft, content: event.target.value })} /></label>
      <p>{t.hint}</p><p>{t.mailHint}</p><p>{t.local}</p>
    </>}
  </section>;
}

export function SelectionNotes({ lang, enabled, capture, open, source }: {
  lang: Language; enabled: boolean; capture: (text: string, source: string) => boolean; open: () => void; source: string;
}) {
  const t = notebookCopy[lang];
  const [selection, setSelection] = useState<{ text: string; source: string; x: number; y: number } | null>(null);
  const toolbar = useRef<HTMLDivElement>(null);
  const selectedText = useRef('');
  useEffect(() => {
    selectedText.current = '';
    if (!enabled) { setSelection(null); return; }
    const inspect = () => {
      const active = document.activeElement;
      if (active instanceof Element && active.closest('.notebook-clip, .selection-notes')) return;
      if (active instanceof HTMLTextAreaElement && active.readOnly && active.selectionEnd > active.selectionStart) {
        selectedText.current = active.value.slice(active.selectionStart, active.selectionEnd);
        const rect = active.getBoundingClientRect();
        setSelection({ text: active.value.slice(active.selectionStart, active.selectionEnd), source, x: Math.max(12, Math.min(rect.x, innerWidth - 290)), y: Math.max(12, Math.min(rect.bottom + 10, innerHeight - 100)) });
        return;
      }
      const selected = window.getSelection();
      const node = selected?.anchorNode;
      const element = node instanceof Element ? node : node?.parentElement;
      if (element?.closest('.selection-notes')) return;
      if (!selected?.rangeCount || selected.isCollapsed || !element || element.closest('.notebook-page, input, textarea, [inert]')) { selectedText.current = ''; setSelection(null); return; }
      const text = selected.toString().trim();
      selectedText.current = text;
      if (!text) { setSelection(null); return; }
      const rect = selected.getRangeAt(0).getBoundingClientRect();
      setSelection({ text, source, x: Math.max(12, Math.min(rect.x, innerWidth - 290)), y: Math.max(12, Math.min(rect.bottom + 10, innerHeight - 100)) });
    };
    document.addEventListener('mouseup', inspect);
    document.addEventListener('keyup', inspect);
    let timer: ReturnType<typeof setTimeout>;
    const changed = () => { clearTimeout(timer); timer = setTimeout(inspect, 200); };
    document.addEventListener('selectionchange', changed);
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setSelection(null); };
    const scroll = () => setSelection(null);
    document.addEventListener('keydown', escape);
    window.addEventListener('scroll', scroll, true);
    return () => {
      document.removeEventListener('mouseup', inspect); document.removeEventListener('keyup', inspect);
      document.removeEventListener('selectionchange', changed); clearTimeout(timer);
      document.removeEventListener('keydown', escape); window.removeEventListener('scroll', scroll, true);
    };
  }, [enabled, source]);
  function copyToNotes() {
    const dialog = document.querySelector<HTMLElement>('.modal');
    const main = dialog ?? document.querySelector<HTMLElement>('main');
    if (!main) return;
    const clone = main.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('button, nav, footer, input, select, .notebook-notice, [hidden]').forEach(element => element.remove());
    clone.querySelectorAll('textarea').forEach(element => {
      if (element.readOnly) element.replaceWith(document.createTextNode(element.value));
      else element.remove();
    });
    clone.querySelectorAll('p, pre, h1, h2, h3, li, section, article, label, .stat-card').forEach(element => element.append('\n\n'));
    const text = selectedText.current.trim() || clone.textContent?.trim() || '';
    if (text && capture(text, source)) {
      selectedText.current = '';
      const active = document.activeElement;
      if (active instanceof HTMLTextAreaElement) active.setSelectionRange(0, 0);
      window.getSelection()?.removeAllRanges();
      setSelection(null);
    }
  }
  if (!enabled) return null;
  return createPortal(<>
    <button className="notebook-clip" title={t.clipPage} aria-label={t.clipPage} onMouseDown={event => event.preventDefault()} onClick={copyToNotes}><StickyNote size={20} /><span>{t.add}</span></button>
    {selection && <div ref={toolbar} className="selection-notes" role="toolbar" aria-label={t.nav} style={{ left: selection.x, top: selection.y }} onMouseDown={event => event.preventDefault()}>
    <button onClick={() => { if (capture(selection.text, selection.source)) { selectedText.current = ''; setSelection(null); const active = document.activeElement; if (active instanceof HTMLTextAreaElement) active.setSelectionRange(0, 0); window.getSelection()?.removeAllRanges(); } }}><StickyNote size={15} />{t.add}</button>
    <button onClick={() => { setSelection(null); open(); }} aria-label={t.open}>↗</button>
    <button onClick={() => setSelection(null)} aria-label={t.dismiss}><X size={14} /></button>
  </div>}
  </>, document.body);
}
