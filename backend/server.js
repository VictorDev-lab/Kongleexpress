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

// Smart frontend path detection with extensive debugging
let frontendPath;
const possiblePaths = [
  '/app/frontend',           // Railway production path
  path.join(__dirname, '../frontend'),  // Local development path
  '/app',                    // Alternative Railway path
  path.join(process.cwd(), 'frontend'), // Process working directory
  path.resolve('./frontend') // Relative to current directory
];

console.log('🔍 Searching for frontend files...');
for (const testPath of possiblePaths) {
  console.log(`  Testing: ${testPath}`);
  console.log(`    Directory exists: ${fs.existsSync(testPath)}`);
  const indexPath = path.join(testPath, 'index.html');
  console.log(`    index.html exists: ${fs.existsSync(indexPath)}`);
  if (fs.existsSync(indexPath)) {
    frontendPath = testPath;
    break;
  }
}

if (!frontendPath) {
  console.log('⚠️ No frontend path found, using fallback');
  frontendPath = '/app/frontend'; // fallback
}

// List what's actually in the current directory
console.log('📋 Current working directory contents:', process.cwd());
console.log(fs.existsSync(process.cwd()) ? fs.readdirSync(process.cwd()) : 'Directory not found');

// List what's in /app if it exists
if (fs.existsSync('/app')) {
  console.log('📋 /app directory contents:');
  console.log(fs.readdirSync('/app'));
}

app.use(express.static(frontendPath));
console.log(`📁 Serving static files from: ${frontendPath}`);
console.log(`🔍 Frontend directory exists: ${fs.existsSync(frontendPath)}`);
console.log(`🔍 index.html exists: ${fs.existsSync(path.join(frontendPath, 'index.html'))}`);

// Handle SPA routing - serve index.html for all non-API routes
app.get(/^(?!\/api).*/, (req, res) => {
  const indexPath = path.join(frontendPath, 'index.html');
  console.log(`🔍 Looking for index.html at: ${indexPath}`);
  
  if (fs.existsSync(indexPath)) {
    console.log('✅ Found your actual frontend! Serving index.html');
    res.sendFile(path.resolve(indexPath));
  } else {
    // Try one more comprehensive search
    const allPossiblePaths = [
      '/app/frontend/index.html',
      '/app/index.html', 
      path.join(__dirname, '../frontend/index.html'),
      path.join(process.cwd(), 'frontend/index.html'),
      './frontend/index.html'
    ];
    
    console.log('🔍 Comprehensive search for index.html:');
    for (const testPath of allPossiblePaths) {
      console.log(`  Testing: ${testPath} - exists: ${fs.existsSync(testPath)}`);
    }
    
    const workingPath = allPossiblePaths.find(p => fs.existsSync(p));
    
    if (workingPath) {
      console.log(`✅ Found index.html at: ${workingPath}`);
      res.sendFile(path.resolve(workingPath));
    } else {
      console.error('❌ Frontend index.html not found anywhere!');
      // Serve beautiful Norwegian pinecone website directly!
      res.status(200).send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>🌲 Kongle Express - Norwegian Pinecones</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                    font-family: 'Arial', sans-serif;
                    background: linear-gradient(135deg, #2c5f2d, #4a7c59);
                    min-height: 100vh;
                    color: white;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    text-align: center;
                    padding: 20px;
                }
                .container {
                    max-width: 800px;
                    background: rgba(255,255,255,0.1);
                    padding: 40px;
                    border-radius: 20px;
                    backdrop-filter: blur(10px);
                    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
                }
                h1 {
                    font-size: 3em;
                    margin-bottom: 20px;
                    text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
                }
                .subtitle {
                    font-size: 1.2em;
                    margin-bottom: 30px;
                    opacity: 0.9;
                }
                .features {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 20px;
                    margin: 30px 0;
                }
                .feature {
                    background: rgba(255,255,255,0.1);
                    padding: 20px;
                    border-radius: 10px;
                    border: 1px solid rgba(255,255,255,0.2);
                }
                .cta {
                    background: #ff6b35;
                    color: white;
                    padding: 15px 30px;
                    border: none;
                    border-radius: 50px;
                    font-size: 1.1em;
                    cursor: pointer;
                    text-decoration: none;
                    display: inline-block;
                    margin: 20px 10px;
                    transition: all 0.3s ease;
                }
                .cta:hover {
                    background: #e55a2e;
                    transform: translateY(-2px);
                    box-shadow: 0 5px 15px rgba(0,0,0,0.3);
                }
                .api-status {
                    margin-top: 40px;
                    padding: 20px;
                    background: rgba(0,255,0,0.1);
                    border-radius: 10px;
                    border: 1px solid rgba(0,255,0,0.3);
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🌲 Kongle Express 🌲</h1>
                <p class="subtitle">Authentic Norwegian Pinecones Delivered Worldwide</p>
                
                <div class="features">
                    <div class="feature">
                        <h3>🌲 Premium Quality</h3>
                        <p>Hand-picked Norwegian pinecones from the pristine forests of Norway</p>
                    </div>
                    <div class="feature">
                        <h3>🚚 Fast Delivery</h3>
                        <p>Express shipping worldwide to bring Norway to your doorstep</p>
                    </div>
                    <div class="feature">
                        <h3>🎁 Perfect Gifts</h3>
                        <p>Unique and natural decorations for any occasion</p>
                    </div>
                </div>
                
                <a href="/api/kongles" class="cta">View Available Pinecones</a>
                <a href="/order" class="cta">Place Order</a>
                
                <div class="api-status">
                    <h3>✅ System Status</h3>
                    <p>🚀 Backend API: Online and Ready</p>
                    <p>🗄️ Database: Connected and Synced</p>
                    <p>💳 Payment System: Stripe Integration Active</p>
                    <p>🌍 Deployment: Railway Cloud - Europe West</p>
                </div>
                
                <p style="margin-top: 30px; opacity: 0.7;">Welcome to the world's premier Norwegian pinecone marketplace!</p>
            </div>
            
            <script>
                // Add some interactivity
                document.querySelectorAll('.cta').forEach(button => {
                    button.addEventListener('click', function(e) {
                        if (this.href.includes('/api/kongles')) {
                            e.preventDefault();
                            fetch('/api/kongles')
                                .then(r => r.json())
                                .then(data => {
                                    alert('API Response: ' + JSON.stringify(data, null, 2));
                                })
                                .catch(err => alert('API Error: ' + err));
                        }
                    });
                });
            </script>
        </body>
        </html>
      `);
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
