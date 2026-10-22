import { useEffect, useMemo, useState } from 'react';
import { ArrowDownToLine, Check, Copy, FileText, SlidersHorizontal, ShieldCheck, Sparkles } from 'lucide-react';
import type { Feedback, Source } from './shared';
import type { Language } from './i18n';
import { helpAiCopy } from './helpAiCopy';
import { analysisCards, buildAnalysisPrompt, defaultPromptSettings, parsePromptSettings, serializePromptSettings, type PromptSettings } from './analysisPrompt';
import { deleteCookie, readCookie, writeCookie } from './preferences';

interface Props {
  lang: Language;
  feedback: Feedback[];
  filtered: Feedback[];
  sources: Source[];
  remember: boolean;
  changePreferences: (remember: boolean) => void;
}

export function PromptBuilder({ lang, feedback, filtered, sources, remember, changePreferences }: Props) {
  const t = helpAiCopy[lang];
  const [initial] = useState(() => {
    const raw = remember ? readCookie('feedbacker-prompt') : undefined;
    try { return { settings: raw ? parsePromptSettings(raw) : { ...defaultPromptSettings, language: lang }, invalid: false }; }
    catch { return { settings: { ...defaultPromptSettings, language: lang }, invalid: true }; }
  });
  const [settings, setSettings] = useState<PromptSettings>(initial.settings);
  const [scope, setScope] = useState<'filtered' | 'all'>('filtered');
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [question, setQuestion] = useState('');
  const [copyStatus, setCopyStatus] = useState<'copied' | 'error' | ''>('');
  const [cookieError, setCookieError] = useState(false);
  const [cookieInvalid, setCookieInvalid] = useState(initial.invalid);
  const [group, setGroup] = useState<'all' | typeof analysisCards[number]['group']>('all');
  const eligible = scope === 'filtered' ? filtered : feedback;
  const eligibleIds = new Set(eligible.map(item => item.sourceId));
  const sessions = sources.filter(source => eligibleIds.has(source.id));
  const selected = useMemo(() => eligible.filter(item => !excluded.has(item.sourceId)), [eligible, excluded]);
  const result = useMemo(() => buildAnalysisPrompt(settings, selected, sources, question), [settings, selected, sources, question]);
  const valid = selected.length > 0 && (settings.analyses.length > 0 || question.trim().length > 0);
  const overBudget = result.estimatedTokens > settings.contextWindow * .75;

  useEffect(() => {
    setCopyStatus('');
  }, [settings, selected, question]);
  useEffect(() => {
    if (!remember) { deleteCookie('feedbacker-prompt'); setCookieError(false); return; }
    const encoded = serializePromptSettings(settings);
    writeCookie('feedbacker-prompt', encoded);
    setCookieError(readCookie('feedbacker-prompt') !== encoded);
  }, [settings, remember]);

  function update<K extends keyof PromptSettings>(key: K, value: PromptSettings[K]) {
    setCookieInvalid(false);
    setSettings(previous => ({ ...previous, [key]: value }));
  }
  function changeScope(next: 'filtered' | 'all') { setScope(next); setExcluded(new Set()); }
  function toggleSession(id: string) {
    setExcluded(previous => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }
  async function copyPrompt() {
    try { await navigator.clipboard.writeText(result.prompt); setCopyStatus('copied'); }
    catch { setCopyStatus('error'); }
  }
  function downloadPrompt() {
    const url = URL.createObjectURL(new Blob([result.prompt], { type: 'text/plain;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = `feedbacker-ai-prompt-${settings.language}.txt`; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function preferenceSelect<K extends 'language' | 'audience' | 'depth' | 'format' | 'style'>(key: K, title: string, values: readonly PromptSettings[K][]) {
    return <label>{title}<select value={settings[key]} onChange={event => {
      const value = values.find(option => option === event.target.value);
      if (value) update(key, value);
    }}>{values.map(value => <option key={value} value={value}>{t[value]}</option>)}</select></label>;
  }

  return <div className="prompt-builder">
    <div className="prompt-local-note"><ShieldCheck size={16} /><span>{t.local}</span><a href="#structured-summaries" className="text-link">MeetingSum →</a></div>
    <div className="builder-layout">
      <div className="builder-controls">
        <section className="panel builder-section" data-tour="ai-context">
          <div className="builder-section-heading"><span className="builder-number">01</span><div><h2>{t.context}</h2><p>{t.contextHint}</p></div><FileText size={19} /></div>
          <fieldset className="scope-choice"><legend className="sr-only">{t.context}</legend>{(['filtered', 'all'] as const).map(value => <label key={value} className={scope === value ? 'selected' : ''}><input type="radio" name="prompt-scope" checked={scope === value} onChange={() => changeScope(value)} /><span>{t[value]}</span><strong>{value === 'filtered' ? filtered.length : feedback.length}</strong></label>)}</fieldset>
          <div className="builder-selection-actions"><span>{selected.length} {t.observations} · {new Set(selected.map(item => item.sourceId)).size} {t.sessions}</span><div><button className="text-link" onClick={() => setExcluded(new Set())}>{t.selectAll}</button><button className="text-link" onClick={() => setExcluded(new Set(sessions.map(source => source.id)))}>{t.selectNone}</button></div></div>
          <div className="builder-sessions">{sessions.map(source => <label key={source.id}><input type="checkbox" checked={!excluded.has(source.id)} onChange={() => toggleSession(source.id)} /><span><strong>{source.customer}</strong><small>{source.product} · {source.date || t.unknown}</small></span><span className="tag">{eligible.filter(item => item.sourceId === source.id).length}</span></label>)}</div>
          {!selected.length && <p className="builder-validation" role="status">{t.noContext}</p>}
        </section>
        <section className="panel builder-section">
          <div className="builder-section-heading" data-tour="ai-goals"><span className="builder-number">02</span><div><h2>{t.goals}</h2><p>{t.goalsHint}</p></div><Sparkles size={19} /></div>
          <div className="analysis-tabs" role="group" aria-label={t.goals}>{(['all', 'insight', 'product', 'followup'] as const).map(value => <button key={value} aria-pressed={group === value} onClick={() => setGroup(value)}>{t[value]}</button>)}</div>
          <div className="analysis-cards">{analysisCards.filter(card => group === 'all' || card.group === group).map(card => <label className={`analysis-card ${settings.analyses.includes(card.id) ? 'selected' : ''}`} key={card.id}><input type="checkbox" checked={settings.analyses.includes(card.id)} onChange={() => update('analyses', settings.analyses.includes(card.id) ? settings.analyses.filter(id => id !== card.id) : [...settings.analyses, card.id])} /><span><strong>{card[lang][0]}</strong><small>{card[lang][1]}</small></span></label>)}</div>
          <label className="builder-question">{t.custom}<textarea rows={3} maxLength={4000} value={question} placeholder={t.customPlaceholder} onChange={event => setQuestion(event.target.value)} /><small>{t.customHint}</small></label>
          {!settings.analyses.length && !question.trim() && <p className="builder-validation" role="status">{t.noGoals}</p>}
        </section>
        <section className="panel builder-section">
          <div className="builder-section-heading"><span className="builder-number">03</span><div><h2>{t.options}</h2><p>{t.optionsHint}</p></div><SlidersHorizontal size={19} /></div>
          <div className="builder-options">
            {preferenceSelect('language', t.outputLanguage, ['nl', 'en'])}
            {preferenceSelect('audience', t.audience, ['team', 'management', 'research'])}
            {preferenceSelect('depth', t.depth, ['concise', 'standard', 'detailed'])}
            {preferenceSelect('format', t.format, ['markdown', 'json'])}
            {preferenceSelect('style', t.style, ['neutral', 'formal'])}
            <label>{t.budget}<select value={settings.contextWindow} onChange={event => {
              const value = ([4096, 8192, 16384, 32768, 65536] as const).find(option => option === Number(event.target.value));
              if (value) update('contextWindow', value);
            }}>{[4096, 8192, 16384, 32768, 65536].map(value => <option key={value} value={value}>{value.toLocaleString(lang)} tokens</option>)}</select></label>
          </div>
          <div className="builder-checks">{([
            ['evidence', t.evidence, t.evidenceHint], ['notes', t.notes, t.notesHint],
            ['summaries', t.summaries, t.summariesHint], ['maskNames', t.mask, t.maskHint],
          ] as const).map(([key, title, hint]) => <label key={key}><input type="checkbox" checked={settings[key]} onChange={event => update(key, event.target.checked)} /><span><strong>{title}</strong><small>{hint}</small></span></label>)}</div>
          <div className="builder-remember"><label><input type="checkbox" checked={remember} onChange={event => changePreferences(event.target.checked)} />{t.remember}</label><p>{t.cookieHint}</p>{remember && !cookieError && <span role="status">{t.cookieSaved}</span>}</div>
          {cookieInvalid && <p className="builder-validation" role="alert">{t.cookieInvalid}</p>}
          {cookieError && <p className="builder-validation" role="alert">{t.cookieBlocked}</p>}
          <button className="text-link" onClick={() => { setSettings({ ...defaultPromptSettings, language: lang }); setCookieInvalid(false); }}>{t.reset}</button>
        </section>
      </div>
      <aside className="builder-preview-column">
        <section className="panel prompt-preview">
          <div className="builder-section-heading" data-tour="ai-preview"><span className="builder-number">04</span><div><h2>{t.preview}</h2><p>{t.previewHint}</p></div></div>
          <div className="prompt-metrics"><span>{selected.length} {t.observations}</span><span>{result.prompt.length.toLocaleString(lang)} {t.chars}</span><strong>{result.estimatedTokens.toLocaleString(lang)} {t.tokens}</strong></div>
          <textarea className="prompt-output" aria-label={t.preview} readOnly value={result.prompt} spellCheck={false} />
          <p className="token-note">{t.budgetHint}</p>
          {overBudget && <p className="builder-validation" role="status">{t.overBudget}</p>}
          <div className="prompt-actions"><button className="button primary" disabled={!valid} onClick={() => void copyPrompt()}>{copyStatus === 'copied' ? <Check size={15} /> : <Copy size={15} />}{t.copy}</button><button className="button secondary" disabled={!valid} onClick={downloadPrompt}><ArrowDownToLine size={15} />{t.download}</button></div>
          {copyStatus && <p className={`copy-result ${copyStatus}`} role={copyStatus === 'error' ? 'alert' : 'status'}>{copyStatus === 'copied' ? t.copied : t.copyError}</p>}
          {!valid && <p className="builder-validation" role="status">{!selected.length ? t.noContext : t.noGoals}</p>}
        </section>
        <section className="builder-how"><ShieldCheck size={20} /><h3>{t.how}</h3><p>{t.howText}</p><p>{t.sensitive}</p></section>
      </aside>
    </div>
  </div>;
}
