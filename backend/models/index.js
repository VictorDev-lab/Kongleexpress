import Sequelize from 'sequelize';
import dotenv from 'dotenv';
import OrderModel from './order.js';
import SubscriptionModel from './Subscription.js';

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false,  // valgfritt
  }
);

// Initialiser modellene
const Order = OrderModel(sequelize, Sequelize.DataTypes);
const Subscription = SubscriptionModel(sequelize, Sequelize.DataTypes);

// Sync tabeller - (vent med sync i app.js evt, men kan gjøre her også)
await sequelize.sync(); // evt. bare i app.js hvis du foretrekker

// Eksporter objekter for bruk i app.js
export default {
  sequelize,
  Order,
  Subscription,
};
