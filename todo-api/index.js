import express from 'express';
import crypto from 'crypto';
import Datastore from 'nedb-promises';

const port = process.env.PORT ? Number(process.env.PORT) : 3006;

// Datastores (file-backed NeDB)
const usersDb = Datastore.create({ filename: 'todo-api/users.db', autoload: true });
const tokensDb = Datastore.create({ filename: 'todo-api/tokens.db', autoload: true });
const todosDb = Datastore.create({ filename: 'todo-api/todos.db', autoload: true });
await usersDb.ensureIndex({ fieldName: 'id', unique: true });
await usersDb.ensureIndex({ fieldName: 'email', unique: true });
await tokensDb.ensureIndex({ fieldName: 'token', unique: true });
await todosDb.ensureIndex({ fieldName: 'id', unique: true });

// Helpers
function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

async function getNextId(db) {
  const last = await db.findOne({}).sort({ id: -1 });
  return last ? last.id + 1 : 1;
}

function scryptHash(password, salt) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(derivedKey.toString('hex'));
    });
  });
}

async function hashPassword(plain) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = await scryptHash(plain, salt);
  return `${salt}:${hash}`;
}

async function verifyPassword(plain, stored) {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const candidate = await scryptHash(plain, salt);
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(candidate, 'hex'));
}

async function createToken(userId) {
  const token = crypto.randomBytes(32).toString('base64url');
  await tokensDb.insert({ token, userId, createdAt: new Date().toISOString() });
  return token;
}

async function getUserByToken(token) {
  if (!token) return null;
  const t = await tokensDb.findOne({ token });
  if (!t) return null;
  const user = await usersDb.findOne({ id: t.userId });
  return user || null;
}

// Express app
const app = express();
app.use(express.json());

// Auth middleware
async function authRequired(req, res, next) {
  const header = String(req.headers.authorization || '');
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const user = await getUserByToken(token);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });
  req.user = { id: user.id, email: user.email, name: user.name };
  return next();
}

// Routes
app.get('/', (req, res) => {
  return res.json({
    name: 'Todo List API',
    endpoints: [
      'POST /register',
      'POST /login',
      'GET /todos?page=1&limit=10&q=term',
      'POST /todos',
      'PUT /todos/:id',
      'DELETE /todos/:id'
    ]
  });
});

// Register
app.post('/register', async (req, res) => {
  try {
    const body = req.body || {};
    const errors = [];
    if (!isNonEmptyString(body.name)) errors.push('name is required');
    if (!isNonEmptyString(body.email)) errors.push('email is required');
    if (!isNonEmptyString(body.password)) errors.push('password is required');
    if (errors.length) return res.status(400).json({ errors });

    const exists = await usersDb.findOne({ email: body.email.trim().toLowerCase() });
    if (exists) return res.status(400).json({ errors: ['email already exists'] });

    const user = {
      id: await getNextId(usersDb),
      name: body.name.trim(),
      email: body.email.trim().toLowerCase(),
      passwordHash: await hashPassword(body.password),
      createdAt: new Date().toISOString()
    };
    await usersDb.insert(user);
    const token = await createToken(user.id);
    return res.status(201).json({ token });
  } catch (err) {
    return res.status(500).json({ error: 'internal_error', message: err.message });
  }
});

// Login
app.post('/login', async (req, res) => {
  try {
    const body = req.body || {};
    if (!isNonEmptyString(body.email) || !isNonEmptyString(body.password)) {
      return res.status(400).json({ errors: ['email and password are required'] });
    }
    const user = await usersDb.findOne({ email: body.email.trim().toLowerCase() });
    if (!user) return res.status(401).json({ message: 'Unauthorized' });
    const ok = await verifyPassword(body.password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: 'Unauthorized' });
    const token = await createToken(user.id);
    return res.json({ token });
  } catch (err) {
    return res.status(500).json({ error: 'internal_error', message: err.message });
  }
});

// Create todo
app.post('/todos', authRequired, async (req, res) => {
  try {
    const body = req.body || {};
    if (!isNonEmptyString(body.title)) return res.status(400).json({ errors: ['title is required'] });
    const todo = {
      id: await getNextId(todosDb),
      userId: req.user.id,
      title: body.title.trim(),
      description: isNonEmptyString(body.description) ? body.description.trim() : '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await todosDb.insert(todo);
    return res.status(201).json({ id: todo.id, title: todo.title, description: todo.description });
  } catch (err) {
    return res.status(500).json({ error: 'internal_error', message: err.message });
  }
});

// Update todo (PUT)
app.put('/todos/:id', authRequired, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await todosDb.findOne({ id });
    if (!existing) return res.status(404).json({ message: 'Not Found' });
    if (existing.userId !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
    const body = req.body || {};
    if (!isNonEmptyString(body.title)) return res.status(400).json({ errors: ['title is required'] });
    const updated = {
      ...existing,
      title: body.title.trim(),
      description: isNonEmptyString(body.description) ? body.description.trim() : '',
      updatedAt: new Date().toISOString()
    };
    await todosDb.update({ id }, updated, { upsert: false });
    return res.json({ id: updated.id, title: updated.title, description: updated.description });
  } catch (err) {
    return res.status(500).json({ error: 'internal_error', message: err.message });
  }
});

// Delete todo
app.delete('/todos/:id', authRequired, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await todosDb.findOne({ id });
    if (!existing) return res.status(404).end();
    if (existing.userId !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
    await todosDb.remove({ id }, { multi: false });
    return res.status(204).end();
  } catch (err) {
    return res.status(500).json({ error: 'internal_error', message: err.message });
  }
});

// Get todos (paginated + filtering)
app.get('/todos', authRequired, async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 10)));
    const q = String(req.query.q || '').trim();
    const sortBy = ['createdAt', 'updatedAt', 'title'].includes(String(req.query.sortBy)) ? String(req.query.sortBy) : 'createdAt';
    const sortOrder = String(req.query.sortOrder) === 'asc' ? 1 : -1;

    const baseQuery = { userId: req.user.id };
    const query = q ? { $and: [baseQuery, { $or: [ { title: new RegExp(q, 'i') }, { description: new RegExp(q, 'i') } ] }] } : baseQuery;

    const total = await todosDb.count(query);
    const data = await todosDb.find(query).sort({ [sortBy]: sortOrder }).skip((page - 1) * limit).limit(limit);
    const mapped = data.map(t => ({ id: t.id, title: t.title, description: t.description }));
    return res.json({ data: mapped, page, limit, total });
  } catch (err) {
    return res.status(500).json({ error: 'internal_error', message: err.message });
  }
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Todo API running on http://localhost:${port}`);
});


