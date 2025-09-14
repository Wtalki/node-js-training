import { cartsDb, productsDb } from '../services/db.js';

async function getOrCreateCart(userId) {
  let cart = await cartsDb.findOne({ userId });
  if (!cart) { cart = { userId, items: [] }; await cartsDb.insert(cart); }
  return cart;
}

export async function getCart(req, res) {
  try {
    const cart = await getOrCreateCart(req.user.id);
    res.json(cart);
  } catch (err) { res.status(500).json({ error: 'internal_error', message: err.message }); }
}

export async function addItem(req, res) {
  try {
    const body = req.body || {};
    const productId = Number(body.productId);
    let quantity = Number(body.quantity || 1);
    if (!Number.isInteger(productId) || productId <= 0) return res.status(400).json({ errors: ['productId must be integer'] });
    if (!Number.isInteger(quantity) || quantity <= 0) quantity = 1;
    const product = await productsDb.findOne({ id: productId });
    if (!product) return res.status(404).json({ error: 'product_not_found' });
    const cart = await getOrCreateCart(req.user.id);
    const idx = cart.items.findIndex((it) => it.productId === productId);
    if (idx >= 0) cart.items[idx].quantity += quantity; else cart.items.push({ productId, quantity });
    await cartsDb.update({ userId: req.user.id }, cart, { upsert: true });
    res.status(201).json(cart);
  } catch (err) { res.status(500).json({ error: 'internal_error', message: err.message }); }
}

export async function updateItem(req, res) {
  try {
    const productId = Number(req.params.productId);
    let quantity = Number(req.body?.quantity || 1);
    if (!Number.isInteger(quantity) || quantity < 0) return res.status(400).json({ errors: ['quantity must be integer >= 0'] });
    const cart = await getOrCreateCart(req.user.id);
    const idx = cart.items.findIndex((it) => it.productId === productId);
    if (idx < 0) return res.status(404).json({ error: 'item_not_found' });
    if (quantity === 0) cart.items.splice(idx, 1); else cart.items[idx].quantity = quantity;
    await cartsDb.update({ userId: req.user.id }, cart, { upsert: true });
    res.json(cart);
  } catch (err) { res.status(500).json({ error: 'internal_error', message: err.message }); }
}

export async function removeItem(req, res) {
  try {
    const productId = Number(req.params.productId);
    const cart = await getOrCreateCart(req.user.id);
    const idx = cart.items.findIndex((it) => it.productId === productId);
    if (idx < 0) return res.status(404).end();
    cart.items.splice(idx, 1);
    await cartsDb.update({ userId: req.user.id }, cart, { upsert: true });
    res.status(204).end();
  } catch (err) { res.status(500).json({ error: 'internal_error', message: err.message }); }
}


