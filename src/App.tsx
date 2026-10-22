import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDownToLine, ArrowRight, ArrowUpRight, AudioLines, BarChart3, Check, CheckCheck,
  ChevronRight, CircleHelp, FilePlus2, FileText, FolderOpen, Globe2, Layers3, LayoutDashboard,
  LockKeyhole, MessageSquareText, Moon, Search, ShieldCheck,
  Sun, Trash2, TrendingUp, X, Route, Sparkles, MessagesSquare,
} from 'lucide-react';
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { copy, labels, type Language } from './i18n';
import { priorities, sentiments, statuses, type Feedback, type FeedbackEdits, type Source } from './shared';
import { SummaryCallout, SummaryGuide } from './SummaryGuide';
import { PromptBuilder } from './PromptBuilder';
import { DisclaimerContent, TeamSection, aboutCopy } from './About';
import { AiExportPage, aiExportCopy } from './ChatWizard';
import { GuidedTour, TourInvitation } from './GuidedTour';
import { helpAiCopy } from './helpAiCopy';
import { readCookie as cookie, writeCookie as setCookie, deleteCookie, preferenceCookies } from './preferences';
import { NotebookPage, SelectionNotes, notebookCopy, useNotebook } from './Notebook';
import { addDocuments, editFeedback, emptyLibrary, removeSource, toSnapshot, type Library } from './library';
import { readDocuments, type ImportIssue } from './documents';
import { DropOverlay, EmptyWorkspace, FilePicker, UploadZone, formatIssue, importCopy } from './Importer';

type View = 'overview' | 'feedback' | 'sources' | 'ai' | 'chat' | 'notes';
type Theme = 'light' | 'dark';
const colors = ['#6c9684', '#d4a260', '#e56860', '#8d91a2'];
const initials = (value: string) => value.split(/\s+/).filter(Boolean).slice(0, 2).map(s => s[0]).join('').toUpperCase();
const tone = (value: string) => value === 'Positive' || value === 'Done' ? 'positive' : value === 'Needs attention' || value === 'High' ? 'negative' : value === 'Mixed' || value === 'Planned' ? 'mixed' : 'neutral';

