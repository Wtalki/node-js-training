import { marked } from 'marked';

export function renderMarkdownToHtml(md) {
  return marked.parse(md || '');
}

export function simpleGrammarCheck(text) {
  const issues = [];
  if (/\bi\s+[a-z]/.test(text)) issues.push("Capitalize 'I' when used as a pronoun.");
  if (/\b([A-Za-z]+)\s+\1\b/i.test(text)) issues.push('Possible repeated word.');
  const longLines = String(text)
    .split(/\r?\n/)
    .map((l, i) => ({ i, len: l.length }))
    .filter((x) => x.len > 120);
  for (const { i, len } of longLines) issues.push(`Line ${i + 1} is long (${len} chars). Consider splitting.`);
  return issues;
}


