import express from 'express';
import Datastore from 'nedb-promises';

const port = process.env.PORT ? Number(process.env.PORT) : 3005;

// Database (file-backed)
const postsDb = Datastore.create({ filename: 'blog-api/posts.db', autoload: true });
await postsDb.ensureIndex({ fieldName: 'id', unique: true });

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isStringArray(value) {
  return Array.isArray(value) && value.every((v) => typeof v === 'string');
}

async function getNextId() {
  const last = await postsDb.findOne({}).sort({ id: -1 });
  return last ? last.id + 1 : 1;
}

function validatePostPayload(body) {
  const errors = [];
  if (!isNonEmptyString(body.title)) errors.push('title is required and must be a non-empty string');
  if (!isNonEmptyString(body.content)) errors.push('content is required and must be a non-empty string');
  if (!isNonEmptyString(body.category)) errors.push('category is required and must be a non-empty string');
  if (!isStringArray(body.tags)) errors.push('tags must be an array of strings');
  return errors;
}

const app = express();
app.use(express.json());

// Create
app.post('/posts', async (req, res) => {
  try {
    const errors = validatePostPayload(req.body || {});
    if (errors.length) {
      return res.status(400).json({ errors });
    }
    const now = new Date().toISOString();
    const post = {
      id: await getNextId(),
      title: req.body.title.trim(),
      content: req.body.content.trim(),
      category: req.body.category.trim(),
      tags: req.body.tags,
      createdAt: now,
      updatedAt: now
    };
    await postsDb.insert(post);
    return res.status(201).json(post);
  } catch (err) {
    return res.status(500).json({ error: 'internal_error', message: err.message });
  }
});

// Read all + search
app.get('/posts', async (req, res) => {
  try {
    const term = (req.query.term || '').toString().trim();
    const query = term
      ? { $or: [
          { title: new RegExp(term, 'i') },
          { content: new RegExp(term, 'i') },
          { category: new RegExp(term, 'i') }
        ] }
      : {};
    const posts = await postsDb.find(query).sort({ createdAt: 1 });
    return res.json(posts);
  } catch (err) {
    return res.status(500).json({ error: 'internal_error', message: err.message });
  }
});

// Read one
app.get('/posts/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const post = await postsDb.findOne({ id });
    if (!post) return res.status(404).json({ error: 'not_found' });
    return res.json(post);
  } catch (err) {
    return res.status(500).json({ error: 'internal_error', message: err.message });
  }
});

// Update (PUT - replace)
app.put('/posts/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await postsDb.findOne({ id });
    if (!existing) return res.status(404).json({ error: 'not_found' });

    const errors = validatePostPayload(req.body || {});
    if (errors.length) {
      return res.status(400).json({ errors });
    }
    const updated = {
      id,
      title: req.body.title.trim(),
      content: req.body.content.trim(),
      category: req.body.category.trim(),
      tags: req.body.tags,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString()
    };
    await postsDb.update({ id }, updated, { upsert: false });
    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ error: 'internal_error', message: err.message });
  }
});

// Delete
app.delete('/posts/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const numRemoved = await postsDb.remove({ id }, { multi: false });
    if (numRemoved === 0) return res.status(404).json({ error: 'not_found' });
    return res.status(204).end();
  } catch (err) {
    return res.status(500).json({ error: 'internal_error', message: err.message });
  }
});

// Health
app.get('/', (req, res) => {
  return res.json({ name: 'Blogging Platform API', endpoints: ['/posts [GET, POST]', '/posts/:id [GET, PUT, DELETE]'] });
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Blog API running on http://localhost:${port}`);
});


