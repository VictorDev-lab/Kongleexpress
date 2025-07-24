import { DataTypes } from 'sequelize';
import db from '../config/database.js';

const Kongle = db.define('Kongle', {
  sender: { type: DataTypes.STRING, allowNull: false },
  recipient: { type: DataTypes.STRING, allowNull: false },
  address: { type: DataTypes.TEXT, allowNull: false },
  message: { type: DataTypes.TEXT },
  quoteType: { type: DataTypes.STRING, allowNull: false },
  priceUSD: { type: DataTypes.FLOAT, defaultValue: 20.0 },
  isSubscription: { type: DataTypes.BOOLEAN, defaultValue: false },
});

export default Kongle;
