import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, ArrowRight, Check, Route, X } from 'lucide-react';
import { helpAiCopy } from './helpAiCopy';
import type { Language } from './i18n';
import { placeBalloon, type Box } from './tourPlacement';

export interface TourStep { target: string; title: string; text: string }

export function TourInvitation({ lang, start, dismiss }: { lang: Language; start: () => void; dismiss: () => void }) {
  const t = helpAiCopy[lang];
  return <aside className="tour-invitation" aria-label={t.tour}>
    <span className="tour-invitation-icon"><Route size={23} /></span><div><h2>{t.inviteTitle}</h2><p>{t.inviteText}</p></div>
    <div><button className="button primary small" onClick={start}>{t.start}<ArrowRight size={15} /></button><button className="text-link" onClick={dismiss}>{t.later}</button></div>
  </aside>;
}

export function GuidedTour({ lang, step, index, total, previous, next, stop }: {
  lang: Language; step: TourStep; index: number; total: number;
  previous: () => void; next: () => void; stop: () => void;
}) {
  const t = helpAiCopy[lang];
  const card = useRef<HTMLDivElement>(null);
  const nextButton = useRef<HTMLButtonElement>(null);
  const [target, setTarget] = useState<Box | null>(null);
  const [cardSize, setCardSize] = useState({ width: 360, height: 300 });
  const [missing, setMissing] = useState(false);
  const stopRef = useRef(stop);
  stopRef.current = stop;

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') stopRef.current(); };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); if (previousFocus?.isConnected) previousFocus.focus(); };
  }, []);
  useLayoutEffect(() => {
    if (!card.current) return;
    const element = card.current;
    const measure = () => setCardSize({ width: element.offsetWidth, height: element.offsetHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [step, lang, missing]);
  useEffect(() => {
    setTarget(null);
    setMissing(false);
    let frame = 0, attempts = 0, resizeObserver: ResizeObserver | undefined;
    let element: HTMLElement | null = null;
    const update = () => {
      if (!element?.isConnected) return;
      const box = element.getBoundingClientRect();
      setTarget({ x: box.x, y: box.y, width: box.width, height: box.height });
    };
    const locate = () => {
      element = document.querySelector<HTMLElement>(step.target);
      if (!element || !element.getBoundingClientRect().height) {
        if (++attempts < 60) frame = requestAnimationFrame(locate);
        else setMissing(true);
        return;
      }
      element.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' });
      update();
      resizeObserver = new ResizeObserver(update);
      resizeObserver.observe(element);
      nextButton.current?.focus({ preventScroll: true });
    };
    frame = requestAnimationFrame(locate);
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [step]);
  const viewport = { width: window.innerWidth, height: window.innerHeight };
  const placement = target ? placeBalloon(target, cardSize, viewport) : null;
  const x = placement?.x ?? Math.max(14, (viewport.width - cardSize.width) / 2);
  const y = placement?.y ?? Math.max(14, (viewport.height - cardSize.height) / 2);

  return createPortal(<div className="guided-tour-layer">
    <div className="tour-interaction-shield" />
    {target ? <>
      <div className="tour-spotlight" style={{ left: target.x - 5, top: target.y - 5, width: target.width + 10, height: target.height + 10 }} />
      {placement && placement.overlap === 0 && <svg className="tour-pointer" aria-hidden="true"><line x1={placement.start.x} y1={placement.start.y} x2={placement.end.x} y2={placement.end.y} /><circle cx={placement.end.x} cy={placement.end.y} r="5" /></svg>}
    </> : <div className="tour-no-target" />}
    <div ref={card} className="tour-balloon" role="dialog" aria-modal="true" aria-labelledby="tour-heading" aria-describedby="tour-description" style={{ left: x, top: y }} onKeyDown={event => {
      if (event.key !== 'Tab') return;
      const controls = card.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)');
      if (!controls?.length) return;
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }}>
      <div className="tour-balloon-top"><span><Route size={13} />{t.step} {index + 1} {t.of} {total}</span><button className="icon-button" onClick={stop} aria-label={t.stop}><X size={17} /></button></div>
      <h2 id="tour-heading">{step.title}</h2><p id="tour-description">{step.text}</p>
      {missing && <p className="tour-missing" role="alert">{t.missing}</p>}
      <div className="tour-progress"><span style={{ width: `${(index + 1) / total * 100}%` }} /></div>
      <div className="tour-balloon-actions"><button className="text-link" onClick={previous} disabled={index === 0}><ArrowLeft size={13} />{t.previous}</button><button className="button primary small" ref={nextButton} onClick={next}>{index === total - 1 ? t.finish : t.next}{index === total - 1 ? <Check size={14} /> : <ArrowRight size={14} />}</button></div>
      <button className="tour-stop" onClick={stop}>{t.stop}</button>
    </div>
  </div>, document.body);
}
