import express from 'express';
import router from './routes/index.js';

const port = process.env.PORT ? Number(process.env.PORT) : 3009;
const app = express();
app.use(express.json({ limit: '1mb' }));
app.use('/', router);

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Notes API running on http://localhost:${port}`);
});


