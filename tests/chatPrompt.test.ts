import assert from 'node:assert/strict';
import test from 'node:test';
import { buildChatPrompt, defaultChatSettings, parseChatSettings, serializeChatSettings } from '../src/chatPrompt.js';

test('prompt without questions asks the AI to wait, in the app language by default', () => {
  const nl = buildChatPrompt(defaultChatSettings, 'nl');
  assert.ok(nl.includes('wacht daarna op mijn vragen'));
  assert.ok(nl.includes('Antwoord altijd in het Nederlands'));
  const en = buildChatPrompt(defaultChatSettings, 'en');
  assert.ok(en.includes('wait for my questions'));
  assert.ok(en.includes('Always answer in English'));
});

test('prompt reflects role, questions, answer type, level, language and anonymization', () => {
  const settings = { ...defaultChatSettings, role: 'management' as const, questions: ['pain', 'moscow'], answer: 'brief' as const, layout: 'table' as const, level: 'child' as const, language: 'de' as const, maskNames: true };
  const prompt = buildChatPrompt(settings, 'nl', ['Wat vindt Klant 2 van de app?', '  '], 'Noem geen concurrenten.');
  assert.ok(prompt.includes('adviseur'));
  assert.ok(prompt.includes('1. Wat zijn de drie grootste pijnpunten'));
  assert.ok(prompt.includes('2. Maak een MoSCoW-prioritering'));
  assert.ok(prompt.includes('3. Wat vindt Klant 2 van de app?'));
  assert.ok(!prompt.includes('4.'));
  assert.ok(prompt.includes('één à twee zinnen'));
  assert.ok(prompt.includes('tabellen'));
  assert.ok(prompt.includes('kind van 8 jaar'));
  assert.ok(prompt.includes('Antwoord altijd in het Duits'));
  assert.ok(prompt.includes('probeer ze niet te herleiden'));
  assert.ok(prompt.includes('Noem geen concurrenten.'));
});

test('settings round-trip through cookie encoding and reject invalid values', () => {
  const settings = { ...defaultChatSettings, tool: 'chatgpt' as const, questions: ['trends'], level: 'expert' as const, format: 'json' as const };
  assert.deepEqual(parseChatSettings(serializeChatSettings(settings)), settings);
  const broken = parseChatSettings(encodeURIComponent(JSON.stringify({ tool: 'evil', questions: ['pain', 'x', 3], level: 'god', fullText: 'yes' })));
  assert.equal(broken.tool, 'claude');
  assert.deepEqual(broken.questions, ['pain']);
  assert.equal(broken.level, 'general');
  assert.equal(broken.fullText, true);
  assert.deepEqual(parseChatSettings('%%%'), defaultChatSettings);
});

test('the chosen AI tool adapts the working method in the prompt', () => {
  const copilot = buildChatPrompt({ ...defaultChatSettings, tool: 'copilot' }, 'nl');
  assert.ok(copilot.includes('## Werkwijze (Microsoft Copilot)'));
  assert.ok(copilot.includes('SharePoint'));
  const local = buildChatPrompt({ ...defaultChatSettings, tool: 'local' }, 'en');
  assert.ok(local.includes('without internet access'));
  assert.equal(parseChatSettings(serializeChatSettings({ ...defaultChatSettings, tool: 'gemini' })).tool, 'gemini');
  assert.equal(parseChatSettings(encodeURIComponent(JSON.stringify({ tool: 'bard' }))).tool, 'claude');
});
