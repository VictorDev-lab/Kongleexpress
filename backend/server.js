import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';

import sequelize, { Sequelize } from './config/database.js';
import OrderModel from './models/order.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initier modellen
const Order = OrderModel(sequelize, Sequelize.DataTypes);

// Stripe webhook trenger raw body (må være FØR express.json)
app.post('/webhook', bodyParser.raw({ type: 'application/json' }), (req, res) => {
  res.status(200).send('Webhook received');
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// DB connection og sync
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

// API health check
app.get('/api', (req, res) => {
  res.json({ message: 'Kongle API is running!' });
});

// Hent alle orders
app.get('/api/kongles', async (req, res) => {
  try {
    const orders = await Order.findAll();
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Lagre ny order
app.post('/api/kongles', async (req, res) => {
  try {
    console.log('Mottatt ordre:', req.body);
    const newOrder = await Order.create(req.body);
    res.status(201).json(newOrder);
  } catch (err) {
    console.error('Order creation error:', err);
    res.status(400).json({ error: err.message });
  }
});

// Dummy Stripe checkout URL
app.post('/api/kongles/checkout', (req, res) => {
  const { pineconeType, subscription } = req.body;
  // Her kan Stripe-API integreres senere
  res.json({ url: 'https://stripe.com/checkout' });
});

// Serve static frontend
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(express.static(path.join(__dirname, '../frontend')));

// Serve order.html manually (optional)
app.get('/order', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/order.html'));
});

// Fallback for unknown routes (optional)
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, '../frontend/404.html')); // create this file if you want
});

// Start server
app.listen(PORT, () => console.log(`🚀 Kongle backend + frontend running on http://localhost:${PORT}`));
