const Tablero = require('../models/tablero.models');
const Tarea = require('../models/tarea.models');
const { crearErrorHttp } = require('../utils/errorHttp');
const serializarAsignado = require('../utils/serializarAsignado');

const CAMPOS_ASIGNADO = 'nombre email';

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
        asignado: serializarAsignado(tarea.asignadoId),
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

// El responsable de una tarea debe ser miembro del tablero
const validarAsignado = (tablero, asignadoId) => {
    const esMiembro = tablero.miembros.some((miembroId) => miembroId.toString() === asignadoId);
    if (!esMiembro) {
        throw crearErrorHttp(400, 'El usuario asignado no es miembro del tablero');
    }
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

    const asignadoId = datos.asignadoId || null;
    if (asignadoId) {
        validarAsignado(tablero, asignadoId);
    }

    const tarea = await Tarea.create({
        tableroId: tablero._id,
        titulo: datos.titulo,
        descripcion: datos.descripcion,
        prioridad: datos.prioridad,
        estado: 'Pendiente',
        asignadoId
    });

    await tarea.populate('asignadoId', CAMPOS_ASIGNADO);
    return serializarTarea(tarea);
};

const actualizarTarea = async (id, datos, usuarioId) => {
    const { tarea, tablero } = await obtenerTareaYTableroMiembro(id, usuarioId);

    tarea.titulo = datos.titulo;
    if (datos.descripcion !== undefined) {
        tarea.descripcion = datos.descripcion;
    }
    if (datos.prioridad !== undefined) {
        tarea.prioridad = datos.prioridad;
    }
    // undefined = no tocar el responsable, null = dejar la tarea sin asignar
    if (datos.asignadoId !== undefined) {
        if (datos.asignadoId !== null) {
            validarAsignado(tablero, datos.asignadoId);
        }
        tarea.asignadoId = datos.asignadoId;
    }

    await tarea.save();
    await tarea.populate('asignadoId', CAMPOS_ASIGNADO);
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
