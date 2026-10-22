import type { Notebook } from './shared';

export const notebookKey = 'feedbacker-notebook';
export const emptyNotebook = (): Notebook => ({ title: 'Notities / Notes', content: '', revision: 0, updatedAt: null });
type KeyValueStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export function validateNotebook(value: unknown) {
  if (!value || typeof value !== 'object') throw new Error('Invalid notebook.');
  const v = value as Record<string, unknown>;
  if (typeof v.title !== 'string' || !v.title.trim() || v.title.length > 200) throw new Error('A title of 1-200 characters is required.');
  if (typeof v.content !== 'string' || v.content.length > 200000) throw new Error('Notes may contain at most 200,000 characters.');
  if (!Number.isSafeInteger(v.revision) || Number(v.revision) < 0) throw new Error('Invalid revision.');
  return { title: v.title.trim(), content: v.content, revision: Number(v.revision) };
}

export function readNotebook(storage: KeyValueStorage): Notebook {
  const raw = storage.getItem(notebookKey);
  if (!raw) return emptyNotebook();
  const parsed: unknown = JSON.parse(raw);
  const value = validateNotebook(parsed);
  const updatedAt = (parsed as { updatedAt?: unknown }).updatedAt;
  return { ...value, updatedAt: typeof updatedAt === 'string' && !Number.isNaN(Date.parse(updatedAt)) ? updatedAt : null };
}

/** Returns null when another tab saved a newer revision in the meantime. */
export function writeNotebook(storage: KeyValueStorage, input: unknown): Notebook | null {
  const value = validateNotebook(input);
  if (readNotebook(storage).revision !== value.revision) return null;
  const saved: Notebook = { ...value, revision: value.revision + 1, updatedAt: new Date().toISOString() };
  storage.setItem(notebookKey, JSON.stringify(saved));
  return saved;
}

export function clearNotebook(storage: KeyValueStorage) {
  storage.removeItem(notebookKey);
}
