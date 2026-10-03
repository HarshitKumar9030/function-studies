import express from 'express';
import { resolve } from 'node:path';
import { apiRouter } from './api.ts';
const app = express();
app.use('/api', apiRouter());
app.use(express.static(resolve('dist')));
app.get('/{*path}', (_req, res) => res.sendFile(resolve('dist/index.html')));
app.listen(Number(process.env.PORT || 5178), '127.0.0.1', () =>
  console.log(`Function Studies: http://127.0.0.1:${process.env.PORT || 5178}`),
);
