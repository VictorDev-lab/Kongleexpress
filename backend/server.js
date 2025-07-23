import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';
import rateLimit from 'express-rate-limit';

import sequelize, { Sequelize } from './config/database.js';
import OrderModel from './models/order.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Fix for express-rate-limit & proxies
app.set('trust proxy', true);

// Initialize the model
const Order = OrderModel(sequelize, Sequelize.DataTypes);

// Stripe webhook (bodyParser.raw MUST come BEFORE express.json)
app.post('/webhook', bodyParser.raw({ type: 'application/json' }), (req, res) => {
  res.status(200).send('Webhook received');
});

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,            // max 100 requests per IP per minute
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// DB connection and sync
(async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    console.log('✅ MySQL connection established & synced');
  } catch (err) {
    console.error('DB error:', err);
  }
})();

// Routes

// Health check API
app.get('/api', (req, res) => {
  res.json({ message: 'Kongle API is running!' });
});

// Get all orders
app.get('/api/kongles', async (req, res) => {
  try {
    const orders = await Order.findAll();
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new order
app.post('/api/kongles', async (req, res) => {
  try {
    console.log('Received order:', req.body);
    const newOrder = await Order.create(req.body);
    res.status(201).json(newOrder);
  } catch (err) {
    console.error('Order creation error:', err);
    res.status(400).json({ error: err.message });
  }
});

// Dummy Stripe checkout URL endpoint
app.post('/api/kongles/checkout', (req, res) => {
  const { pineconeType, subscription } = req.body;
  // TODO: Integrate Stripe API here later
  res.json({ url: 'https://stripe.com/checkout' });
});

// Serve frontend statically
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(express.static(path.join(__dirname, '../frontend')));

// Serve order.html manually (optional)
app.get('/order', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/order.html'));
});

// 404 fallback - serve 404.html or fallback text if missing
app.use((req, res) => {
  const fallbackPage = path.join(__dirname, '../frontend/404.html');
  res.status(404).sendFile(fallbackPage, err => {
    if (err) {
      res.status(404).send('404 - Siden finnes ikke');
    }
  });
});

// Start server
app.listen(PORT, () =>
  console.log(`🚀 Kongle backend + frontend running on http://localhost:${PORT}`)
);
