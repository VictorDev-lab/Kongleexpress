import { DataTypes } from 'sequelize';
import db from '../config/database.js';

const Subscription = db.define('Subscription', {
  email:       { type: DataTypes.STRING, allowNull: false },
  recipient:   { type: DataTypes.STRING, allowNull: false },
  address:     { type: DataTypes.TEXT,   allowNull: false },
  interval:    { type: DataTypes.STRING, defaultValue: 'monthly' },
  active:      { type: DataTypes.BOOLEAN, defaultValue: true }
});

export default Subscription;