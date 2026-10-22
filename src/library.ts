import { priorities, sentiments, statuses, type Feedback, type FeedbackEdits, type Snapshot, type Source } from './shared';

export interface ParsedDocument { source: Source; feedback: Feedback[] }
export interface Library { sources: Source[]; feedback: Feedback[]; edits: Record<string, FeedbackEdits>; importedAt: string | null }

export const emptyLibrary = (): Library => ({ sources: [], feedback: [], edits: {}, importedAt: null });

export function validateEdits(value: unknown): FeedbackEdits {
  if (!value || typeof value !== 'object') throw new Error('An edit object is required.');
  const v = value as Record<string, unknown>;
  for (const key of ['title', 'customer', 'product', 'date', 'notes']) {
    if (typeof v[key] !== 'string' || (v[key] as string).length > (key === 'notes' ? 20000 : 500)) throw new Error(`Invalid ${key}.`);
  }
  if (![v.title, v.customer, v.product].every(item => typeof item === 'string' && item.trim())) throw new Error('Title, customer and product are required.');
  if (v.date) {
    const date = new Date(String(v.date));
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(v.date)) || Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== v.date) throw new Error('Invalid date.');
  }
  if (!Array.isArray(v.topics) || v.topics.length > 20 || !v.topics.every(t => typeof t === 'string' && t.trim() && t.length <= 100)) throw new Error('Invalid topics.');
  if (!sentiments.includes(v.sentiment as never) || !statuses.includes(v.status as never) || !priorities.includes(v.priority as never)) throw new Error('Invalid sentiment, status or priority.');
  return {
    title: String(v.title).trim(), customer: String(v.customer).trim(), product: String(v.product).trim(),
    date: String(v.date), notes: String(v.notes), topics: v.topics.map(t => String(t).trim()),
    sentiment: v.sentiment as FeedbackEdits['sentiment'], status: v.status as FeedbackEdits['status'], priority: v.priority as FeedbackEdits['priority'],
  };
}

/** Adds documents; a file with the same name replaces its earlier version while edits on unchanged observations are kept. */
export function addDocuments(library: Library, documents: ParsedDocument[]): Library {
  const replaced = new Set(documents.map(document => document.source.id));
  const sources = [...library.sources.filter(source => !replaced.has(source.id)), ...documents.map(document => document.source)]
    .sort((a, b) => (b.date || '').localeCompare(a.date || '') || a.filename.localeCompare(b.filename));
  const order = new Map(sources.map((source, index) => [source.id, index]));
  const feedback = [...library.feedback.filter(item => !replaced.has(item.sourceId)), ...documents.flatMap(document => document.feedback)]
    .sort((a, b) => order.get(a.sourceId)! - order.get(b.sourceId)!);
  const ids = new Set(feedback.map(item => item.id));
  const edits = Object.fromEntries(Object.entries(library.edits).filter(([id]) => ids.has(id)));
  return { sources, feedback, edits, importedAt: documents.length ? new Date().toISOString() : library.importedAt };
}

export function removeSource(library: Library, sourceId: string): Library {
  const feedback = library.feedback.filter(item => item.sourceId !== sourceId);
  const ids = new Set(feedback.map(item => item.id));
  return { ...library, sources: library.sources.filter(source => source.id !== sourceId), feedback, edits: Object.fromEntries(Object.entries(library.edits).filter(([id]) => ids.has(id))) };
}

export function editFeedback(library: Library, id: string, edits: unknown): Library {
  if (!library.feedback.some(item => item.id === id)) throw new Error('Feedback not found.');
  return { ...library, edits: { ...library.edits, [id]: validateEdits(edits) } };
}

export function toSnapshot(library: Library): Snapshot {
  return {
    sources: library.sources, scannedAt: library.importedAt, warnings: [],
    feedback: library.feedback.map(item => ({ ...item, ...library.edits[item.id] })),
  };
}
