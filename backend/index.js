const express = require('express');
const cors = require('cors');
const app = express();
const port = 3000;

// Importar rutas
const usuarioRoutes = require('./routes/usuario.routes');

app.use(cors());
app.use(express.json());

// Usar las rutas
app.use('/api/usuarios', usuarioRoutes);

app.get('/', (req, res) => {
  console.log("El backend esta corriendo!");
  res.send("El backend esta corriendo");
});

app.listen(port, () => {
  process.stdout.write(`Servidor corriendo en el puerto ${port}\n`);
})