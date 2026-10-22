import assert from 'node:assert/strict';
import test from 'node:test';
import { parseDocument } from '../src/analysis.js';
import { readDocuments } from '../src/documents.js';
import { addDocuments, editFeedback, emptyLibrary, toSnapshot } from '../src/library.js';
import { summaryInstruction } from '../src/meetingSum.js';

const summary = `[METADATA START]
Datum: 2026-10-22
Deelnemers: Onbekend
Tags: Planning, Roadmap
Executive Summary: De klant wil beter kunnen plannen.
De huidige filters zijn onduidelijk.
[METADATA EINDE]

## Meeting Details
**Klant:** Klant A
**Product:** Reviews

## Hoofdpunten (discussie)
1. Selectie verbeteren
De klant mist een afdelingsfilter.
Gewenste verbetering: Voeg een filter toe.
2. Herinneringen
De klant vraagt om een herinnering.

## Genomen beslissingen
1. Onderzoek uitvoeren

## Executive Summary
Deze tekst mag het metadata-overzicht niet vervangen.

## Actiepunten
1. Onderzoek de haalbaarheid.`;

test('reads MeetingSum metadata, Markdown fields and reordered sections without importing decision lists', () => {
  const { source, feedback } = parseDocument('session.md', summary, '');
  assert.equal(source.date, '2026-10-22');
  assert.equal(source.customer, 'Klant A');
  assert.equal(source.product, 'Reviews');
  assert.equal(source.summary, 'De klant wil beter kunnen plannen. De huidige filters zijn onduidelijk.');
  assert.deepEqual(source.tags, ['Planning', 'Roadmap']);
  assert.equal(feedback.length, 2);
  assert.equal(feedback[0].title, 'Selectie verbeteren');
  assert.equal(feedback[0].excerpt, 'Gewenste verbetering: Voeg een filter toe.');
  assert.ok(feedback.every(item => item.topics.includes('Roadmap')));
  assert.ok(!feedback[1].evidence.includes('Onderzoek uitvoeren'));
  assert.ok(source.text.includes('## Meeting Details'));
});

test('handles unknown metadata and English discussion labels', () => {
  const document = summary.replace('Datum: 2026-10-22', 'Datum: Onbekend')
    .replace('Tags: Planning, Roadmap', 'Tags: Onbekend')
    .replace('Hoofdpunten (discussie)', 'Key Points (Discussion)')
    .replace('Genomen beslissingen', 'Decisions made');
  const { source, feedback } = parseDocument('session.txt', document, '');
  assert.equal(source.date, '');
  assert.deepEqual(source.tags, []);
  assert.equal(feedback.length, 2);
  assert.throws(() => parseDocument('broken.md', summary.replace('[METADATA EINDE]', ''), ''), /Incomplete MeetingSum metadata/);
});

test('collects multi-paragraph executive summaries and stops at the next selected MeetingSum section', () => {
  const { source, feedback } = parseDocument('session.txt', 'Executive Summary\nFirst paragraph.\nSecond paragraph.\nMeeting Details\nDate: 2026-10-22\nMain points (discussion)\n1. A request\nEvidence.\nRisks and bottlenecks\n1. Do not import.', '');
  assert.equal(source.summary, 'First paragraph. Second paragraph.');
  assert.equal(feedback.length, 1);
  assert.equal(feedback[0].evidence, 'Evidence.');
});

test('recognizes all verified English MeetingSum section boundaries', () => {
  for (const heading of ['Meeting Goal', 'Decisions Made', 'Action Items', 'Parking Lot & Next Steps', 'Closing Statement', 'Meeting Details', 'Areas for Improvement', 'What Went Well', 'Sentiment & Atmosphere', 'Risks & Issues', 'Keywords / Tags', 'Important Quotes']) {
    const { feedback } = parseDocument('session.md', `## Key Points (Discussion)\n1. Customer request\nOriginal evidence.\n## ${heading}\n1. Separate section.`, '');
    assert.equal(feedback.length, 1, heading);
    assert.equal(feedback[0].evidence, 'Original evidence.', heading);
  }
});

test('imports MeetingSum text exports in the browser and preserves edits when re-added', async () => {
  const files = [new File([summary], 'session.md'), new File([summary.replace('Klant A', 'Klant B')], 'session.txt')];
  const { documents, issues } = await readDocuments(files);
  assert.deepEqual(issues, []);
  let library = addDocuments(emptyLibrary(), documents);
  const snapshot = toSnapshot(library);
  assert.equal(snapshot.sources.length, 2);
  assert.equal(snapshot.feedback.length, 4);
  assert.ok(snapshot.sources.every(source => source.tags?.includes('Roadmap')));
  const item = snapshot.feedback[0];
  library = editFeedback(library, item.id, { ...item, notes: 'Reviewed', status: 'Reviewing' });
  library = addDocuments(library, (await readDocuments([files[0], files[1]])).documents);
  assert.equal(toSnapshot(library).feedback.find(feedback => feedback.id === item.id)?.notes, 'Reviewed');
});
test('provides bilingual instructions without translating mandatory MeetingSum metadata keys', () => {
  for (const language of ['en', 'nl'] as const) {
    const text = summaryInstruction(language);
    for (const key of ['Datum', 'Deelnemers', 'Tags', 'Executive Summary', 'Meeting Details']) assert.ok(text.includes(key));
    assert.ok(text.includes('.md'));
    assert.ok(text.includes('.docx'));
  }
});
