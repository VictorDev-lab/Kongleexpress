import Sequelize from 'sequelize';
import dotenv from 'dotenv';
import OrderModel from './order.js';
// import SubscriptionModel from './Subscription.js'; // if you have it

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false,
  }
);

const Order = OrderModel(sequelize, Sequelize.DataTypes);
// const Subscription = SubscriptionModel(sequelize, Sequelize.DataTypes);

await sequelize.sync(); // sync tables

export default {
  sequelize,
  Order,
  // Subscription,
};
