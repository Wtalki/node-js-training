import { db } from '../services/db.js';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const storageDir = path.resolve(process.cwd(), 'image-api', 'storage');
fs.mkdirSync(storageDir, { recursive: true });

function filePathFor(id, key, ext) {
  const base = key ? `${id}_${key}` : String(id);
  return path.join(storageDir, `${base}.${ext || 'bin'}`);
}

export async function uploadImage(req, res) {
  try {
    if (!req.file) return res.status(400).json({ errors: ['file is required (field: image)'] });
    const buf = req.file.buffer;
    const meta = await sharp(buf).metadata().catch(() => ({}));
    const now = new Date().toISOString();
    const ext = (req.file.originalname.split('.').pop() || '').toLowerCase();
    const info = db.prepare('INSERT INTO images (user_id, original_filename, mime, size, width, height, ext, created_at) VALUES (?,?,?,?,?,?,?,?)')
      .run(req.user.id, req.file.originalname, req.file.mimetype, req.file.size, meta.width || null, meta.height || null, ext, now);
    const id = info.lastInsertRowid;
    const fp = filePathFor(id, null, ext || 'bin');
    fs.writeFileSync(fp, buf);
    return res.status(201).json({ id, filename: req.file.originalname, mime: req.file.mimetype, size: req.file.size, width: meta.width, height: meta.height, ext });
  } catch (err) { return res.status(500).json({ error: 'internal_error', message: err.message }); }
}

export function getImage(req, res) {
  try {
    const id = Number(req.params.id);
    const row = db.prepare('SELECT * FROM images WHERE id = ? AND user_id = ?').get(id, req.user.id);
    if (!row) return res.status(404).json({ error: 'not_found' });
    const fp = filePathFor(id, null, row.ext || 'bin');
    if (!fs.existsSync(fp)) return res.status(404).json({ error: 'file_missing' });
    res.setHeader('Content-Type', row.mime);
    fs.createReadStream(fp).pipe(res);
  } catch (err) { return res.status(500).json({ error: 'internal_error', message: err.message }); }
}

export function listImages(req, res) {
  try {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 10)));
    const offset = (page - 1) * limit;
    const rows = db.prepare('SELECT * FROM images WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?').all(req.user.id, limit, offset);
    const total = db.prepare('SELECT COUNT(*) as c FROM images WHERE user_id = ?').get(req.user.id).c;
    return res.json({ data: rows, page, limit, total });
  } catch (err) { return res.status(500).json({ error: 'internal_error', message: err.message }); }
}

export async function transformImage(req, res) {
  try {
    const id = Number(req.params.id);
    const row = db.prepare('SELECT * FROM images WHERE id = ? AND user_id = ?').get(id, req.user.id);
    if (!row) return res.status(404).json({ error: 'not_found' });
    const t = req.body?.transformations || {};
    let img = sharp(filePathFor(id, null, row.ext || 'bin'));
    if (t.resize && (t.resize.width || t.resize.height)) img = img.resize(t.resize.width || null, t.resize.height || null);
    if (t.crop && (t.crop.width && t.crop.height)) img = img.extract({ width: t.crop.width, height: t.crop.height, left: t.crop.x || 0, top: t.crop.y || 0 });
    if (typeof t.rotate === 'number') img = img.rotate(t.rotate);
    if (t.filters?.grayscale) img = img.grayscale();
    if (t.filters?.sepia) img = img.modulate({ saturation: 0.5 }).tint('#704214');
    if (t.flip) img = img.flip();
    if (t.mirror) img = img.flop();
    if (t.compress) img = img.jpeg({ quality: Math.max(1, Math.min(100, Number(t.compress) || 80)) });
    const format = t.format && ['jpeg','png','webp','avif'].includes(String(t.format)) ? String(t.format) : row.ext || 'jpeg';
    const key = Buffer.from(JSON.stringify(t)).toString('base64url').slice(0, 24);
    const ext = format === 'jpg' ? 'jpeg' : format;
    const buf = await img.toFormat(ext).toBuffer();
    const now = new Date().toISOString();
    db.prepare('INSERT OR REPLACE INTO variants (image_id, key, mime, size, width, height, ext, created_at) VALUES (?,?,?,?,?,?,?,?)')
      .run(id, key, `image/${ext}`, buf.length, null, null, ext, now);
    const fp = filePathFor(id, key, ext);
    fs.writeFileSync(fp, buf);
    return res.json({ id, key, url: `/image-api/storage/${id}_${key}.${ext}`, mime: `image/${ext}`, size: buf.length });
  } catch (err) { return res.status(500).json({ error: 'internal_error', message: err.message }); }
}


