import { Router } from 'express';
import multer from 'multer';
import express from 'express';
import path from 'path';
import { migrate } from '../services/db.js';
import { register, login } from '../controllers/authController.js';
import { authRequired } from '../middlewares/authMiddleware.js';
import { uploadImage, getImage, listImages, transformImage } from '../controllers/imagesController.js';

migrate();

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.get('/', (req, res) => res.json({ name: 'Image API' }));

// Auth
router.post('/register', register);
router.post('/login', login);

// Images
router.post('/images', authRequired, upload.single('image'), uploadImage);
router.get('/images', authRequired, listImages);
router.get('/images/:id', authRequired, getImage);
router.post('/images/:id/transform', authRequired, transformImage);

// static for variants
router.use('/storage', express.static(path.resolve(process.cwd(), 'image-api', 'storage')));

export default router;


