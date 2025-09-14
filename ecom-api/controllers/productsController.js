import { productsDb } from '../services/db.js';
import { getNextId } from '../services/db.js';

function isNonEmptyString(v) { return typeof v === 'string' && v.trim().length > 0; }
function isPositiveNumber(v) { return typeof v === 'number' && Number.isFinite(v) && v > 0; }

export async function listProducts(req, res) {
  try {
    const term = String(req.query.term || '').trim();
    const query = term ? { $or: [ { title: new RegExp(term, 'i') }, { description: new RegExp(term, 'i') } ] } : {};
    const items = await productsDb.find(query).sort({ createdAt: -1 });
    res.json(items);
  } catch (err) { res.status(500).json({ error: 'internal_error', message: err.message }); }
}

export async function getProduct(req, res) {
  try {
    const id = Number(req.params.id);
    const p = await productsDb.findOne({ id });
    if (!p) return res.status(404).json({ error: 'not_found' });
    res.json(p);
  } catch (err) { res.status(500).json({ error: 'internal_error', message: err.message }); }
}

export async function createProduct(req, res) {
  try {
    const body = req.body || {};
    const errors = [];
    if (!isNonEmptyString(body.title)) errors.push('title is required');
    if (!isNonEmptyString(body.description)) errors.push('description is required');
    if (typeof body.price === 'string') body.price = Number(body.price);
    if (!isPositiveNumber(body.price)) errors.push('price must be positive');
    if (!Number.isInteger(body.stock) || body.stock < 0) errors.push('stock must be integer >= 0');
    if (errors.length) return res.status(400).json({ errors });
    const now = new Date().toISOString();
    const prod = { id: await getNextId(productsDb), title: body.title.trim(), description: body.description.trim(), price: Number(body.price), stock: Number(body.stock), createdAt: now, updatedAt: now };
    await productsDb.insert(prod);
    res.status(201).json(prod);
  } catch (err) { res.status(500).json({ error: 'internal_error', message: err.message }); }
}

export async function updateProduct(req, res) {
  try {
    const id = Number(req.params.id);
    const existing = await productsDb.findOne({ id });
    if (!existing) return res.status(404).json({ error: 'not_found' });
    const body = req.body || {};
    const upd = { ...existing };
    if (isNonEmptyString(body.title)) upd.title = body.title.trim();
    if (isNonEmptyString(body.description)) upd.description = body.description.trim();
    if (body.price !== undefined) upd.price = Number(body.price);
    if (body.stock !== undefined) upd.stock = Number(body.stock);
    upd.updatedAt = new Date().toISOString();
    await productsDb.update({ id }, upd, { upsert: false });
    res.json(upd);
  } catch (err) { res.status(500).json({ error: 'internal_error', message: err.message }); }
}

export async function deleteProduct(req, res) {
  try {
    const id = Number(req.params.id);
    const n = await productsDb.remove({ id }, { multi: false });
    if (n === 0) return res.status(404).end();
    res.status(204).end();
  } catch (err) { res.status(500).json({ error: 'internal_error', message: err.message }); }
}


