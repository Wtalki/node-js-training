import { db } from '../services/db.js';
import { hashPassword, verifyPassword, signToken } from '../services/auth.js';

function isNonEmptyString(v) { return typeof v === 'string' && v.trim().length > 0; }

export function register(req, res) {
  try {
    const body = req.body || {};
    const errors = [];
    if (!isNonEmptyString(body.username)) errors.push('username is required');
    if (!isNonEmptyString(body.password)) errors.push('password is required');
    if (errors.length) return res.status(400).json({ errors });
    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(body.username.trim());
    if (existing) return res.status(400).json({ errors: ['username already taken'] });
    const now = new Date().toISOString();
    hashPassword(body.password).then((passwordHash) => {
      const info = db.prepare('INSERT INTO users (username, password_hash, created_at) VALUES (?,?,?)').run(body.username.trim(), passwordHash, now);
      const token = signToken({ id: info.lastInsertRowid, username: body.username.trim() });
      return res.status(201).json({ id: info.lastInsertRowid, username: body.username.trim(), token });
    }).catch((err) => res.status(500).json({ error: 'internal_error', message: err.message }));
  } catch (err) { return res.status(500).json({ error: 'internal_error', message: err.message }); }
}

export function login(req, res) {
  try {
    const body = req.body || {};
    if (!isNonEmptyString(body.username) || !isNonEmptyString(body.password)) return res.status(400).json({ errors: ['username and password are required'] });
    const row = db.prepare('SELECT id, username, password_hash FROM users WHERE username = ?').get(body.username.trim());
    if (!row) return res.status(401).json({ message: 'Unauthorized' });
    verifyPassword(body.password, row.password_hash).then((ok) => {
      if (!ok) return res.status(401).json({ message: 'Unauthorized' });
      const token = signToken({ id: row.id, username: row.username });
      return res.json({ id: row.id, username: row.username, token });
    }).catch((err) => res.status(500).json({ error: 'internal_error', message: err.message }));
  } catch (err) { return res.status(500).json({ error: 'internal_error', message: err.message }); }
}


