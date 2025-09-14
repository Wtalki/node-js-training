import express from 'express';
import router from './routes/index.js';

const port = process.env.PORT ? Number(process.env.PORT) : 3011;
const app = express();
app.use(express.json());
app.use('/', router);

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`E-Commerce API running on http://localhost:${port}`);
});


