import Stripe from 'stripe';
import dotenv from 'dotenv';
import Kongle from '../models/Kongle.js';
import Subscription from '../models/Subscription.js';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createCheckoutSession = async (req, res) => {
  const { pineconeType, subscription } = req.body;

  const products = {
    dusty:    { name: 'Dusty Dry Pinecone', price: 1000 },
    classic:  { name: 'Classic Kongle', price: 2000 },
    deluxe:   { name: 'Deluxe Furu Kongle', price: 3000 },
    ultra:    { name: 'Ultra Deluxe Supreme Kongle', price: 100000 },
  };

  const selected = products[pineconeType];

  if (!selected) return res.status(400).json({ error: 'Invalid pinecone type' });

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: subscription ? 'subscription' : 'payment',
    line_items: [{
      price_data: {
        currency: 'usd',
        recurring: subscription ? { interval: 'month' } : undefined,
        product_data: { name: selected.name + (subscription ? ' Subscription' : '') },
        unit_amount: selected.price,
      },
      quantity: 1,
    }],
    metadata: {
      pineconeType,
      product: selected.name + (subscription ? ' Subscription' : '')
    },
    success_url: 'http://localhost:3300/success.html',
    cancel_url: 'http://localhost:3300/cancel.html',
  });

  res.json({ url: session.url });
};

export const stripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const pineconeType = session.metadata?.pineconeType || 'unknown';
      const product = session.metadata?.product || 'unknown';
      const email = session.customer_email || session.customer_details?.email || 'unknown';

      if (session.mode === 'subscription') {
        await Subscription.create({
          stripeSessionId: session.id,
          customerEmail: email,
          pineconeType,
          product,
          status: 'active'
        });
        console.log('📦 Subscription saved to DB:', email);
      } else {
        await Kongle.create({
          stripeSessionId: session.id,
          customerEmail: email,
          pineconeType,
          product,
          price: session.amount_total,
          status: 'paid'
        });
        console.log('✅ Kongle purchase saved to DB:', email);
      }
      break;
    }

    case 'invoice.paid':
      console.log('💵 Subscription invoice paid');
      break;

    case 'customer.subscription.created':
      console.log('📦 Subscription created:', event.data.object.id);
      break;

    default:
      console.log(`ℹ️ Unhandled event type: ${event.type}`);
  }

  res.status(200).json({ received: true });
};
