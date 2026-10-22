import assert from 'node:assert/strict';
import test from 'node:test';
import JSZip from 'jszip';
import mammoth from 'mammoth';
import { readDocuments } from '../src/documents.js';
import { addDocuments, editFeedback, emptyLibrary, removeSource, toSnapshot } from '../src/library.js';

const paragraph = (text: string) => `<w:p><w:r><w:t xml:space="preserve">${text}</w:t></w:r></w:p>`;

async function docx(lines: string[]) {
  const zip = new JSZip();
  zip.file('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
  zip.file('_rels/.rels', '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
  zip.file('word/document.xml', `<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${lines.map(paragraph).join('')}</w:body></w:document>`);
  return zip.generateAsync({ type: 'arraybuffer' });
}

// Node's mammoth build reads Buffers; the browser build (used by the app) reads ArrayBuffers.
const nodeExtract = async (file: Blob) => ({ text: (await mammoth.extractRawText({ buffer: Buffer.from(await file.arrayBuffer()) })).value, messages: [] as string[] });
const read = (files: File[], progress?: (done: number) => void) => readDocuments(files, progress, nodeExtract);

const lines = ['Datum: 20 oktober 2026', 'Klant: Fictieve Klant', 'Product: Reviews', 'Executive Summary', 'Een fictief gesprek.', 'Hoofdpunten (discussie)', '1. Filtering', 'De selectie is onduidelijk.', '2. Status', 'De flow is logisch.'];

test('reads Word documents in memory and reports unsupported, invalid and duplicate files', async () => {
  const bytes = await docx(lines);
  const files = [
    new File([bytes], '[Summary] Fictief - Interview.docx'),
    new File([bytes], '[Summary] Fictief - Interview.docx'),
    new File(['legacy'], 'old.doc'),
    new File(['not a zip'], 'broken.docx'),
    new File(['x'], 'image.png'),
    new File([''], 'empty.txt'),
    new File(['lock'], '~$temp.docx'),
  ];
  const steps: number[] = [];
  const { documents, issues } = await read(files, done => steps.push(done));
  assert.equal(documents.length, 1);
  assert.equal(documents[0].source.customer, 'Fictieve Klant');
  assert.equal(documents[0].source.date, '2026-10-20');
  assert.equal(documents[0].feedback.length, 2);
  assert.deepEqual(issues.map(issue => issue.reason).sort(), ['duplicate', 'empty', 'invalid', 'legacy', 'type']);
  assert.equal(steps.at(-1), 6);
});

test('library starts empty, keeps edits on re-import, removes and clears documents', async () => {
  assert.deepEqual(toSnapshot(emptyLibrary()), { sources: [], feedback: [], scannedAt: null, warnings: [] });
  const file = new File([await docx(lines)], 'session.docx');
  let library = addDocuments(emptyLibrary(), (await read([file])).documents);
  const item = toSnapshot(library).feedback[0];
  library = editFeedback(library, item.id, { ...item, status: 'Planned', notes: 'Follow up' });
  assert.throws(() => editFeedback(library, item.id, { ...item, status: 'Other' }));
  assert.throws(() => editFeedback(library, 'missing', item));
  library = addDocuments(library, (await read([file])).documents);
  assert.equal(library.sources.length, 1);
  assert.equal(toSnapshot(library).feedback[0].status, 'Planned');
  const other = (await read([new File(['Klant: Tweede\nEen los gesprek.'], 'second.txt')])).documents;
  library = addDocuments(library, other);
  assert.equal(library.sources.length, 2);
  library = removeSource(library, library.sources.find(source => source.filename === 'session.docx')!.id);
  assert.equal(library.sources.length, 1);
  assert.deepEqual(library.edits, {});
  assert.ok(library.feedback.every(feedback => feedback.customer === 'Tweede'));
});
