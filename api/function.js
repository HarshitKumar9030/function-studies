import express from 'express';
import { apiRouter } from '../server-build/api.js';

const app = express();
app.use('/api', apiRouter());
export default app;