export default function App() {
  const [lang, setLang] = useState<Language>(() => cookie('feedbacker-language') === 'nl' ? 'nl' : 'en');
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = cookie('feedbacker-theme');
    return saved === 'dark' || saved === 'light' ? saved : matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  const [remember, setRemember] = useState(cookie('feedbacker-preferences') === 'yes');
  const [cookieNotice, setCookieNotice] = useState(!cookie('feedbacker-preferences'));
  const [privacy, setPrivacy] = useState(false);
  const [disclaimer, setDisclaimer] = useState(false);
  const [workspace, setWorkspace] = useState(location.hash.startsWith('#workspace'));
  const [view, setView] = useState<View>('overview');
  const [library, setLibrary] = useState<Library>(emptyLibrary);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState<[number, number]>([0, 0]);
  const [issues, setIssues] = useState<ImportIssue[]>([]);
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearNotes, setClearNotes] = useState(false);
  const [undo, setUndo] = useState<Library | null>(null);
  const [toast, setToast] = useState('');
  const [selected, setSelected] = useState<Feedback | null>(null);
  const [source, setSource] = useState<Source | null>(null);
  const [query, setQuery] = useState('');
  const [product, setProduct] = useState('');
  const [customer, setCustomer] = useState('');
  const [topic, setTopic] = useState('');
  const [sentiment, setSentiment] = useState('');
  const [status, setStatus] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [tourIndex, setTourIndex] = useState<number | null>(null);
  const [tourOffered, setTourOffered] = useState(cookie('feedbacker-tour') === 'seen');
  const previousView = useRef<View>('overview');
  const t = copy[lang];
  const help = helpAiCopy[lang];
  const about = aboutCopy[lang];
  const xc = aiExportCopy[lang];
  const ic = importCopy[lang];
  const data = useMemo(() => toSnapshot(library), [library]);
  const hasData = data.sources.length > 0;
  const fileInput = useRef<HTMLInputElement>(null);
  const notebook = useNotebook(lang);
  const nt = notebookCopy[lang];
  const viewLabel = view === 'notes' ? nt.nav : view === 'ai' ? help.ai : view === 'chat' ? xc.nav : t[view];
  const label = (value: string) => labels[lang][value] ?? value;
  const formatDate = (value: string) => value ? new Date(`${value.slice(0, 10)}T12:00:00`).toLocaleDateString(lang === 'nl' ? 'nl-NL' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : t.unknown;

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.lang = lang;
    document.title = lang === 'nl' ? 'Feedbacker — Klantinzichten' : 'Feedbacker — Customer intelligence';
    if (remember) {
      setCookie('feedbacker-theme', theme);
      setCookie('feedbacker-language', lang);
      setCookie('feedbacker-preferences', 'yes');
    }
  }, [theme, lang, remember]);
  useEffect(() => {
    const listener = () => setWorkspace(location.hash.startsWith('#workspace'));
    window.addEventListener('hashchange', listener);
    return () => window.removeEventListener('hashchange', listener);
  }, []);
  useEffect(() => {
    if (!workspace && location.hash === '#structured-summaries') {
      const frame = requestAnimationFrame(() => document.getElementById('structured-summaries')?.scrollIntoView());
      return () => cancelAnimationFrame(frame);
    }
  }, [workspace]);
  useEffect(() => {
    if (!workspace) setTourIndex(null);
  }, [workspace]);
  useEffect(() => {
    if (remember && tourOffered) setCookie('feedbacker-tour', 'seen');
  }, [remember, tourOffered]);
  useEffect(() => {
    const header = document.querySelector<HTMLElement>(workspace ? '.app-header' : '.site-header');
    const sidebar = document.querySelector<HTMLElement>('.sidebar');
    const measure = () => {
      document.documentElement.style.setProperty('--header-height', `${header?.offsetHeight ?? 0}px`);
      document.documentElement.style.setProperty('--mobile-nav-height', `${sidebar?.offsetHeight ?? 0}px`);
    };
    const observer = new ResizeObserver(measure);
    if (header) observer.observe(header);
    if (sidebar) observer.observe(sidebar);
    measure();
    return () => observer.disconnect();
  }, [workspace]);
  useEffect(() => {
    if (!hasData) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [hasData]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => { setToast(''); setUndo(null); }, undo ? 8000 : 4500);
    return () => clearTimeout(timer);
  }, [toast, undo]);

  const importFiles = useCallback(async (files: File[]) => {
    if (!files.length || importing) return;
    setImporting(true);
    setProgress([0, files.length]);
    try {
      const result = await readDocuments(files, (done, total) => setProgress([done, total]));
      setIssues(result.issues);
      if (result.documents.length) {
        setLibrary(current => addDocuments(current, result.documents));
        setUndo(null);
        setToast(ic.added(result.documents.length, result.documents.reduce((sum, document) => sum + document.feedback.length, 0)));
      } else setToast(ic.nothing);
    } finally { setImporting(false); }
  }, [importing, ic]);
  const pickFiles = () => fileInput.current?.click();
  function clearAll() {
    setLibrary(emptyLibrary());
    setIssues([]);
    setSelected(null);
    setSource(null);
    reset();
    if (clearNotes) notebook.clear();
    setConfirmClear(false);
    setClearNotes(false);
    setUndo(null);
    setToast(ic.cleared);
  }
  function deleteSource(item: Source) {
    setUndo(library);
    setLibrary(removeSource(library, item.id));
    setToast(ic.removed(item.customer));
  }
  const openWorkspace = () => { location.hash = 'workspace'; setWorkspace(true); window.scrollTo(0, 0); };
  const openNotes = () => { openWorkspace(); setSelected(null); setSource(null); setView('notes'); notebook.setNotice(''); };
  const reset = () => { setQuery(''); setProduct(''); setCustomer(''); setTopic(''); setSentiment(''); setStatus(''); setFrom(''); setTo(''); };
  const activeFilters = Boolean(query || product || customer || topic || sentiment || status || from || to);
  const sourceMap = useMemo(() => new Map(data.sources.map(item => [item.id, item])), [data.sources]);
  const filtered = useMemo(() => data.feedback.filter(item => {
    if (product && item.product !== product || customer && item.customer !== customer || topic && !item.topics.includes(topic) || sentiment && item.sentiment !== sentiment || status && item.status !== status) return false;
    if (from && (!item.date || item.date < from) || to && (!item.date || item.date > to)) return false;
    return !query || [item.title, item.excerpt, item.evidence, item.notes, item.customer, item.product, ...item.topics, sourceMap.get(item.sourceId)?.text ?? ''].join(' ').toLocaleLowerCase().includes(query.toLocaleLowerCase());
  }), [data, query, product, customer, topic, sentiment, status, from, to, sourceMap]);
  const selectedSources = data.sources.filter(s => filtered.some(f => f.sourceId === s.id));
  const topics = [...new Set(data.feedback.flatMap(item => item.topics))].sort();
  const topicCounts = [...new Set(filtered.flatMap(item => item.topics))].map(name => ({
    name, count: filtered.filter(item => item.topics.includes(name)).length,
    customers: new Set(filtered.filter(item => item.topics.includes(name)).map(item => item.customer)).size,
  })).sort((a, b) => b.count - a.count);
  const sentimentData = sentiments.map((name, i) => ({ name: label(name), value: filtered.filter(f => f.sentiment === name).length, color: colors[i] }));
  const trendData = [...new Set(filtered.map(f => f.date).filter(Boolean))].sort().map(date => ({
    date: formatDate(date), count: filtered.filter(f => f.date === date).length,
  }));
  const reviewedCount = filtered.filter(f => f.status !== 'New').length;
  const summarySources = selectedSources.map(s => ({ ...s, matching: filtered.filter(f => f.sourceId === s.id) }));
  const firstFeedbackId = filtered[0]?.id;
  const tourSteps = useMemo(() => [
    ...(hasData ? [
      { view: 'overview' as View, target: '.stats-grid .stat-card:first-child', title: help.tourIntro, text: help.tourIntroText },
      { view: 'overview' as View, target: '.secondary-filters', title: help.tourFilters, text: help.tourFiltersText },
      { view: 'overview' as View, target: '.search-field', title: help.tourSearch, text: help.tourSearchText },
    ] : [{ view: 'overview' as View, target: '.upload-zone', title: ic.tourTitle, text: ic.tourText }]),
    ...(firstFeedbackId ? [
      { view: 'overview' as View, target: '.topics-panel .panel-heading', title: help.tourThemes, text: help.tourThemesText },
      { view: 'feedback' as View, target: '.evidence', title: help.tourReview, text: help.tourReviewText, feedbackId: firstFeedbackId },
    ] : []),
    { view: 'sources' as View, target: '.summary-callout', title: help.tourSources, text: help.tourSourcesText },
    { view: 'ai' as View, target: '[data-tour="ai-context"] .builder-section-heading', title: help.tourAi, text: help.tourAiText },
    { view: 'ai' as View, target: '[data-tour="ai-goals"]', title: help.tourGoals, text: help.tourGoalsText },
    { view: 'ai' as View, target: '[data-tour="ai-preview"]', title: help.tourPrompt, text: help.tourPromptText },
    { view: 'chat' as View, target: '.wizard-steps', title: help.tourChat, text: help.tourChatText },
    { view: 'chat' as View, target: '.wizard-summary', title: help.tourChatSummary, text: help.tourChatSummaryText },
    { view: 'notes' as View, target: '.notebook-toolbar', title: help.tourNotes, text: help.tourNotesText },
    { view: 'overview' as View, target: '.page-actions', title: help.tourExport, text: help.tourExportText },
    { view: 'overview' as View, target: '[data-tour="legal"]', title: help.tourLegal, text: help.tourLegalText },
  ], [help, ic, hasData, firstFeedbackId]);
  useEffect(() => {
    if (tourIndex === null) return;
    const step = tourSteps[tourIndex];
    if (!step) { setTourIndex(null); return; }
    setView(step.view);
    setSource(null);
    setSelected('feedbackId' in step ? data.feedback.find(item => item.id === step.feedbackId) ?? null : null);
  }, [tourIndex, tourSteps, data.feedback]);
  function startTour() {
    previousView.current = view;
    setPrivacy(false);
    setDisclaimer(false);
    setSelected(null);
    setSource(null);
    setTourOffered(true);
    setCookieNotice(false);
    openWorkspace();
    setTourIndex(0);
  }
  function stopTour(finished = false) {
    setTourIndex(null);
    setSelected(null);
    setSource(null);
    setView(previousView.current);
    if (finished) setToast(help.tourReady);
    requestAnimationFrame(() => document.querySelector<HTMLButtonElement>('.tour-launch')?.focus());
  }
  function changePreferences(value: boolean) {
    setRemember(value);
    setCookieNotice(false);
    if (!value) preferenceCookies.forEach(deleteCookie);
  }

  function exportCsv() {
    const columns = ['title', 'customer', 'product', 'date', 'topics', 'sentiment', 'priority', 'status', 'notes', 'evidence'] as const;
    const cell = (value: string) => `"${(/^\s*[=+\-@]|^[\t\r\n]/.test(value) ? `'${value}` : value).replace(/"/g, '""')}"`;
    const text = '\uFEFF' + [columns.join(','), ...filtered.map(item => columns.map(key => cell(Array.isArray(item[key]) ? item[key].join('; ') : item[key])).join(','))].join('\r\n');
    const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = 'feedbacker-export.csv'; anchor.click(); URL.revokeObjectURL(url);
  }

  const controls = <div className="preferences">
    <button className="icon-button language" onClick={() => setLang(lang === 'en' ? 'nl' : 'en')} aria-label={t.language}><Globe2 size={16} /><span>{lang.toUpperCase()}</span></button>
    <span className="control-divider" />
    <button className="icon-button" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} aria-label={t.appearance}>{theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}</button>
  </div>;
  const brand = <span className="brand"><span className="brand-symbol"><AudioLines size={22} strokeWidth={2.1} /></span>Feedbacker<span className="brand-dot">.</span></span>;
  const emptyState = <div className="empty"><MessageSquareText size={30} /><h3>{t.noData}</h3><p>{t.noDataText}</p>{activeFilters && <button className="button secondary" onClick={reset}>{t.reset}</button>}</div>;

  return <>
    {!workspace ? <div className="landing" inert={tourIndex !== null}>
      <header className="site-header container"><a href="#" aria-label="Feedbacker">{brand}</a><nav><a href="#approach">{t.explore}</a><a href="#structured-summaries">{t.structuredNav}</a><a href="#transparency">{t.privacy}</a><a href="#team">{about.teamNav}</a></nav><div className="header-right">{controls}<button className="button primary small" onClick={openWorkspace}>{t.open}<ArrowUpRight size={16} /></button></div></header>
      <main>
        <section className="hero container">
          <div className="hero-copy"><div className="eyebrow"><span className="tiny-square" />{t.heroTag}</div><h1>{t.headline.split('\n')[0]}<br /><span>{t.headline.split('\n')[1]}</span></h1><p className="hero-description">{t.heroText}</p><div className="hero-actions"><button className="button primary" onClick={openWorkspace}>{t.open}<ArrowRight size={18} /></button><a className="text-link" href="#approach">{t.explore}<ChevronRight size={16} /></a></div><div className="privacy-note"><ShieldCheck size={15} />{t.privacyTag}</div></div>
          <div className="hero-visual" aria-hidden="true">
            <div className="visual-grid" /><div className="visual-halo" />
            <div className="floating-label"><span className="live-dot" />{t.heroNote}</div>
            <div className="preview-card">
              <div className="preview-top"><span className="mini-brand"><AudioLines size={17} /> Feedbacker</span><span className="preview-ellipsis">•••</span></div>
              <div className="preview-body"><div className="preview-caption">{t.intelligence}</div><h3>{t.roadmap}</h3><div className="preview-stat"><span>01</span><div><strong>{t.step1}</strong><small>DOCX → {t.feedback}</small></div><FileText size={24} /></div><div className="preview-chart"><div style={{ height: '39%' }} /><div style={{ height: '63%' }} /><div style={{ height: '46%' }} /><div style={{ height: '78%' }} /><div style={{ height: '58%' }} /><div style={{ height: '91%' }} /><div style={{ height: '72%' }} /></div><div className="preview-footer"><span>{t.feature2}</span><ArrowUpRight size={15} /></div></div>
            </div>
            <div className="floating-note"><span className="note-icon"><CheckCheck size={19} /></span><div><strong>{t.offline}</strong><span>{t.unedited}</span></div></div>
            <div className="visual-caption">FEEDBACKER / {t.local.toUpperCase()}</div>
          </div>
        </section>
        <div className="principle-strip"><div className="container"><span><FolderOpen size={17} /> DOCX → {t.feedback}</span><span><LockKeyhole size={17} />{t.localTitle}</span><span><CheckCheck size={17} />{t.unedited}</span></div></div>
        <section id="approach" className="section container"><div className="section-heading"><span className="eyebrow">01 / {t.workspace.toUpperCase()}</span><h2>{t.featureTitle}</h2><p>{t.featureText}</p></div><div className="feature-grid">{[{ icon: <Layers3 />, title: t.feature1, text: t.feature1Text }, { icon: <Search />, title: t.feature2, text: t.feature2Text }, { icon: <ArrowUpRight />, title: t.feature3, text: t.feature3Text }].map((f, i) => <article className="feature-card" key={f.title}><div className="feature-top"><span className="feature-icon">{f.icon}</span><span>0{i + 1}</span></div><h3>{f.title}</h3><p>{f.text}</p></article>)}</div></section>
        <section className="workflow-section"><div className="container workflow-layout"><div><span className="eyebrow">02 / {t.roadmap.toUpperCase()}</span><h2>{t.workflow}</h2><p>{t.workflowText}</p><button className="button primary" onClick={openWorkspace}>{t.open}<ArrowRight size={17} /></button></div><div className="steps">{[[t.step1, t.step1Text], [t.step2, t.step2Text], [t.step3, t.step3Text]].map(([title, text], i) => <div className="step" key={title}><span className="step-number">0{i + 1}</span><div><h3>{title}</h3><p>{text}</p></div></div>)}</div></div></section>
        <section className="container landing-help"><Route size={24} /><div><h2>{help.inviteTitle}</h2><p>{help.inviteText}</p></div><button className="button secondary" onClick={startTour}>{help.start}<ArrowRight size={15} /></button></section>
        <SummaryGuide lang={lang} />
        <section id="transparency" className="section container trust-section"><div className="section-heading"><span className="eyebrow"><ShieldCheck size={15} /> {t.offline.toUpperCase()}</span><h2 className="preserve-lines">{t.trustTitle}</h2><p>{t.trustText}</p></div><div className="trust-grid">{[[t.localTitle, t.localText], [t.analysisTitle, t.analysisText], [t.storageTitle, t.storageText]].map(([title, text]) => <article key={title}><Check size={18} /><h3>{title}</h3><p>{text}</p></article>)}</div><div className="disclaimer"><CircleHelp size={17} /><p>{t.independent}</p><button className="text-link" onClick={() => setDisclaimer(true)}>{about.disclaimer}<ArrowUpRight size={14} /></button></div></section>
        <TeamSection lang={lang} />
      </main>
      <footer className="site-footer container"><div>{brand}<p>{t.rights}</p></div><div className="footer-links"><button className="text-link" onClick={() => setPrivacy(true)}>{t.privacy}<ArrowUpRight size={14} /></button><button className="text-link" onClick={() => setDisclaimer(true)}>{about.disclaimer}<ArrowUpRight size={14} /></button></div><span>© {new Date().getFullYear()} Feedbacker · NL Vibe Coder Team</span></footer>
    </div> : <div className="app-shell" inert={tourIndex !== null}>
      <aside className="sidebar"><a className="sidebar-brand" href="#">{brand}</a><div className="workspace-switch"><span className="workspace-avatar">F</span><div><strong>Feedbacker</strong><small>{t.local}</small></div><LockKeyhole size={13} /></div><span className="nav-caption">{t.workspace}</span><nav>{[{ id: 'overview' as const, icon: <LayoutDashboard size={17} />, text: t.overview }, { id: 'feedback' as const, icon: <MessageSquareText size={17} />, text: t.feedback }, { id: 'sources' as const, icon: <FolderOpen size={17} />, text: t.sources }, { id: 'ai' as const, icon: <Sparkles size={17} />, text: help.ai }, { id: 'chat' as const, icon: <MessagesSquare size={17} />, text: xc.nav }].map(item => <button key={item.id} onClick={() => setView(item.id)} className={`nav-item ${view === item.id ? 'active' : ''}`}>{item.icon}{item.text}{item.id === 'feedback' && <span className="nav-count">{data.feedback.length}</span>}</button>)}</nav><div className="sidebar-bottom"><div className="local-card"><ShieldCheck size={20} /><strong>{t.offline}</strong><p>{t.localText}</p></div><div data-tour="legal"><button className="nav-item" onClick={() => setPrivacy(true)}><CircleHelp size={17} />{t.privacy}</button><button className="nav-item" onClick={() => setDisclaimer(true)}><FileText size={17} />{about.disclaimer}</button></div><a href="#" className="nav-item"><ArrowUpRight size={17} />{t.back}</a><div className="sidebar-footer"><span className="live-dot" />{t.local}</div></div></aside>
      <div className="app-main"><header className="app-header"><div className="breadcrumb"><span>Feedbacker</span><ChevronRight size={13} /><strong>{viewLabel}</strong></div><div className="header-right"><button className="text-link notebook-launch" onClick={() => setView('notes')}><FileText size={16} />{nt.nav}{notebook.dirty ? ' *' : ''}</button><button className="text-link tour-launch" onClick={startTour}><Route size={16} />{help.tour}</button><span className="connection"><span className="live-dot" />{t.offline}</span>{controls}</div></header>
        <main className="workspace-content">
          <div className="page-heading"><div><div className="eyebrow">{t.intelligence}</div><h1>{view === 'notes' ? nt.title : view === 'overview' ? t.welcome : view === 'feedback' ? t.inboxTitle : view === 'ai' ? help.aiTitle : view === 'chat' ? xc.title : t.sourcesTitle}</h1><p>{view === 'notes' ? nt.intro : view === 'overview' ? t.overviewText : view === 'feedback' ? t.inboxText : view === 'ai' ? help.aiDescription : view === 'chat' ? xc.intro : t.sourcesText}</p></div>{view !== 'ai' && view !== 'chat' && view !== 'notes' && <div className="page-actions">{hasData && <><button className="button ghost danger-text" onClick={() => setConfirmClear(true)} disabled={importing}><Trash2 size={15} />{ic.clear}</button><button className="button secondary" onClick={exportCsv} disabled={!filtered.length}><ArrowDownToLine size={15} />{t.export}</button></>}<button className="button primary" onClick={pickFiles} disabled={importing}><FilePlus2 size={15} />{importing ? t.scanning : ic.add}</button></div>}</div>
          <FilePicker inputRef={fileInput} onFiles={files => void importFiles(files)} />
          {view === 'notes' && <NotebookPage lang={lang} model={notebook} />}
          {!tourOffered && !cookieNotice && <TourInvitation lang={lang} start={startTour} dismiss={() => setTourOffered(true)} />}
          {issues.length > 0 && view !== 'notes' && view !== 'ai' && view !== 'chat' && <details className="alert warning" open={!hasData}><summary>{ic.issuesTitle(issues.length)}</summary><ul>{issues.map((issue, i) => <li key={i}>{formatIssue(issue, lang)}</li>)}</ul><button className="text-link" onClick={() => setIssues([])}><X size={13} />{t.close}</button></details>}
          {view === 'sources' && <SummaryCallout lang={lang} />}
          {!hasData && view !== 'ai' && view !== 'chat' && view !== 'notes' && <EmptyWorkspace lang={lang} busy={importing} progress={progress} pick={pickFiles} onFiles={files => void importFiles(files)} />}
          <div className="filter-bar" hidden={view === 'ai' || view === 'chat' || !hasData}><div className="search-field"><Search size={17} /><input aria-label={t.search} placeholder={t.search} value={query} onChange={e => setQuery(e.target.value)} />{query && <button className="icon-button" aria-label={t.reset} onClick={() => setQuery('')}><X size={14} /></button>}</div><div className="filter-selects"><select aria-label={t.product} value={product} onChange={e => setProduct(e.target.value)}><option value="">{t.allProducts}</option>{[...new Set(data.feedback.map(f => f.product))].sort().map(p => <option key={p}>{p}</option>)}</select><select aria-label={t.customer} value={customer} onChange={e => setCustomer(e.target.value)}><option value="">{t.allCustomers}</option>{[...new Set(data.feedback.map(f => f.customer))].sort().map(c => <option key={c}>{c}</option>)}</select></div></div>
          <div className="secondary-filters" hidden={view === 'ai' || view === 'chat' || !hasData}><select aria-label={t.topics} value={topic} onChange={e => setTopic(e.target.value)}><option value="">{t.allTopics}</option>{topics.map(name => <option key={name} value={name}>{label(name)}</option>)}</select><select aria-label={t.sentiment} value={sentiment} onChange={e => setSentiment(e.target.value)}><option value="">{t.allSentiments}</option>{sentiments.map(name => <option key={name} value={name}>{label(name)}</option>)}</select><select aria-label={t.status} value={status} onChange={e => setStatus(e.target.value)}><option value="">{t.allStatuses}</option>{statuses.map(name => <option key={name} value={name}>{label(name)}</option>)}</select><div className="date-filter"><input type="date" aria-label={t.from} title={t.from} value={from} onChange={e => setFrom(e.target.value)} /><span>–</span><input type="date" aria-label={t.to} title={t.to} value={to} onChange={e => setTo(e.target.value)} /></div>{activeFilters && <button className="text-link reset" onClick={reset}><X size={13} />{t.reset}</button>}</div>
          <div hidden={view !== 'ai'}><PromptBuilder lang={lang} feedback={data.feedback} filtered={filtered} sources={data.sources} remember={remember} changePreferences={changePreferences} /></div>
          {view === 'chat' && <AiExportPage lang={lang} feedback={data.feedback} filtered={filtered} sources={data.sources} onAdd={pickFiles} remember={remember} changePreferences={changePreferences} />}
          {hasData && <>
            {view === 'overview' && <>
              <div className="stats-grid">{[
                { name: t.observations, value: filtered.length, hint: t.across, icon: <MessageSquareText size={17} /> },
                { name: t.sessions, value: selectedSources.length, hint: t.originalDocs, icon: <FileText size={17} /> },
                { name: t.attention, value: filtered.filter(f => f.sentiment === 'Needs attention').length, hint: t.heuristic, icon: <AudioLines size={17} /> },
                { name: t.reviewed, value: `${filtered.length ? Math.round(reviewedCount / filtered.length * 100) : 0}%`, hint: t.progress, icon: <CheckCheck size={17} /> },
              ].map((stat, i) => <div className="stat-card" key={stat.name}><div><span>{stat.name}</span><span className={`stat-icon stat-${i}`}>{stat.icon}</span></div><strong>{stat.value}</strong><small>{stat.hint}</small></div>)}</div>
              {filtered.length ? <>
                <div className="chart-grid"><section className="panel topics-panel"><div className="panel-heading"><div><h2>{t.themes}</h2><p>{t.themesText}</p></div><BarChart3 size={18} /></div><div className="topic-bars">{topicCounts.slice(0, 5).map((item, i) => <button key={item.name} className="topic-bar" onClick={() => setTopic(item.name)}><div><span>{label(item.name)}</span><strong>{item.count}<small> / {filtered.length}</small></strong></div><div className="bar-track"><span style={{ width: `${item.count / filtered.length * 100}%`, opacity: 1 - i * .11 }} /></div></button>)}</div></section>
                <section className="panel sentiment-panel"><div className="panel-heading"><div><h2>{t.sentiment}</h2><p>{t.sentimentText}</p></div><AudioLines size={18} /></div><div className="donut-layout"><div className="donut-chart"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={sentimentData} dataKey="value" innerRadius="70%" outerRadius="91%" paddingAngle={3} stroke="none" isAnimationActive={false}>{sentimentData.map(item => <Cell key={item.name} fill={item.color} />)}</Pie><Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text)' }} /></PieChart></ResponsiveContainer><div className="donut-center"><strong>{filtered.length}</strong><span>{t.observations}</span></div></div><div className="sentiment-legend">{sentimentData.map((item, i) => <button key={item.name} onClick={() => setSentiment(sentiments[i])}><span style={{ background: item.color }} /><span>{item.name}</span><strong>{item.value}</strong></button>)}</div></div></section></div>
                <div className="insights-grid"><section className="panel trend-panel"><div className="panel-heading"><div><h2>{t.trend}</h2><p>{t.trendText}</p></div><TrendingUp size={18} /></div><div className="trend-chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={trendData} margin={{ top: 16, right: 12, left: -25, bottom: 0 }}><defs><linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#e94d49" stopOpacity={.2} /><stop offset="100%" stopColor="#e94d49" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="var(--border)" strokeDasharray="3 6" vertical={false} /><XAxis dataKey="date" tick={{ fill: 'var(--muted)', fontSize: 11 }} tickLine={false} axisLine={false} dy={8} /><YAxis allowDecimals={false} tick={{ fill: 'var(--muted)', fontSize: 11 }} tickLine={false} axisLine={false} /><Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text)' }} /><Area type="monotone" name={t.observations} dataKey="count" stroke="#e94d49" strokeWidth={2.5} fill="url(#trendFill)" dot={{ r: 4, strokeWidth: 3, fill: 'var(--surface)' }} isAnimationActive={false} /></AreaChart></ResponsiveContainer></div></section>
                <section className="panel brief-panel"><span className="eyebrow"><Layers3 size={14} />{t.summary}</span><h2>{topicCounts[0] ? label(topicCounts[0].name) : t.summaryLabel}</h2><p>{t.summaryText}</p><div className="brief-themes">{topicCounts.slice(0, 3).map((item, i) => <button key={item.name} onClick={() => setTopic(item.name)}><span>0{i + 1}</span><div><strong>{label(item.name)}</strong><small>{item.count} {t.mentions} · {item.customers} {t.customers}</small></div><ArrowUpRight size={15} /></button>)}</div><span className="method-note"><ShieldCheck size={12} />{t.extractive}</span></section></div>
                <section className="panel recent-panel"><div className="panel-heading"><div><h2>{t.latest}</h2><p>{filtered.length} {t.items} · {selectedSources.length} {t.sessions.toLowerCase()}</p></div><button className="text-link" onClick={() => setView('feedback')}>{t.viewAll}<ArrowRight size={14} /></button></div>{filtered.slice(0, 4).map(item => <FeedbackRow key={item.id} item={item} onClick={() => setSelected(item)} label={label} formatDate={formatDate} />)}</section>
              </> : emptyState}
            </>}
            {view === 'feedback' && <><div className="list-caption"><span>{filtered.length} {t.results}</span><span>{t.extractive}</span></div><section className="panel feedback-list">{filtered.length ? filtered.map(item => <FeedbackRow key={item.id} item={item} onClick={() => setSelected(item)} label={label} formatDate={formatDate} />) : emptyState}</section></>}
            {view === 'sources' && <><UploadZone compact lang={lang} busy={importing} progress={progress} pick={pickFiles} onFiles={files => void importFiles(files)} /><div className="list-caption"><span>{selectedSources.length} {t.sessions.toLowerCase()}</span><span>{t.unedited}</span></div><div className="source-grid">{summarySources.map(item => <article className="panel source-card" key={item.id}><div className="source-card-top"><span className="file-icon"><FileText size={23} /></span><span>{formatDate(item.date)}</span><button className="icon-button source-remove" aria-label={`${ic.remove}: ${item.filename}`} title={ic.remove} onClick={() => deleteSource(item)}><Trash2 size={15} /></button></div><h2>{item.customer}</h2><span className="product-label">{item.product}</span><p>{item.summary}</p><div className="source-card-bottom"><span>{item.matching.length} {t.items}</span><button className="text-link" onClick={() => setSource(item)}>{t.readSource}<ArrowUpRight size={14} /></button></div></article>)}</div>{!selectedSources.length && <div className="empty"><FolderOpen size={30} /><h3>{activeFilters ? t.noData : t.noSources}</h3><p>{activeFilters ? t.noDataText : t.noSourcesText}</p></div>}</>}
          </>}
          <footer className="workspace-footer"><span><span className="live-dot" />{t.localTitle} · {t.extractive}</span><span>{data.scannedAt ? `${t.importedAt}: ${new Date(data.scannedAt).toLocaleString(lang === 'nl' ? 'nl-NL' : 'en-GB')}` : ic.privacy}</span></footer>
        </main>
      </div>
    </div>}
    <SelectionNotes lang={lang} enabled={workspace && tourIndex === null && !privacy && !disclaimer && view !== 'notes'} capture={notebook.capture} open={openNotes} source={source ? `${source.filename} · S-${source.id}` : selected ? `${selected.customer} · ${selected.title} · F-${selected.id} · ${sourceMap.get(selected.sourceId)?.filename ?? selected.sourceId}` : `Feedbacker · ${workspace ? viewLabel : 'Website'} · ${new Date().toISOString().slice(0, 10)}`} />
    {notebook.notice && <div className="notebook-notice" role="status">{notebook.notice}<button className="text-link" onClick={openNotes}>{nt.open}</button><button className="icon-button" aria-label={nt.dismiss} onClick={() => notebook.setNotice('')}><X size={14} /></button></div>}
    {cookieNotice && <div className="cookie-notice" role="region" aria-label={t.cookieTitle}><span className="cookie-icon"><ShieldCheck size={22} /></span><div><h3>{t.cookieTitle}</h3><p>{t.cookieText}</p></div><div className="cookie-actions"><button className="button primary small" onClick={() => { setRemember(true); setCookieNotice(false); }}>{t.remember}</button><button className="text-link" onClick={() => { setCookieNotice(false); setRemember(false); }}>{t.sessionOnly}</button></div></div>}
    {privacy && <Modal title={t.privacy} close={() => setPrivacy(false)} closeLabel={t.close}><div className="privacy-content">{[[t.localTitle, t.localText], [t.analysisTitle, t.analysisText], [t.storageTitle, t.storageText], [t.cookieTitle, t.cookieText]].map(([title, text]) => <section key={title}><h3>{title}</h3><p>{text}</p></section>)}<label className="preference-check"><input type="checkbox" checked={remember} onChange={e => changePreferences(e.target.checked)} />{t.remember}</label><p className="muted">{t.independent} <button className="text-link" onClick={() => { setPrivacy(false); setDisclaimer(true); }}>{about.disclaimer}</button></p></div></Modal>}
    {disclaimer && <Modal title={about.disclaimerTitle} close={() => setDisclaimer(false)} closeLabel={t.close}><DisclaimerContent lang={lang} /></Modal>}
    {selected && <div inert={tourIndex !== null}><EditModal key={selected.id} item={selected} source={sourceMap.get(selected.sourceId)} lang={lang} close={() => setSelected(null)} onSource={s => { setSelected(null); setSource(s); }} onSave={edits => { setLibrary(editFeedback(library, selected.id, edits)); setSelected(null); setToast(t.saved); }} /></div>}
    {source && <Modal title={source.customer} close={() => setSource(null)} closeLabel={t.close} wide><div className="source-meta"><span>{source.product}</span><span>{formatDate(source.date)}</span></div><div className="source-filename"><FileText size={15} />{source.filename}</div>{Boolean(source.tags?.length) && <div className="source-tags"><span>{t.sourceTags}</span>{source.tags?.map(tag => <span className="tag" key={tag}>{tag}</span>)}</div>}<h3>{t.sourceSummary}</h3><p className="source-summary">{source.summary}</p><h3>{t.reading}</h3><pre className="source-text">{source.text}</pre><p className="muted">{t.modified}: {new Date(source.modifiedAt).toLocaleString(lang === 'nl' ? 'nl-NL' : 'en-GB')}</p></Modal>}
    {confirmClear && <Modal title={ic.clearTitle} close={() => setConfirmClear(false)} closeLabel={t.close}><div className="confirm-content"><p>{ic.clearText}</p><label className="preference-check"><input type="checkbox" checked={clearNotes} onChange={e => setClearNotes(e.target.checked)} />{ic.clearNotes}</label><div className="form-footer"><span /><div><button className="button secondary" onClick={() => setConfirmClear(false)}>{t.cancel}</button><button className="button danger" onClick={clearAll}><Trash2 size={15} />{ic.clearConfirm}</button></div></div></div></Modal>}
    <DropOverlay lang={lang} enabled={workspace && tourIndex === null && !importing} onFiles={files => { setView(current => current === 'ai' || current === 'notes' ? 'sources' : current); void importFiles(files); }} />
    {toast && <div className="toast" role="status"><Check size={17} />{toast}{undo && <button className="text-link" onClick={() => { setLibrary(undo); setUndo(null); setToast(''); }}>{ic.undo}</button>}<button className="icon-button" aria-label={t.close} onClick={() => { setToast(''); setUndo(null); }}><X size={14} /></button></div>}
    {tourIndex !== null && tourSteps[tourIndex] && <GuidedTour lang={lang} step={tourSteps[tourIndex]} index={tourIndex} total={tourSteps.length} previous={() => setTourIndex(Math.max(0, tourIndex - 1))} next={() => tourIndex === tourSteps.length - 1 ? stopTour(true) : setTourIndex(tourIndex + 1)} stop={() => stopTour()} />}
  </>;
}

