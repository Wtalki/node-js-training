import { isValidUrl, createLink, findByCode, updateUrl, removeByCode, incrementAccess } from '../services/shortener.js';

export async function createShort(req, res) {
  try {
    const url = String((req.body && req.body.url) || '');
    if (!isValidUrl(url)) return res.status(400).json({ errors: ['url must be a valid http/https URL'] });
    const doc = await createLink(url);
    return res.status(201).json({ id: String(doc.id), url: doc.url, shortCode: doc.shortCode, createdAt: doc.createdAt, updatedAt: doc.updatedAt });
  } catch (err) {
    return res.status(500).json({ error: 'internal_error', message: err.message });
  }
}

export async function getShort(req, res) {
  try {
    const code = req.params.code;
    const doc = await findByCode(code);
    if (!doc) return res.status(404).json({ error: 'not_found' });
    return res.json({ id: String(doc.id), url: doc.url, shortCode: doc.shortCode, createdAt: doc.createdAt, updatedAt: doc.updatedAt });
  } catch (err) {
    return res.status(500).json({ error: 'internal_error', message: err.message });
  }
}

export async function updateShort(req, res) {
  try {
    const code = req.params.code;
    const url = String((req.body && req.body.url) || '');
    if (!isValidUrl(url)) return res.status(400).json({ errors: ['url must be a valid http/https URL'] });
    const updated = await updateUrl(code, url);
    if (!updated) return res.status(404).json({ error: 'not_found' });
    return res.json({ id: String(updated.id), url: updated.url, shortCode: updated.shortCode, createdAt: updated.createdAt, updatedAt: updated.updatedAt });
  } catch (err) {
    return res.status(500).json({ error: 'internal_error', message: err.message });
  }
}

export async function deleteShort(req, res) {
  try {
    const code = req.params.code;
    const n = await removeByCode(code);
    if (n === 0) return res.status(404).end();
    return res.status(204).end();
  } catch (err) {
    return res.status(500).json({ error: 'internal_error', message: err.message });
  }
}

export async function statsShort(req, res) {
  try {
    const code = req.params.code;
    const doc = await findByCode(code);
    if (!doc) return res.status(404).json({ error: 'not_found' });
    return res.json({ id: String(doc.id), url: doc.url, shortCode: doc.shortCode, createdAt: doc.createdAt, updatedAt: doc.updatedAt, accessCount: doc.accessCount || 0 });
  } catch (err) {
    return res.status(500).json({ error: 'internal_error', message: err.message });
  }
}

export async function redirectShort(req, res) {
  try {
    const code = req.params.code;
    const doc = await findByCode(code);
    if (!doc) return res.status(404).send('Not Found');
    await incrementAccess(code);
    res.status(302).setHeader('Location', doc.url).end();
  } catch (err) {
    return res.status(500).send('Internal Error');
  }
}


