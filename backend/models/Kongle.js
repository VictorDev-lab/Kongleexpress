import { DataTypes } from 'sequelize';
import db from '../config/database.js';

const Kongle = db.define('Kongle', {
  sender:      { type: DataTypes.STRING, allowNull: false },
  recipient:   { type: DataTypes.STRING, allowNull: false },
  address:     { type: DataTypes.TEXT,   allowNull: false },
  message:     { type: DataTypes.TEXT },
  quoteType:   { type: DataTypes.STRING, allowNull: false },
  priceUSD:    { type: DataTypes.FLOAT, defaultValue: 20.00 },
  isSubscription: { type: DataTypes.BOOLEAN, defaultValue: false }
});

export default Kongle;

const data = Object.fromEntries(new FormData(orderForm));
const res = await fetch('http://localhost:3000/api/kongles', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
});