function FeedbackRow({ item, onClick, label, formatDate }: { item: Feedback; onClick: () => void; label: (v: string) => string; formatDate: (v: string) => string }) {
  return <button className="feedback-row" onClick={onClick}><div className="customer-avatar">{initials(item.customer)}</div><div className="feedback-row-main"><div className="feedback-meta"><span>{item.customer}</span><span className="meta-dot">·</span><span>{formatDate(item.date)}</span></div><h3>{item.title}</h3><p>{item.excerpt}</p><div className="row-tags">{item.topics.slice(0, 2).map(topic => <span className="tag" key={topic}>{label(topic)}</span>)}</div></div><div className="feedback-row-side"><span className={`badge ${tone(item.sentiment)}`}><span />{label(item.sentiment)}</span><span className="status-label">{label(item.status)}</span></div><ChevronRight size={15} className="row-chevron" /></button>;
}

function Modal({ title, close, closeLabel, children, wide = false }: { title: string; close: () => void; closeLabel: string; children: React.ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(close);
  closeRef.current = close;
  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    ref.current?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeRef.current();
      if (event.key !== 'Tab') return;
      const focusable = [...(ref.current?.querySelectorAll<HTMLElement>('button, input, select, textarea, a[href], [tabindex="0"]') ?? []), ...document.querySelectorAll<HTMLElement>('.notebook-clip')];
      if (!focusable?.length) return;
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === ref.current)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', keydown);
    return () => { document.body.style.overflow = overflow; document.removeEventListener('keydown', keydown); previous?.focus(); };
  }, []);
  return <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) close(); }}><div ref={ref} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} className={`modal ${wide ? 'wide' : ''}`}><div className="modal-heading"><h2>{title}</h2><button className="icon-button" onClick={close} aria-label={closeLabel}><X size={20} /></button></div>{children}</div></div>;
}

