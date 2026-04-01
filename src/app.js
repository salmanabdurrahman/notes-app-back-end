import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import modulesRouter from './modules/index.js';
import errorHandler from './core/errors/error-handler.js';

const app = express();

app.use(express.json());
app.use(cors());
app.use(modulesRouter);
app.use(errorHandler);

export default app;
