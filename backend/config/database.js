import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

let db;

if (process.env.MYSQL_URL) {
  const url = new URL(process.env.MYSQL_URL);
  db = new Sequelize(
    url.pathname.substring(1), // DB name without leading slash
    url.username,
    url.password,
    {
      host: url.hostname,
      port: url.port,
      dialect: 'mysql',
    }
  );
} else {
  db = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASS,
    {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      dialect: 'mysql',
    }
  );
}

export default db;
