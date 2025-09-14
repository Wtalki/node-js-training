import { writeNoteFromContent, writeNoteFromBuffer, listNotes, readNote } from '../services/storage.js';
import { renderMarkdownToHtml } from '../services/markdown.js';

export async function createNote(req, res) {
  try {
    const body = req.body || {};
    const content = String(body.content || '');
    if (!content) return res.status(400).json({ errors: ['content is required'] });
    const base = String(body.filename || body.title || 'note');
    const saved = await writeNoteFromContent(base, content);
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: 'internal_error', message: err.message });
  }
}

export async function uploadNote(req, res) {
  try {
    if (!req.file) return res.status(400).json({ errors: ['file is required (field name: file)'] });
    const original = req.file.originalname || 'upload.md';
    const base = original.replace(/\.md$/i, '');
    const saved = await writeNoteFromBuffer(base, req.file.buffer);
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: 'internal_error', message: err.message });
  }
}

export async function listAllNotes(req, res) {
  try {
    const items = await listNotes();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'internal_error', message: err.message });
  }
}

export async function getNote(req, res) {
  try {
    const id = req.params.id;
    const content = await readNote(id);
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.send(content);
  } catch (err) {
    res.status(404).json({ error: 'not_found' });
  }
}

export async function getNoteHtml(req, res) {
  try {
    const id = req.params.id;
    const md = await readNote(id);
    const html = renderMarkdownToHtml(md);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(`<!doctype html><html><head><meta charset="utf-8"><title>${id}</title></head><body>${html}</body></html>`);
  } catch (err) {
    res.status(404).json({ error: 'not_found' });
  }
}


