import express from 'express';
import { apiRouter } from '../server/api.ts';
const app = express();
app.use('/api', apiRouter());
export default app;
