import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import routes from '../routes/index.js';
import ErrorHandler from '../middlewares/error.js';

const app = express();

app.use(express.json());
app.use(cors());
app.use(routes);
app.use(ErrorHandler);

export default app;
