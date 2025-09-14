import { Router } from 'express';
import { createShort, getShort, updateShort, deleteShort, statsShort, redirectShort } from '../controllers/linksController.js';

const router = Router();

router.get('/', (req, res) => {
  res.json({ name: 'URL Shortener API', endpoints: ['/shorten [POST]', '/shorten/:code [GET, PUT, DELETE]', '/shorten/:code/stats [GET]', '/r/:code [GET]'] });
});

router.post('/shorten', createShort);
router.get('/shorten/:code', getShort);
router.put('/shorten/:code', updateShort);
router.delete('/shorten/:code', deleteShort);
router.get('/shorten/:code/stats', statsShort);
router.get('/r/:code', redirectShort);

export default router;


