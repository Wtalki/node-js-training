import { db } from '../services/db.js';
import { hashPassword, verifyPassword, signToken } from '../services/auth.js';

function isNonEmptyString(v) { return typeof v === 'string' && v.trim().length > 0; }

export function signup(req, res) {
  try {
    const body = req.body || {};
    const errors = [];
    if (!isNonEmptyString(body.name)) errors.push('name is required');
    if (!isNonEmptyString(body.email)) errors.push('email is required');
    if (!isNonEmptyString(body.password)) errors.push('password is required');
    if (errors.length) return res.status(400).json({ errors });

    const email = body.email.trim().toLowerCase();
    const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (exists) return res.status(400).json({ errors: ['email already exists'] });

    const now = new Date().toISOString();
    hashPassword(body.password).then((passwordHash) => {
      const stmt = db.prepare('INSERT INTO users (name, email, password_hash, created_at) VALUES (?, ?, ?, ?)');
      const info = stmt.run(body.name.trim(), email, passwordHash, now);
      const user = { id: info.lastInsertRowid, name: body.name.trim(), email };
      const token = signToken(user);
      return res.status(201).json({ token });
    }).catch((err) => res.status(500).json({ error: 'internal_error', message: err.message }));
  } catch (err) { return res.status(500).json({ error: 'internal_error', message: err.message }); }
}

export function login(req, res) {
  try {
    const body = req.body || {};
    if (!isNonEmptyString(body.email) || !isNonEmptyString(body.password)) return res.status(400).json({ errors: ['email and password are required'] });
    const email = body.email.trim().toLowerCase();
    const row = db.prepare('SELECT id, name, email, password_hash FROM users WHERE email = ?').get(email);
    if (!row) return res.status(401).json({ message: 'Unauthorized' });
    verifyPassword(body.password, row.password_hash).then((ok) => {
      if (!ok) return res.status(401).json({ message: 'Unauthorized' });
      const token = signToken({ id: row.id, email: row.email, name: row.name });
      return res.json({ token });
    }).catch((err) => res.status(500).json({ error: 'internal_error', message: err.message }));
  } catch (err) { return res.status(500).json({ error: 'internal_error', message: err.message }); }
}


