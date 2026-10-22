import { parseDocument } from './analysis';
import type { ParsedDocument } from './library';

export const acceptedExtensions = ['.docx', '.md', '.txt'];
export const maxFileSize = 20 * 1024 * 1024;
export const maxFiles = 100;

export type ImportIssue = { file: string; reason: 'legacy' | 'type' | 'size' | 'duplicate' | 'invalid' | 'empty' | 'limit' | 'conversion' | 'other'; detail?: string };
export interface ImportResult { documents: ParsedDocument[]; issues: ImportIssue[] }

async function extractDocx(file: Blob) {
  const { default: mammoth } = await import('mammoth');
  const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
  return { text: result.value, messages: result.messages.map(message => message.message) };
}

/** Reads files entirely in the browser; nothing is uploaded or stored. */
export async function readDocuments(files: File[], progress?: (done: number, total: number) => void, extract = extractDocx): Promise<ImportResult> {
  const documents: ParsedDocument[] = [];
  const issues: ImportIssue[] = [];
  const candidates = files.filter(file => !file.name.startsWith('~$'));
  if (candidates.length > maxFiles) issues.push({ file: `${candidates.length - maxFiles}`, reason: 'limit' });
  const selected = candidates.slice(0, maxFiles);
  const seen = new Set<string>();
  for (const [index, file] of selected.entries()) {
    progress?.(index, selected.length);
    const name = file.name;
    if (/\.doc$/i.test(name)) { issues.push({ file: name, reason: 'legacy' }); continue; }
    if (!/\.(docx|md|txt)$/i.test(name)) { issues.push({ file: name, reason: 'type' }); continue; }
    if (file.size > maxFileSize) { issues.push({ file: name, reason: 'size' }); continue; }
    if (seen.has(name)) { issues.push({ file: name, reason: 'duplicate' }); continue; }
    seen.add(name);
    try {
      const { text, messages } = /\.docx$/i.test(name) ? await extract(file) : { text: await file.text(), messages: [] as string[] };
      if (!text.trim()) { issues.push({ file: name, reason: 'empty' }); continue; }
      documents.push(parseDocument(name, text, new Date(file.lastModified || Date.now()).toISOString()));
      issues.push(...messages.map(detail => ({ file: name, reason: 'conversion' as const, detail })));
    } catch (error) {
      const detail = error instanceof Error ? error.message : '';
      issues.push({ file: name, reason: /zip|central directory|end of data|corrupt/i.test(detail) ? 'invalid' : 'other', detail });
    }
  }
  progress?.(selected.length, selected.length);
  return { documents, issues };
}
