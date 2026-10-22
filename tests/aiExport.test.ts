import assert from 'node:assert/strict';
import test from 'node:test';
import { buildAiExport, defaultExportOptions } from '../src/aiExport.js';
import type { Feedback, Source } from '../src/shared.js';

const feedback: Feedback[] = [{
  id: 'f1', sourceId: 's1', customer: 'Bakkerij Noord', product: 'Planning', date: '2026-09-01',
  title: 'Bakkerij Noord wil roosterfilter', topics: ['Planning'], sentiment: 'Mixed', priority: 'High',
  status: 'New', notes: 'Intern: opvolgen', excerpt: '', evidence: 'Bakkerij Noord: het rooster is traag.',
}, {
  id: 'f2', sourceId: 's2', customer: 'Fietsenmaker Zuid', product: 'Planning', date: '2026-10-01',
  title: 'Tevreden over app', topics: ['Mobile'], sentiment: 'Positive', priority: 'Low', status: 'Done', notes: '', excerpt: 'Fijne app', evidence: '',
}];
const sources: Source[] = [
  { id: 's1', customer: 'Bakkerij Noord', product: 'Planning', date: '2026-09-01', filename: 'Bakkerij Noord.docx', modifiedAt: '', text: 'Volledige tekst Bakkerij Noord ```code```', summary: 'Sessie over roosters' },
  { id: 's2', customer: 'Fietsenmaker Zuid', product: 'Planning', date: '2026-10-01', filename: 'Zuid.md', modifiedAt: '', text: 'Tekst Zuid', summary: '' },
  { id: 's3', customer: 'Niet geselecteerd', product: 'X', date: '', filename: 'x.txt', modifiedAt: '', text: 'nope', summary: '' },
];
const now = new Date('2026-10-22T12:00:00Z');

test('markdown export contains instructions, overview, citations and full text', () => {
  const result = buildAiExport(defaultExportOptions, feedback, sources, now);
  assert.equal(result.filename, 'feedbacker-ai-export-2026-10-22.md');
  assert.equal(result.sessions, 2);
  assert.equal(result.feedback, 2);
  assert.ok(result.content.includes('## Instructies voor de AI-assistent'));
  assert.ok(result.content.includes('[fb:f1] Bakkerij Noord wil roosterfilter'));
  assert.ok(result.content.includes('> Fijne app'));
  assert.ok(result.content.includes('Volledige tekst Bakkerij Noord'));
  assert.ok(!result.content.includes('```code```'), 'code fences in source text are neutralized');
  assert.ok(result.content.includes('Intern: opvolgen'));
  assert.ok(result.content.includes('2026-09-01 – 2026-10-01'));
  assert.ok(!result.content.includes('Niet geselecteerd'));
});

test('options exclude full text and notes and mask known customer names', () => {
  const result = buildAiExport({ ...defaultExportOptions, language: 'en', fullText: false, notes: false, maskNames: true }, feedback, sources, now);
  assert.ok(result.content.includes('## Instructions for the AI assistant'));
  assert.ok(!result.content.includes('Volledige tekst'));
  assert.ok(!result.content.includes('Intern: opvolgen'));
  assert.ok(!/Bakkerij Noord|Fietsenmaker Zuid/.test(result.content));
  assert.ok(result.content.includes('Customer 1'));
});

test('json export is valid and structured per session', () => {
  const result = buildAiExport({ ...defaultExportOptions, format: 'json' }, [feedback[0]], sources, now);
  assert.equal(result.filename, 'feedbacker-ai-export-2026-10-22.json');
  const parsed = JSON.parse(result.content);
  assert.equal(parsed.scope.sessions, 1);
  assert.equal(parsed.sessions[0].feedback[0].id, 'f1');
  assert.equal(parsed.sessions[0].feedback[0].teamNotes, 'Intern: opvolgen');
  assert.ok(parsed.sessions[0].fullText.includes('Volledige tekst'));
});
