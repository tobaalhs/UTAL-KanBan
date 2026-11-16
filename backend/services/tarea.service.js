const Tablero = require('../models/tablero.models');
const Tarea = require('../models/tarea.models');
const { crearErrorHttp } = require('../utils/errorHttp');

const serializarTarea = (tarea) => {
    const id = tarea._id.toString();
    const tableroId = tarea.tableroId.toString();

    return {
        id,
        _id: id,
        tableroId,
        tablero: tableroId,
        titulo: tarea.titulo,
        descripcion: tarea.descripcion,
        prioridad: tarea.prioridad,
        estado: tarea.estado,
        createdAt: tarea.createdAt,
        updatedAt: tarea.updatedAt
    };
};

const obtenerTareaYTableroMiembro = async (id, usuarioId) => {
    const tarea = await Tarea.findById(id);

    if (!tarea) {
        throw crearErrorHttp(404, 'Tarea no encontrada');
    }

    const tablero = await Tablero.findById(tarea.tableroId);
    if (!tablero) {
        throw crearErrorHttp(404, 'Tablero no encontrado');
    }

    const esMiembro = tablero.miembros.some((miembroId) => miembroId.toString() === usuarioId);
    if (!esMiembro) {
        throw crearErrorHttp(403, 'No tienes permiso para acceder a esta tarea');
    }

    return { tarea, tablero };
};

const crearTarea = async (boardId, datos, usuarioId) => {
    const tablero = await Tablero.findById(boardId);

    if (!tablero) {
        throw crearErrorHttp(404, 'Tablero no encontrado');
    }

    const esMiembro = tablero.miembros.some((miembroId) => miembroId.toString() === usuarioId);
    if (!esMiembro) {
        throw crearErrorHttp(403, 'No tienes permiso para acceder a este tablero');
    }

    const tarea = await Tarea.create({
        tableroId: tablero._id,
        titulo: datos.titulo,
        descripcion: datos.descripcion,
        prioridad: datos.prioridad,
        estado: 'Pendiente'
    });

    return serializarTarea(tarea);
};

const actualizarTarea = async (id, datos, usuarioId) => {
    const { tarea } = await obtenerTareaYTableroMiembro(id, usuarioId);

    tarea.titulo = datos.titulo;
    if (datos.descripcion !== undefined) {
        tarea.descripcion = datos.descripcion;
    }
    if (datos.prioridad !== undefined) {
        tarea.prioridad = datos.prioridad;
    }

    await tarea.save();
    return serializarTarea(tarea);
};

const actualizarEstadoTarea = async (id, estado, usuarioId) => {
    const { tarea } = await obtenerTareaYTableroMiembro(id, usuarioId);
    tarea.estado = estado;
    await tarea.save();

    return {
        id: tarea._id.toString(),
        _id: tarea._id.toString(),
        estado_actualizado: tarea.estado,
        estado: tarea.estado
    };
};

const eliminarTarea = async (id, usuarioId) => {
    const { tarea, tablero } = await obtenerTareaYTableroMiembro(id, usuarioId);

    if (tablero.creadorId.toString() !== usuarioId) {
        throw crearErrorHttp(403, 'Solo el creador del tablero puede eliminar tareas');
    }

    await Tarea.deleteOne({ _id: tarea._id });
};

module.exports = {
    crearTarea,
    actualizarTarea,
    actualizarEstadoTarea,
    eliminarTarea
};
