require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db.config');
const verificarToken = require('./middlewares/verificarToken');

const app = express();
const port = process.env.PORT || 3000;

// Conectar a la base de datos si se ejecuta directamente
if (require.main === module) {
  connectDB();
}

// Importacion de las rutas
const usuarioRoutes = require('./routes/usuario.routes');
const tableroRoutes = require('./routes/tablero.routes');
const tareaRoutes = require('./routes/tarea.routes');
const usuarioController = require('./controllers/usuario.controller');

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }

    let url;
    try {
      url = new URL(origin);
    } catch (error) {
      return callback(null, false);
    }

    const esLocalhost = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
    const esVercel = url.protocol === 'https:' && url.hostname.endsWith('.vercel.app');
    return callback(null, esLocalhost || esVercel);
  }
};

app.use(cors(corsOptions));
app.use(express.json());

app.use('/api/usuarios', usuarioRoutes);
app.use('/api/v1', verificarToken);
app.get('/api/v1/users', usuarioController.buscar);
app.use('/api/v1/boards', tableroRoutes);
app.use('/api/v1', tareaRoutes);

app.get('/', (req, res) => {
  console.log("El backend esta corriendo!");
  res.send("El backend esta corriendo");
});

if (require.main === module) {
  app.listen(port, () => {
    process.stdout.write(`Servidor corriendo en el puerto ${port}\n`);
  });
}

module.exports = app;