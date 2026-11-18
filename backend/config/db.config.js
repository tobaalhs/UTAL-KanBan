const mongoose = require('mongoose');

const connectDB = async (customUri) => {
  try {
    const uri = customUri || process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/kanban';
    const conn = await mongoose.connect(uri);
    if (process.env.NODE_ENV !== 'test') {
      console.log(`MongoDB Conectado: ${conn.connection.host}`);
    }
    return conn;
  } catch (error) {
    console.error(`Error conectando a MongoDB: ${error.message}`);
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
    throw error;
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
  } catch (error) {
    console.error(`Error desconectando MongoDB: ${error.message}`);
  }
};

module.exports = connectDB;
module.exports.connectDB = connectDB;
module.exports.disconnectDB = disconnectDB;
