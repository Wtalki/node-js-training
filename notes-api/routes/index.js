import { Router } from 'express';
import { upload } from '../middlewares/upload.js';
import { checkGrammar } from '../controllers/grammarController.js';
import { createNote, uploadNote, listAllNotes, getNote, getNoteHtml } from '../controllers/notesController.js';

const router = Router();

router.get('/', (req, res) => {
  res.json({ name: 'Markdown Notes API', endpoints: ['/grammar [POST]', '/notes [GET, POST]', '/notes/upload [POST]', '/notes/:id [GET]', '/notes/:id/html [GET]'] });
});

router.post('/grammar', checkGrammar);
router.post('/notes', createNote);
router.post('/notes/upload', upload.single('file'), uploadNote);
router.get('/notes', listAllNotes);
router.get('/notes/:id', getNote);
router.get('/notes/:id/html', getNoteHtml);

export default router;


