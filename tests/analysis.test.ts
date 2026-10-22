import assert from 'node:assert/strict';
import test from 'node:test';
import { classify, extractDate, parseDocument } from '../src/analysis.js';
import { validateEdits } from '../src/library.js';

test('extracts Dutch dates without inferring missing dates', () => {
  assert.equal(extractDate('Datum: 20 oktober 2026'), '2026-10-20');
  assert.equal(extractDate('Date: 2026-10-21'), '2026-10-21');
  assert.equal(extractDate('No date'), '');
  assert.equal(extractDate('Datum: 31 februari 2026'), '');
  assert.equal(extractDate('Date: 2026-99-99'), '');
});

test('extracts original summary, numbered observations and stable IDs', () => {
  const text = 'Datum: 20 oktober 2026\nOnderwerp: Interviewsessie over de module voor functioneringsgesprekken\nExecutive Summary\nSamenvatting van het gesprek.\nDoel van de meeting\nTest\nHoofdpunten (discussie)\n1. Filtering\nDe selectie is onduidelijk.\nGewenste verbetering: Voeg filters toe.\n2. Status\nDe flow is logisch.\nVerbeteringen aan het product\n1. Do not duplicate';
  const first = parseDocument('[Summary] Customer - Interview sessie.docx', text, '2026-10-20');
  const second = parseDocument('[Summary] Customer - Interview sessie.docx', text.replace('20 oktober', '21 oktober'), '2026-10-21');
  assert.equal(first.source.customer, 'Customer');
  assert.equal(first.source.summary, 'Samenvatting van het gesprek.');
  assert.equal(first.feedback.length, 2);
  assert.equal(first.feedback[0].excerpt, 'Gewenste verbetering: Voeg filters toe.');
  assert.equal(first.feedback[0].id, second.feedback[0].id);
  assert.equal(first.feedback[1].sentiment, 'Positive');
});

test('handles unstructured documents and rejects empty text', () => {
  assert.equal(parseDocument('notes.docx', 'A useful conversation', '').feedback.length, 1);
  assert.throws(() => parseDocument('empty.docx', '', ''));
  const nested = parseDocument('archive\\[Summary] Client - Interview.docx', 'Subject: Reviews\nMain points\n1. Reminders\nMissing notification.\nNext steps\nFollow up.', '');
  assert.equal(nested.source.customer, 'Client');
  assert.equal(nested.source.product, 'Reviews');
  assert.equal(nested.feedback.length, 1);
  assert.ok(nested.feedback[0].topics.includes('Notifications'));
});

test('classifies rule-based signals and validates edits', () => {
  assert.equal(classify('logisch maar onduidelijk').sentiment, 'Mixed');
  assert.equal(classify('een gesprek').sentiment, 'Neutral');
  assert.equal(classify('onduidelijk').sentiment, 'Needs attention');
  assert.equal(classify('niet duidelijk').sentiment, 'Needs attention');
  assert.equal(classify('clear and useful').sentiment, 'Positive');
  assert.throws(() => validateEdits({}));
  const edits = { title: 'Title', customer: 'Customer', product: 'Product', date: '2026-10-20', topics: ['Workflow'], sentiment: 'Mixed', priority: 'High', status: 'Planned', notes: 'Follow up' };
  assert.deepEqual(validateEdits(edits), edits);
  assert.throws(() => validateEdits({ ...edits, date: '2026-02-31' }));
  assert.throws(() => validateEdits({ ...edits, status: 'Other' }));
});
