import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';
import { Sequelize, DataTypes } from 'sequelize';
import rateLimit from 'express-rate-limit';

// Load env vars
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Setup Sequelize connection
let sequelize;
if (process.env.MYSQL_URL) {
  try {
    const url = new URL(process.env.MYSQL_URL);
    sequelize = new Sequelize(
      url.pathname.slice(1),
      url.username,
      url.password,
      {
        host: url.hostname,
        port: Number(url.port || 3306),
        dialect: 'mysql',
        logging: false,
        dialectOptions: {
          ssl: {
            require: true,
            rejectUnauthorized: false,
          },
        },
      }
    );
    console.log("✅ Using MYSQL_URL from env");
  } catch (err) {
    console.error("❌ Failed to parse MYSQL_URL:", err);
    process.exit(1);
  }
} else {
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASS,
    {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 3306),
      dialect: 'mysql',
      logging: false,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      },
    }
  );
  console.log("✅ Using DB_NAME/USER/HOST env config");
}

// Define model
const Order = sequelize.define('Order', {
  item: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
  },
});

// Trust proxy correctly
app.set('trust proxy', 1);

// Apply security & logging middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));

// Rate limiting with trustProxy: true to avoid ERR_ERL_PERMISSIVE_TRUST_PROXY
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  trustProxy: true,
});
app.use(limiter);

// Body parsers
app.use(bodyParser.raw({ type: 'application/json' })); // for Stripe webhook
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Stripe webhook placeholder
app.post('/webhook', (req, res) => {
  // TODO: implement Stripe webhook logic here
  res.status(200).send('Webhook received');
});

// Serve static frontend files (FIXED PATH)
app.use(express.static(path.join(__dirname, '../frontend')));

// Serve frontend index.html on any non-API route (SPA support) - FIXED PATH
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

// API routes
app.get('/api', (req, res) => {
  res.json({ message: 'Kongle API is running!' });
});

app.get('/api/kongles', async (req, res) => {
  try {
    const orders = await Order.findAll();
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/kongles', async (req, res) => {
  try {
    const newOrder = await Order.create(req.body);
    res.status(201).json(newOrder);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/kongles/subscribe', (req, res) => {
  console.log('New subscriber:', req.body);
  res.status(200).json({ message: 'Subscribed!' });
});

app.post('/api/kongles/checkout', (req, res) => {
  res.json({ url: 'https://stripe.com/checkout' }); // Placeholder
});

// 404 fallback (for unknown API routes)
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API route not found' });
});

// Start server & connect to DB
(async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    console.log('✅ MySQL connection established & synced');

    app.listen(PORT, () => {
      console.log(`🚀 Kongle backend + frontend running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ DB connection error:', error);
    process.exit(1);
  }
})();

export { app, PORT, sequelize, Order };