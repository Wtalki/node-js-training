import { usersDb, cartsDb } from '../services/db.js';
import { ADMIN_EMAIL, hashPassword, signToken, verifyPassword } from '../services/auth.js';
import { getNextId } from '../services/db.js';

function isNonEmptyString(v) { return typeof v === 'string' && v.trim().length > 0; }

export async function signup(req, res) {
  try {
    const body = req.body || {};
    const errors = [];
    if (!isNonEmptyString(body.name)) errors.push('name is required');
    if (!isNonEmptyString(body.email)) errors.push('email is required');
    if (!isNonEmptyString(body.password)) errors.push('password is required');
    if (errors.length) return res.status(400).json({ errors });
    const email = body.email.trim().toLowerCase();
    const exists = await usersDb.findOne({ email });
    if (exists) return res.status(400).json({ errors: ['email already exists'] });
    const user = {
      id: await getNextId(usersDb),
      name: body.name.trim(),
      email,
      passwordHash: await hashPassword(body.password),
      role: email === ADMIN_EMAIL && ADMIN_EMAIL ? 'admin' : 'user',
      createdAt: new Date().toISOString()
    };
    await usersDb.insert(user);
    const token = signToken(user);
    await cartsDb.update({ userId: user.id }, { userId: user.id, items: [] }, { upsert: true });
    return res.status(201).json({ token });
  } catch (err) { return res.status(500).json({ error: 'internal_error', message: err.message }); }
}

export async function login(req, res) {
  try {
    const body = req.body || {};
    if (!isNonEmptyString(body.email) || !isNonEmptyString(body.password)) return res.status(400).json({ errors: ['email and password are required'] });
    const email = body.email.trim().toLowerCase();
    const user = await usersDb.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Unauthorized' });
    const ok = await verifyPassword(body.password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: 'Unauthorized' });
    const token = signToken(user);
    return res.json({ token });
  } catch (err) { return res.status(500).json({ error: 'internal_error', message: err.message }); }
}


