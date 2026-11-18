const mongoose = require('mongoose');

const TEST_MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/kanban_test';

// Funciones utilizadas por pruebas para no repetir codigo.

const conectarTestDb = async () => {
  if (mongoose.connection.readyState !== 0) {
    return;
  }
  console.log('[testDb] Conectando a:', TEST_MONGO_URI);
  await mongoose.connect(TEST_MONGO_URI, {
    serverSelectionTimeoutMS: 5000
  });
  console.log('[testDb] Conectado exitosamente!');
};

const desconectarTestDb = async () => {
  if (mongoose.connection.readyState !== 0) {
    console.log('[testDb] Desconectando...');
    await mongoose.connection.close();
    console.log('[testDb] Desconectado exitosamente!');
  }
};

module.exports = {
  TEST_MONGO_URI,
  conectarTestDb,
  desconectarTestDb
};
