const serializarAsignado = require('./serializarAsignado');

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
        estado: tarea.estado,
        prioridad: tarea.prioridad,
        asignado: serializarAsignado(tarea.asignadoId),
        etiquetas: tarea.etiquetas || [],
        subtareas: (tarea.subtareas || []).map((s) => ({
            _id: s._id?.toString(),
            titulo: s.titulo,
            completada: Boolean(s.completada),
            asignado: serializarAsignado(s.asignadoId)
        })),
        createdAt: tarea.createdAt,
        updatedAt: tarea.updatedAt
    };
};

module.exports = serializarTarea;
