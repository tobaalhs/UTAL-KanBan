const Tablero = require('../models/tablero.models');
const Tarea = require('../models/tarea.models');
const { crearErrorHttp } = require('../utils/errorHttp');
const serializarTarea = require('../utils/serializarTarea');

const CAMPOS_ASIGNADO = 'nombre email';

const normalizarEtiquetas = (etiquetas = []) => {
    const vistas = new Set();
    const resultado = [];
    for (const item of etiquetas) {
        if (typeof item !== 'string') continue;
        const limpia = item.trim();
        const clave = limpia.toLowerCase();
        if (!limpia || vistas.has(clave)) continue;
        vistas.add(clave);
        resultado.push(limpia);
    }
    return resultado;
};

const normalizarSubtareas = (subtareas = [], tablero) =>
    subtareas
        .filter((s) => s && typeof s.titulo === 'string' && s.titulo.trim())
        .map((s) => {
            const asignadoId = s.asignadoId || null;
            if (asignadoId) {
                validarAsignado(tablero, asignadoId);
            }
            return {
                ...(s._id ? { _id: s._id } : {}),
                titulo: s.titulo.trim(),
                completada: Boolean(s.completada),
                asignadoId
            };
        });

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
        asignadoId,
        etiquetas: normalizarEtiquetas(datos.etiquetas),
        subtareas: normalizarSubtareas(datos.subtareas, tablero)
    });

    await tarea.populate([
        { path: 'asignadoId', select: CAMPOS_ASIGNADO },
        { path: 'subtareas.asignadoId', select: CAMPOS_ASIGNADO }
    ]);
    return serializarTarea(tarea);
};

const actualizarTarea = async (id, datos, usuarioId) => {
    const { tarea, tablero } = await obtenerTareaYTableroMiembro(id, usuarioId);

    if (tarea.estado === 'Terminado') {
        throw crearErrorHttp(409, 'Una tarea finalizada no se puede modificar');
    }

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
    if (datos.etiquetas !== undefined) {
        tarea.etiquetas = normalizarEtiquetas(datos.etiquetas);
    }
    if (datos.subtareas !== undefined) {
        tarea.subtareas = normalizarSubtareas(datos.subtareas, tablero);
    }

    await tarea.save();
    await tarea.populate([
        { path: 'asignadoId', select: CAMPOS_ASIGNADO },
        { path: 'subtareas.asignadoId', select: CAMPOS_ASIGNADO }
    ]);
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

const listarEtiquetasGlobales = async () => {
    const etiquetas = await Tarea.distinct('etiquetas');
    return etiquetas
        .filter((e) => typeof e === 'string' && e.trim())
        .sort((a, b) => a.localeCompare(b, 'es'));
};

module.exports = {
    crearTarea,
    actualizarTarea,
    actualizarEstadoTarea,
    eliminarTarea,
    listarEtiquetasGlobales
};