function EditModal({ item, source, lang, close, onSave, onSource }: { item: Feedback; source?: Source; lang: Language; close: () => void; onSave: (edits: FeedbackEdits) => void; onSource: (source: Source) => void }) {
  const t = copy[lang];
  const label = (value: string) => labels[lang][value] ?? value;
  const [form, setForm] = useState<FeedbackEdits>({ ...item });
  const [topicText, setTopicText] = useState(item.topics.join(', '));
  const [error, setError] = useState('');
  function save(event: React.FormEvent) {
    event.preventDefault(); setError('');
    try {
      const { title, customer, product, date, sentiment, priority, status, notes } = form;
      onSave({ title, customer, product, date, sentiment, priority, status, notes, topics: [...new Set(topicText.split(',').map(s => s.trim()).filter(Boolean))] });
    } catch (err) { setError(err instanceof Error ? err.message : t.error); }
  }
  return <Modal title={t.edit} close={close} closeLabel={t.close} wide><form onSubmit={save} className="edit-form">
    <label>{t.title}<input required maxLength={500} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></label>
    <div className="form-grid"><label>{t.customer}<input required maxLength={500} value={form.customer} onChange={e => setForm({ ...form, customer: e.target.value })} /></label><label>{t.product}<input required maxLength={500} value={form.product} onChange={e => setForm({ ...form, product: e.target.value })} /></label></div>
    <div className="form-grid"><label>{t.date}<input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></label><label>{t.sentiment}<select value={form.sentiment} onChange={e => setForm({ ...form, sentiment: e.target.value as Feedback['sentiment'] })}>{sentiments.map(v => <option key={v} value={v}>{label(v)}</option>)}</select></label><label>{t.priority}<select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value as Feedback['priority'] })}>{priorities.map(v => <option key={v} value={v}>{label(v)}</option>)}</select></label><label>{t.status}<select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as Feedback['status'] })}>{statuses.map(v => <option key={v} value={v}>{label(v)}</option>)}</select></label></div>
    <label>{t.topics}<input value={topicText} onChange={e => setTopicText(e.target.value)} placeholder={t.topicsHelp} /><small>{t.topicsHelp} · {topicText.split(',').filter(Boolean).map(s => label(s.trim())).join(' / ')}</small></label>
    <label>{t.notes}<textarea rows={3} maxLength={20000} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></label>
    <section className="evidence"><div><h3>{t.evidence}</h3>{source && <button type="button" className="text-link" onClick={() => onSource(source)}>{t.readSource}<ArrowUpRight size={13} /></button>}</div><pre>{item.evidence}</pre></section>
    {error && <div className="alert error" role="alert">{error}</div>}<div className="form-footer"><small><ShieldCheck size={13} />{t.unedited}</small><div><button type="button" className="button secondary" onClick={close}>{t.cancel}</button><button type="submit" className="button primary">{t.save}<Check size={15} /></button></div></div>
  </form></Modal>;
}
