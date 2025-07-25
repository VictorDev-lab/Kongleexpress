import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

let sequelize;

// Make environment detection explicit and clear
const isProduction = process.env.NODE_ENV === 'production' && process.env.RAILWAY_ENVIRONMENT === 'production';
const isLocal = !isProduction;

console.log('🌐 Environment check:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('RAILWAY_ENVIRONMENT:', process.env.RAILWAY_ENVIRONMENT);
console.log('Detected isProduction:', isProduction ? 'Yes' : 'No');
console.log('Detected isLocal:', isLocal ? 'Yes' : 'No');

if (process.env.MYSQL_URL) {
  try {
    const url = new URL(process.env.MYSQL_URL);
    
    let host = url.hostname;
    let port = Number(url.port || 3306);
    
    // Only override if running locally AND host looks like internal Railway hostname
    if (isLocal && host.includes('.internal')) {
      host = 'ballast.proxy.rlwy.net';
      port = 36278;
      console.log('🔄 Local environment detected - switching to proxy connection');
    }
    
    sequelize = new Sequelize(
      url.pathname.substring(1), // database name without leading slash
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
      }
    );
    
    console.log(`✅ Using MYSQL_URL (${isLocal ? 'LOCAL' : 'PRODUCTION'} mode)`);
    console.log(`🔗 Connecting to: ${host}:${port}`);
    
  } catch (err) {
    console.error("❌ Error parsing MYSQL_URL:", err);
    process.exit(1);
  }
} else {
  // fallback using individual env vars
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
  console.log("✅ Using fallback DB env vars");
}

export default sequelize;
