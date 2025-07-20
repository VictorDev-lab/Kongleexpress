export default (sequelize, DataTypes) => {
    const Order = sequelize.define('Order', {
      pinecone: { type: DataTypes.STRING, allowNull: false },
      amount: { type: DataTypes.INTEGER, allowNull: false },
      customerEmail: { type: DataTypes.STRING, allowNull: true },
    });
  
    return Order;
  };
  