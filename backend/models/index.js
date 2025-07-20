import OrderModel from './order.js';
db.Order = OrderModel(sequelize, Sequelize.DataTypes);
await db.Order.sync(); // Make table
