import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createRoutes } from '../routes/index.js';
import ErrorHandler from '../middlewares/error.js';

function createApp({ noteRepository } = {}) {
  const app = express();

  app.use(express.json());
  app.use(cors());
  app.use(createRoutes({ noteRepository }));
  app.use(ErrorHandler);

  return app;
}

export { createApp };
export default createApp();
