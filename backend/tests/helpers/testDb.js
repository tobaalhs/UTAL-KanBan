const mongoose = require('mongoose');

const TEST_MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/kanban_test';

// Funciones utilizadas por pruebas para no repetir codigo.

const conectarTestDb = async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(TEST_MONGO_URI);
  }
};

const desconectarTestDb = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
};

module.exports = {
  TEST_MONGO_URI,
  conectarTestDb,
  desconectarTestDb
};
