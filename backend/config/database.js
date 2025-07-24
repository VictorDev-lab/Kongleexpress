import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

let sequelize;

if (process.env.MYSQL_URL) {
  try {
    const url = new URL(process.env.MYSQL_URL);
    sequelize = new Sequelize(
      url.pathname.substring(1),
      url.username,
      url.password,
      {
        host: url.hostname,
        port: Number(url.port || 3306), // sørg for at det er tall
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
    console.log("✅ Using MYSQL_URL");
  } catch (err) {
    console.error("❌ Error parsing MYSQL_URL:", err);
    process.exit(1);
  }
} else {
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASS,
    {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PO_
