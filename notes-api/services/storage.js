import { promises as fs } from 'fs';
import path from 'path';

const notesDir = path.resolve(process.cwd(), 'notes-api', 'notes');

export async function ensureNotesDir() {
  await fs.mkdir(notesDir, { recursive: true });
}

export function getNotesDir() {
  return notesDir;
}

export function slugify(input) {
  return String(input)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 80);
}

export async function writeNoteFromContent(baseName, content) {
  await ensureNotesDir();
  const base = slugify(baseName || 'note') || 'note';
  const filename = `${base}-${Date.now()}.md`;
  const filePath = path.join(notesDir, filename);
  await fs.writeFile(filePath, content, 'utf8');
  return { id: filename, filename };
}

export async function writeNoteFromBuffer(baseName, buffer) {
  await ensureNotesDir();
  const base = slugify(baseName || 'upload') || 'upload';
  const filename = `${base}-${Date.now()}.md`;
  const filePath = path.join(notesDir, filename);
  await fs.writeFile(filePath, buffer, 'utf8');
  return { id: filename, filename };
}

export async function listNotes() {
  await ensureNotesDir();
  const files = await fs.readdir(notesDir);
  return files.filter((f) => f.toLowerCase().endsWith('.md')).map((f) => ({ id: f, filename: f }));
}

export async function readNote(filename) {
  const filePath = path.join(notesDir, filename);
  return fs.readFile(filePath, 'utf8');
}


