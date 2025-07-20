import express from 'express';
import Kongle from '../models/Kongle.js';
import { createCheckoutSession, stripeWebhook } from '../controllers/stripeController.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const kongles = await Kongle.findAll();
  res.json(kongles);
});

router.post('/', async (req, res) => {
  try {
    const newKongle = await Kongle.create(req.body);
    res.status(201).json(newKongle);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Stripe routes
router.post('/checkout', createCheckoutSession);
router.post('/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

export default router;
