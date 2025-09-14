import { Router } from 'express';
import { signup, login } from '../controllers/authController.js';
import { listProducts, getProduct, createProduct, updateProduct, deleteProduct } from '../controllers/productsController.js';
import { getCart, addItem, updateItem, removeItem } from '../controllers/cartController.js';
import { checkout, listOrders } from '../controllers/checkoutController.js';
import { authRequired, adminRequired } from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/', (req, res) => { res.json({ name: 'E-Commerce API (modular)' }); });

// Auth
router.post('/auth/signup', signup);
router.post('/auth/login', login);

// Products
router.get('/products', listProducts);
router.get('/products/:id', getProduct);
router.post('/products', authRequired, adminRequired, createProduct);
router.put('/products/:id', authRequired, adminRequired, updateProduct);
router.delete('/products/:id', authRequired, adminRequired, deleteProduct);

// Cart
router.get('/cart', authRequired, getCart);
router.post('/cart/items', authRequired, addItem);
router.put('/cart/items/:productId', authRequired, updateItem);
router.delete('/cart/items/:productId', authRequired, removeItem);

// Checkout / Orders
router.post('/checkout', authRequired, checkout);
router.get('/orders', authRequired, listOrders);

export default router;


