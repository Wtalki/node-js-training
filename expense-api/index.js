import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import Datastore from 'nedb-promises';

const port = process.env.PORT ? Number(process.env.PORT) : 3007;
const JWT_SECRET = process.env.EXPENSE_JWT_SECRET || process.env.JWT_SECRET || 'dev-expense-secret';

const CATEGORIES = ['Groceries','Leisure','Electronics','Utilities','Clothing','Health','Others'];

// Datastores
const usersDb = Datastore.create({ filename: 'expense-api/users.db', autoload: true });
const expensesDb = Datastore.create({ filename: 'expense-api/expenses.db', autoload: true });
await usersDb.ensureIndex({ fieldName: 'id', unique: true });
await usersDb.ensureIndex({ fieldName: 'email', unique: true });
await expensesDb.ensureIndex({ fieldName: 'id', unique: true });
await expensesDb.ensureIndex({ fieldName: 'userId' });

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isPositiveNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

async function getNextId(db) {
  const last = await db.findOne({}).sort({ id: -1 });
  return last ? last.id + 1 : 1;
}

function scryptHash(password, salt) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, dk) => {
      if (err) return reject(err);
      resolve(dk.toString('hex'));
    });
  });
}

async function hashPassword(plain) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = await scryptHash(plain, salt);
  return `${salt}:${hash}`;
}

async function verifyPassword(plain, stored) {
  const [salt, hash] = String(stored).split(':');
  if (!salt || !hash) return false;
  const candidate = await scryptHash(plain, salt);
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(candidate, 'hex'));
}

function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
}

function authRequired(req, res, next) {
  try {
    const header = String(req.headers.authorization || '');
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) return res.status(401).json({ message: 'Unauthorized' });
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = { id: payload.sub, email: payload.email, name: payload.name };
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
}

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  return res.json({
    name: 'Expense Tracker API',
    categories: CATEGORIES,
    endpoints: [
      'POST /signup',
      'POST /login',
      'GET /expenses?range=week|month|3months&start=YYYY-MM-DD&end=YYYY-MM-DD&category=Groceries',
      'POST /expenses', 'GET /expenses/:id', 'PUT /expenses/:id', 'DELETE /expenses/:id'
    ]
  });
});

// Auth
app.post('/signup', async (req, res) => {
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
      createdAt: new Date().toISOString()
    };
    await usersDb.insert(user);
    const token = signToken(user);
    return res.status(201).json({ token });
  } catch (err) {
    return res.status(500).json({ error: 'internal_error', message: err.message });
  }
});

app.post('/login', async (req, res) => {
  try {
    const body = req.body || {};
    if (!isNonEmptyString(body.email) || !isNonEmptyString(body.password)) {
      return res.status(400).json({ errors: ['email and password are required'] });
    }
    const email = body.email.trim().toLowerCase();
    const user = await usersDb.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Unauthorized' });
    const ok = await verifyPassword(body.password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: 'Unauthorized' });
    const token = signToken(user);
    return res.json({ token });
  } catch (err) {
    return res.status(500).json({ error: 'internal_error', message: err.message });
  }
});

// Expenses helpers
function coerceDate(value) {
  if (!value) return null;
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return null;
    return d;
  } catch { return null; }
}

function computeRange(range, startStr, endStr) {
  const now = new Date();
  let start = null;
  let end = null;
  if (range === 'week') {
    end = now;
    start = new Date(now);
    start.setDate(start.getDate() - 7);
  } else if (range === 'month') {
    end = now;
    start = new Date(now);
    start.setMonth(start.getMonth() - 1);
  } else if (range === '3months') {
    end = now;
    start = new Date(now);
    start.setMonth(start.getMonth() - 3);
  } else if (startStr || endStr) {
    start = coerceDate(startStr);
    end = coerceDate(endStr) || now;
  }
  return { start, end };
}

function validateExpensePayload(body, { partial = false } = {}) {
  const errors = [];
  if (!partial || body.amount !== undefined) {
    if (typeof body.amount === 'string') body.amount = Number(body.amount);
    if (!isPositiveNumber(body.amount)) errors.push('amount must be a positive number');
  }
  if (!partial || body.category !== undefined) {
    if (!CATEGORIES.includes(String(body.category))) errors.push('category must be one of: ' + CATEGORIES.join(', '));
  }
  if (body.date !== undefined && coerceDate(body.date) === null) errors.push('date must be ISO or YYYY-MM-DD');
  if (body.note !== undefined && typeof body.note !== 'string') errors.push('note must be a string');
  return errors;
}

// Create expense
app.post('/expenses', authRequired, async (req, res) => {
  try {
    const body = req.body || {};
    const errors = validateExpensePayload(body);
    if (errors.length) return res.status(400).json({ errors });
    const now = new Date().toISOString();
    const expense = {
      id: await getNextId(expensesDb),
      userId: req.user.id,
      amount: Number(body.amount),
      category: String(body.category),
      date: (coerceDate(body.date) || new Date()).toISOString(),
      note: isNonEmptyString(body.note) ? body.note.trim() : '',
      createdAt: now,
      updatedAt: now
    };
    await expensesDb.insert(expense);
    return res.status(201).json(expense);
  } catch (err) {
    return res.status(500).json({ error: 'internal_error', message: err.message });
  }
});

// List + filters
app.get('/expenses', authRequired, async (req, res) => {
  try {
    const { range, start, end, category } = Object.fromEntries(Object.entries(req.query).map(([k,v]) => [k, String(v)]));
    const { start: startDate, end: endDate } = computeRange(range, start, end);
    const query = { userId: req.user.id };
    if (category && CATEGORIES.includes(category)) query.category = category;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = startDate.toISOString();
      if (endDate) query.date.$lte = endDate.toISOString();
    }
    const items = await expensesDb.find(query).sort({ date: -1 });
    return res.json(items);
  } catch (err) {
    return res.status(500).json({ error: 'internal_error', message: err.message });
  }
});

// Read one
app.get('/expenses/:id', authRequired, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const exp = await expensesDb.findOne({ id, userId: req.user.id });
    if (!exp) return res.status(404).json({ message: 'Not Found' });
    return res.json(exp);
  } catch (err) {
    return res.status(500).json({ error: 'internal_error', message: err.message });
  }
});

// Update
app.put('/expenses/:id', authRequired, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await expensesDb.findOne({ id, userId: req.user.id });
    if (!existing) return res.status(404).json({ message: 'Not Found' });
    const body = req.body || {};
    const errors = validateExpensePayload(body, { partial: false });
    if (errors.length) return res.status(400).json({ errors });
    const updated = {
      ...existing,
      amount: Number(body.amount),
      category: String(body.category),
      date: (coerceDate(body.date) || new Date()).toISOString(),
      note: isNonEmptyString(body.note) ? body.note.trim() : '',
      updatedAt: new Date().toISOString()
    };
    await expensesDb.update({ id }, updated, { upsert: false });
    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ error: 'internal_error', message: err.message });
  }
});

// Delete
app.delete('/expenses/:id', authRequired, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await expensesDb.findOne({ id, userId: req.user.id });
    if (!existing) return res.status(404).end();
    await expensesDb.remove({ id }, { multi: false });
    return res.status(204).end();
  } catch (err) {
    return res.status(500).json({ error: 'internal_error', message: err.message });
  }
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Expense API running on http://localhost:${port}`);
});


