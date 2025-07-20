import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser'; // ✅ Trengs for Stripe
import db from './config/database.js';

import kongleRoutes from './routes/kongleRoutes.js';
import Subscription from './models/Subscription.js';
import { stripeWebhook } from './controllers/stripeController.js'; // ✅

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// Stripe webhook må ha raw body
app.post('/webhook', bodyParser.raw({ type: 'application/json' }), stripeWebhook); // ✅ Før express.json()

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// DB Connection
try {
  await db.authenticate();
  await db.sync();
  console.log('MySQL connection established');
} catch (err) {
  console.error('DB error:', err);
}

// Routes
app.get('/', (req, res) => {
  res.send('Kongle backend is running!');
});

app.use('/api/kongles', kongleRoutes);

app.get('/api/subscriptions', async (req, res) => {
  try {
    const subs = await Subscription.findAll();
    res.json(subs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/subscriptions', async (req, res) => {
  try {
    const newSub = await Subscription.create(req.body);
    res.status(201).json(newSub);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Serve frontend static files
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(express.static(path.join(__dirname, '../frontend')));

// Start server
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
