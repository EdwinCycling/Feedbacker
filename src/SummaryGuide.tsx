import { useState } from 'react';
import { ArrowRight, ArrowUpRight, Check, Copy, FileText, Layers3, ShieldCheck } from 'lucide-react';
import { copy, type Language } from './i18n';
import { meetingSumUrl, summaryInstruction } from './meetingSum';

export function SummaryGuide({ lang }: { lang: Language }) {
  const t = copy[lang];
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const steps = [
    [t.structuredStep1, t.structuredStep1Text],
    [t.structuredStep2, t.structuredStep2Text],
    [t.structuredStep3, t.structuredStep3Text],
    [t.structuredStep4, t.structuredStep4Text],
  ];
  const unknown = lang === 'nl' ? 'Onbekend' : 'Unknown';
  async function copyInstruction() {
    setCopied(false);
    setError(false);
    try {
      await navigator.clipboard.writeText(summaryInstruction(lang));
      setCopied(true);
    } catch {
      setError(true);
      setExpanded(true);
    }
  }
  return <section id="structured-summaries" className="section container summary-guide">
    <div className="guide-heading">
      <div className="section-heading">
        <span className="eyebrow">03 / MEETINGSUM + FEEDBACKER</span>
        <h2 className="preserve-lines">{t.structuredTitle}</h2>
        <p>{t.structuredIntro}</p>
      </div>
      <div className="guide-cta">
        <a className="button primary" href={meetingSumUrl} target="_blank" rel="noopener noreferrer">{t.meetingSumOpen}<ArrowUpRight size={17} /></a>
        <small>{t.meetingSumExternal}</small>
      </div>
    </div>
    <div className="guide-layout">
      <ol className="guide-steps">
        {steps.map(([title, description], index) => <li key={title}>
          <span className="step-number">0{index + 1}</span>
          <div><h3>{title}</h3><p>{description}</p></div>
        </li>)}
      </ol>
      <div className="structure-card">
        <div className="structure-heading"><span><FileText size={17} />{t.structureTitle}</span><span className="tag">.md / .txt / .docx</span></div>
        <div className="structure-body">
          <span className="structure-label">{t.structureMetadata}</span>
          <pre>{`[METADATA START]
Datum: ${unknown}
Deelnemers: ${unknown}
Tags: Planning, Roadmap
Executive Summary: […]
[METADATA EINDE]`}</pre>
          <div className="structure-separator"><span /><ArrowRight size={14} /><span /></div>
          <div className="structure-sections">
            <strong>Meeting Details</strong>
            <span>{lang === 'nl' ? 'Klant: [klantcode] · Product: [module]' : 'Customer: [identifier] · Product: [module]'}</span>
            <strong>Executive Summary</strong>
            <strong>{lang === 'nl' ? 'Hoofdpunten (discussie)' : 'Key Points (Discussion)'}</strong>
            <span>1. {lang === 'nl' ? 'Klantbehoefte en onderbouwing' : 'Customer need and evidence'}</span>
            <span>2. {lang === 'nl' ? 'Volgend onderwerp' : 'Next topic'}</span>
            <strong>{lang === 'nl' ? 'Actiepunten' : 'Action items'}</strong>
          </div>
        </div>
        <div className="structure-footer"><Check size={14} /><span>{t.structureHint}</span></div>
      </div>
    </div>
    <div className="guide-instruction">
      <div><span className="feature-icon"><Layers3 size={19} /></span><div><h3>{t.structuredChecklist}</h3><p>{t.structuredRules}</p></div></div>
      <button className="button secondary" onClick={() => void copyInstruction()}>{copied ? <Check size={15} /> : <Copy size={15} />}{t.copyInstruction}</button>
    </div>
    {copied && <p className="guide-feedback" role="status">{t.copiedInstruction}</p>}
    {error && <p className="guide-feedback copy-error" role="alert">{t.copyFailed}</p>}
    <details className="instruction-details" open={expanded} onToggle={event => setExpanded(event.currentTarget.open)}>
      <summary>{t.showInstruction}</summary><pre>{summaryInstruction(lang)}</pre>
    </details>
    <div className="guide-privacy"><ShieldCheck size={19} /><div><h3>{t.meetingSumPrivacy}</h3><p>{t.meetingSumPrivacyText}</p></div></div>
  </section>;
}

export function SummaryCallout({ lang }: { lang: Language }) {
  const t = copy[lang];
  return <aside className="summary-callout">
    <span className="feature-icon"><Layers3 size={18} /></span>
    <div><h3>{t.meetingSumCalloutTitle}</h3><p>{t.meetingSumCalloutText}</p></div>
    <a className="text-link" href="#structured-summaries">{t.meetingSumGuide}<ArrowUpRight size={14} /></a>
  </aside>;
}
