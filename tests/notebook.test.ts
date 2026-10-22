import assert from 'node:assert/strict';
import test from 'node:test';
import { clearNotebook, readNotebook, validateNotebook, writeNotebook } from '../src/notebookStorage.js';

const memoryStorage = () => {
  const values = new Map<string, string>();
  return { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => void values.set(key, value), removeItem: (key: string) => void values.delete(key) };
};

test('notebook persists in browser storage and rejects stale writes from another tab', () => {
  const storage = memoryStorage();
  assert.equal(readNotebook(storage).revision, 0);
  const input = { title: 'Research', content: '> Evidence\n\nBron: S-123\n<script>not executed</script>', revision: 0 };
  const saved = writeNotebook(storage, input);
  assert.equal(saved?.revision, 1);
  assert.equal(writeNotebook(storage, input), null);
  assert.deepEqual(readNotebook(storage), saved);
  assert.equal(writeNotebook(storage, { ...input, revision: 1, content: 'Updated' })?.content, 'Updated');
  clearNotebook(storage);
  assert.equal(readNotebook(storage).content, '');
});

test('notebook validates types and exact content limits', () => {
  for (const value of [null, {}, { title: ' ', content: '', revision: 0 }, { title: 't', content: 12, revision: 0 }, { title: 't', content: '', revision: -1 }, { title: 't', content: '', revision: .5 }]) assert.throws(() => validateNotebook(value));
  assert.equal(validateNotebook({ title: ' Title ', content: 'a'.repeat(200000), revision: 0 }).content.length, 200000);
  assert.throws(() => validateNotebook({ title: 'Title', content: 'a'.repeat(200001), revision: 0 }));
  const storage = memoryStorage();
  storage.setItem('feedbacker-notebook', '{"title":"x"}');
  assert.throws(() => readNotebook(storage));
});
