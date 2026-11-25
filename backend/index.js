require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db.config');
const http = require('http');
const verificarToken = require('./middlewares/verificarToken');
const corsOptions = require('./config/cors.config');
const { iniciarTiempoReal } = require('./realtime/socket');

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
  // Express y Socket.IO comparten el mismo servidor HTTP
  const servidor = http.createServer(app);
  iniciarTiempoReal(servidor);
  servidor.listen(port, () => {
    process.stdout.write(`Servidor corriendo en el puerto ${port}\n`);
  });
}

module.exports = app;