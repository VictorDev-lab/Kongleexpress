import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

let sequelize;

// Auto-detect environment and use appropriate connection
const isProduction = process.env.NODE_ENV === 'production' || process.env.RAILWAY_ENVIRONMENT;
const isLocal = !isProduction;

if (process.env.MYSQL_URL) {
  try {
    const url = new URL(process.env.MYSQL_URL);
    
    // Override connection details based on environment
    let host = url.hostname;
    let port = Number(url.port || 3306);
    
    // If running locally but URL has internal host, switch to proxy
    if (isLocal && host.includes('.internal')) {
      host = 'ballast.proxy.rlwy.net';
      port = 36278;
      console.log('🔄 Local env detected - switching to proxy connection');
    }
    
    sequelize = new Sequelize(
      url.pathname.substring(1), // database name
      url.username,
      url.password,
      {
        host: host,
        port: port,
        dialect: 'mysql',
        logging: false,
        dialectOptions: {
          ssl: {
            require: true,
            rejectUnauthorized: false
          }
        }
      }
    );
    
    console.log(`✅ Using MYSQL_URL (${isLocal ? 'LOCAL' : 'PRODUCTION'} mode)`);
    console.log(`🔗 Connecting to: ${host}:${port}`);
    
  } catch (err) {
    console.error("❌ Error parsing MYSQL_URL:", err);
    process.exit(1);
  }
} else {
  // Fallback to individual env vars
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
          rejectUnauthorized: false
        }
      }
    }
  );
  console.log("✅ Using fallback DB env vars");
}

export default sequelize;