import express from 'express';
import router from './routes/index.js';

const port = process.env.PORT ? Number(process.env.PORT) : 3012;
const app = express();
app.use(express.json());
app.use('/', router);

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Workout API running on http://localhost:${port}`);
});


