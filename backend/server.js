import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { Sequelize, DataTypes } from 'sequelize';
import rateLimit from 'express-rate-limit';
import fs from 'fs';

// Load environment variables explicitly depending on NODE_ENV
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.local';
const envPath = path.resolve(process.cwd(), envFile);

if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log(`✅ Loaded environment variables from ${envFile}`);
} else {
  dotenv.config(); // fallback to default .env if no specific env file
  console.warn(`⚠️ Environment file ${envFile} not found, loaded default .env (if exists)`);
}

const app = express();
const PORT = process.env.PORT || 8080;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const isProduction = process.env.NODE_ENV === 'production' || !!process.env.RAILWAY_ENVIRONMENT;
const isLocal = !isProduction;

let sequelize;

if (process.env.MYSQL_URL) {
  try {
    const url = new URL(process.env.MYSQL_URL);

    // Railway proxy fix for local dev
    let host = url.hostname;
    let port = Number(url.port || 3306);

    if (isLocal && host.includes('.internal')) {
      host = 'ballast.proxy.rlwy.net';
      port = 36278;
      console.log('🔄 Local dev detected — switching to Railway proxy host');
    }

    sequelize = new Sequelize(
      url.pathname.slice(1), // database name
      url.username,
      url.password,
      {
        host,
        port,
        dialect: 'mysql',
        logging: false,
        dialectOptions: {
          ssl: {
            require: true,
            rejectUnauthorized: false,
          },
        },

        // THIS IS IMPORTANT: Add pool & retry config to avoid connection loss
        pool: {
          max: 10,
          min: 0,
          acquire: 30000,
          idle: 10000,
          evict: 15000,
        },
        retry: {
          max: 5, // Retry 5 times before failing
        },
        // Enable keepAlive to avoid server closing connection
        dialectOptions: {
          ... (url.protocol === 'mysql:' ? {} : { ssl: { require: true, rejectUnauthorized: false } }),
          connectTimeout: 10000,
        },
        define: {
          // Add this to avoid timezone issues
          timestamps: true,
          underscored: true,
        }
      }
    );

    // Add connection event handlers
    sequelize.addHook('afterConnect', (connection, config) => {
      console.log('✅ Database connection established');
    });
    
    sequelize.addHook('beforeDisconnect', (connection) => {
      console.log('⚠️ Database connection closing');
    });

    console.log(`✅ Using MYSQL_URL (${isLocal ? 'LOCAL' : 'PRODUCTION'})`);
    console.log(`🔗 Connecting to: ${host}:${port}`);
  } catch (err) {
    console.error('❌ Failed to parse MYSQL_URL:', err);
    process.exit(1);
  }
} else {
  // Fallback if MYSQL_URL not provided
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
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000,
        evict: 15000,
      },
      retry: { max: 5 },
      define: {
        timestamps: true,
        underscored: true,
      }
    }
  );
  console.log('✅ Using DB_NAME/USER/HOST env config');
}

// Define Order model
const Order = sequelize.define('Order', {
  item: { type: DataTypes.STRING, allowNull: false },
  quantity: { type: DataTypes.INTEGER, defaultValue: 1 },
});

// Trust proxy for Railway & rate limit
app.set('trust proxy', 1);

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  trustProxy: true,
});
app.use(limiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

import bodyParser from 'body-parser';
app.use(bodyParser.raw({ type: 'application/json' }));

app.post('/webhook', (req, res) => {
  // Stripe webhook logic here
  res.status(200).send('Webhook received');
});

// Determine frontend path with better detection
let frontendPath;
if (isProduction) {
  // In production, files are copied to backend directory
  frontendPath = __dirname;
} else {
  // In development, serve from frontend directory
  frontendPath = path.join(__dirname, '../frontend');
}

console.log(`📁 Serving static files from: ${frontendPath}`);
console.log(`🔍 Frontend path exists: ${fs.existsSync(frontendPath)}`);
if (fs.existsSync(frontendPath)) {
  const files = fs.readdirSync(frontendPath).filter(f => f.endsWith('.html'));
  console.log(`📁 HTML files found: ${files.join(', ')}`);
}

app.use(express.static(frontendPath));

// Serve your actual website pages
app.get('/', (req, res) => {
  const indexPath = path.join(frontendPath, 'index.html');
  console.log(`🔍 Looking for index.html at: ${indexPath}`);
  
  if (fs.existsSync(indexPath)) {
    console.log('✅ Found your frontend! Serving index.html');
    res.sendFile(path.resolve(indexPath));
  } else {
    console.log('⚠️ Frontend not found, serving maintenance page');
    const maintenancePath = path.join(__dirname, 'templates', 'maintenance.html');
    if (fs.existsSync(maintenancePath)) {
      res.status(503).sendFile(path.resolve(maintenancePath));
    } else {
      res.status(503).json({
        error: 'Website temporarily unavailable',
        message: 'Frontend files not found. Please check deployment.',
        status: 'maintenance',
        timestamp: new Date().toISOString()
      });
    }
  }
});

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
  res.json({ url: 'https://stripe.com/checkout' });
});

app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API route not found' });
});

// Start server & DB connection
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
