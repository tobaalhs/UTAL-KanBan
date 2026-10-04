const express = require('express');
const app = express();
const port = 3000;


app.use(cors())
app.use(express.json())


app.get('/', (req, res) => {
  console.log("El backend esta corriendo!");
  res.send("El backend esta corriendo");
});

app.listen(port, () => {
  process.stdout.write(`Servidor corriendo en el puerto ${port}\n`);
})