// Devuelve el responsable de una tarea como { id, _id, nombre, email } o null.
// Solo funciona con el usuario ya poblado (populate('asignadoId', 'nombre email')).
const serializarAsignado = (asignado) => {
    if (!asignado || !asignado.nombre) {
        return null;
    }

    const id = asignado._id.toString();

    return {
        id,
        _id: id,
        nombre: asignado.nombre,
        email: asignado.email
    };
};

module.exports = serializarAsignado;
