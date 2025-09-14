import { cartsDb, ordersDb, productsDb } from '../services/db.js';
import { getNextId } from '../services/db.js';
import { stripe, stripeEnabled, stripeCurrency } from '../services/stripe.js';

async function getOrCreateCart(userId) {
  let cart = await cartsDb.findOne({ userId });
  if (!cart) { cart = { userId, items: [] }; await cartsDb.insert(cart); }
  return cart;
}

function computeCartTotal(cart, products) {
  let total = 0;
  for (const item of cart.items) {
    const p = products.find((x) => x.id === item.productId);
    if (p) total += p.price * item.quantity;
  }
  return Math.round(total * 100) / 100;
}

export async function checkout(req, res) {
  try {
    const cart = await getOrCreateCart(req.user.id);
    if (!cart.items.length) return res.status(400).json({ error: 'cart_empty' });
    const productIds = cart.items.map((it) => it.productId);
    const products = await productsDb.find({ id: { $in: productIds } });
    const total = computeCartTotal(cart, products);
    if (total <= 0) return res.status(400).json({ error: 'invalid_total' });

    if (stripeEnabled) {
      const intent = await stripe.paymentIntents.create({ amount: Math.round(total * 100), currency: stripeCurrency, metadata: { userId: String(req.user.id) } });
      return res.json({ provider: 'stripe', clientSecret: intent.client_secret, total, currency: stripeCurrency });
    }

    const now = new Date().toISOString();
    const order = { id: await getNextId(ordersDb), userId: req.user.id, items: cart.items, total, status: 'paid', createdAt: now };
    await ordersDb.insert(order);
    cart.items = [];
    await cartsDb.update({ userId: req.user.id }, cart, { upsert: true });
    return res.json({ provider: 'simulated', order });
  } catch (err) { res.status(500).json({ error: 'internal_error', message: err.message }); }
}

export async function listOrders(req, res) {
  try {
    const list = await ordersDb.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(list);
  } catch (err) { res.status(500).json({ error: 'internal_error', message: err.message }); }
}


