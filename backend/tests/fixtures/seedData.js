const bcrypt = require('bcrypt');
const Usuario = require('../../models/usuario.models');
const Tablero = require('../../models/tablero.models');
const Tarea = require('../../models/tarea.models');

// Plantilla de datos fijos y controlados para utilizar en entorno de pruebas.

const DATOS_SEMILLA = {
  usuarioA: {
    nombre: 'Usuario A',
    email: 'usuario.a@qa.test',
    password: 'Password123'
  },
  usuarioB: {
    nombre: 'Usuario B',
    email: 'usuario.b@qa.test',
    password: 'Password123'
  },
  tableroA: {
    nombre: 'Tablero de QA A',
    descripcion: 'Tablero de prueba de integración'
  },
  tareaA: {
    titulo: 'Tarea Inicial QA',
    descripcion: 'Tarea en estado Pendiente para pruebas',
    estado: 'Pendiente',
    prioridad: 'Media'
  }
};

const limpiarBaseDeDatos = async () => {
  await Tarea.deleteMany({});
  await Tablero.deleteMany({});
  await Usuario.deleteMany({});
};

const poblarDatosPrueba = async () => {
  await limpiarBaseDeDatos();

  // Crear Usuario A
  const passwordHashA = await bcrypt.hash(DATOS_SEMILLA.usuarioA.password, 10);
  const usuarioA = await Usuario.create({
    nombre: DATOS_SEMILLA.usuarioA.nombre,
    email: DATOS_SEMILLA.usuarioA.email,
    password: passwordHashA
  });

  // Crear Usuario B
  const passwordHashB = await bcrypt.hash(DATOS_SEMILLA.usuarioB.password, 10);
  const usuarioB = await Usuario.create({
    nombre: DATOS_SEMILLA.usuarioB.nombre,
    email: DATOS_SEMILLA.usuarioB.email,
    password: passwordHashB
  });

  // Crear Tablero A (pertenece a Usuario A)
  const tableroA = await Tablero.create({
    nombre: DATOS_SEMILLA.tableroA.nombre,
    descripcion: DATOS_SEMILLA.tableroA.descripcion,
    creadorId: usuarioA._id,
    miembros: [usuarioA._id]
  });

  // Crear Tarea A en Tablero A
  const tareaA = await Tarea.create({
    tableroId: tableroA._id,
    titulo: DATOS_SEMILLA.tareaA.titulo,
    descripcion: DATOS_SEMILLA.tareaA.descripcion,
    estado: DATOS_SEMILLA.tareaA.estado,
    prioridad: DATOS_SEMILLA.tareaA.prioridad
  });

  return {
    usuarioA,
    usuarioB,
    tableroA,
    tareaA,
    credenciales: {
      usuarioA: DATOS_SEMILLA.usuarioA,
      usuarioB: DATOS_SEMILLA.usuarioB
    }
  };
};

module.exports = {
  DATOS_SEMILLA,
  limpiarBaseDeDatos,
  poblarDatosPrueba
};
