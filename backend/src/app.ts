import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { estimateRouter } from './controllers/estimateController';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/estimate', estimateRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

export default app;