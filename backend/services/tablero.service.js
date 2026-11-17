const Tablero = require('../models/tablero.models');
const Tarea = require('../models/tarea.models');
const Usuario = require('../models/usuario.models');
const { crearErrorHttp } = require('../utils/errorHttp');
const correoService = require('./correo.service');

const serializarMiembro = (miembro, creadorId) => {
    const id = miembro._id.toString();

    return {
        id,
        _id: id,
        nombre: miembro.nombre,
        email: miembro.email,
        esCreador: id === creadorId
    };
};

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
        createdAt: tarea.createdAt,
        updatedAt: tarea.updatedAt
    };
};

const serializarTablero = (tablero, opciones = {}) => {
    const id = tablero._id.toString();
    const creadorId = tablero.creadorId.toString();
    const resultado = {
        id,
        _id: id,
        nombre: tablero.nombre,
        descripcion: tablero.descripcion,
        creador_id: creadorId,
        creador: creadorId,
        miembros: tablero.miembros.map((miembro) => serializarMiembro(miembro, creadorId)),
        createdAt: tablero.createdAt,
        updatedAt: tablero.updatedAt,
        fechaUltimaModificacion: tablero.updatedAt
    };

    if (opciones.conteos) {
        resultado.cantidadTareas = opciones.conteos.cantidadTareas;
        resultado.cantidadTerminadas = opciones.conteos.cantidadTerminadas;
    }

    if (opciones.tareas) {
        resultado.tareas = opciones.tareas.map(serializarTarea);
    }

    return resultado;
};

const obtenerConteosTablero = async (tableroId) => {
    const [conteo] = await Tarea.aggregate([
        { $match: { tableroId } },
        {
            $group: {
                _id: null,
                cantidadTareas: { $sum: 1 },
                cantidadTerminadas: {
                    $sum: { $cond: [{ $eq: ['$estado', 'Terminado'] }, 1, 0] }
                }
            }
        }
    ]);

    return {
        cantidadTareas: conteo?.cantidadTareas || 0,
        cantidadTerminadas: conteo?.cantidadTerminadas || 0
    };
};

const obtenerTableroMiembro = async (id, usuarioId) => {
    const tablero = await Tablero.findById(id).populate('miembros', 'nombre email');

    if (!tablero) {
        throw crearErrorHttp(404, 'Tablero no encontrado');
    }

    const esMiembro = tablero.miembros.some((miembro) => miembro._id.toString() === usuarioId);
    if (!esMiembro) {
        throw crearErrorHttp(403, 'No tienes permiso para acceder a este tablero');
    }

    return tablero;
};

const crearTablero = async (datos, usuarioId) => {
    const tablero = await Tablero.create({
        nombre: datos.nombre,
        descripcion: datos.descripcion,
        creadorId: usuarioId,
        miembros: [usuarioId]
    });

    await tablero.populate('miembros', 'nombre email');
    return serializarTablero(tablero, {
        conteos: { cantidadTareas: 0, cantidadTerminadas: 0 }
    });
};

const listarTableros = async (usuarioId) => {
    const tableros = await Tablero.find({ miembros: usuarioId })
        .populate('miembros', 'nombre email')
        .sort({ updatedAt: -1 });

    if (!tableros.length) {
        return [];
    }

    const conteos = await Tarea.aggregate([
        { $match: { tableroId: { $in: tableros.map((tablero) => tablero._id) } } },
        {
            $group: {
                _id: '$tableroId',
                cantidadTareas: { $sum: 1 },
                cantidadTerminadas: {
                    $sum: { $cond: [{ $eq: ['$estado', 'Terminado'] }, 1, 0] }
                }
            }
        }
    ]);

    const conteosPorTablero = new Map(
        conteos.map((conteo) => [conteo._id.toString(), conteo])
    );

    return tableros.map((tablero) => {
        const conteo = conteosPorTablero.get(tablero._id.toString());
        return serializarTablero(tablero, {
            conteos: {
                cantidadTareas: conteo?.cantidadTareas || 0,
                cantidadTerminadas: conteo?.cantidadTerminadas || 0
            }
        });
    });
};

const obtenerTablero = async (id, usuarioId) => {
    const tablero = await obtenerTableroMiembro(id, usuarioId);
    const tareas = await Tarea.find({ tableroId: tablero._id }).sort({ createdAt: 1 });
    return serializarTablero(tablero, { tareas });
};

const actualizarTablero = async (id, datos, usuarioId) => {
    const tablero = await obtenerTableroMiembro(id, usuarioId);

    tablero.nombre = datos.nombre;
    if (datos.descripcion !== undefined) {
        tablero.descripcion = datos.descripcion;
    }

    await tablero.save();
    return serializarTablero(tablero, {
        conteos: await obtenerConteosTablero(tablero._id)
    });
};

const eliminarTablero = async (id, usuarioId) => {
    const tablero = await obtenerTableroMiembro(id, usuarioId);

    if (tablero.creadorId.toString() !== usuarioId) {
        throw crearErrorHttp(403, 'Solo el creador puede eliminar el tablero');
    }

    await Tarea.deleteMany({ tableroId: tablero._id });
    await Tablero.deleteOne({ _id: tablero._id });
};

const invitarMiembro = async (id, email, usuarioId) => {
    const tablero = await obtenerTableroMiembro(id, usuarioId);
    const usuario = await Usuario.findOne({ email: email.trim().toLowerCase() });

    if (!usuario) {
        throw crearErrorHttp(404, 'No existe un usuario registrado con ese correo');
    }

    const resultado = await Tablero.updateOne(
        { _id: tablero._id, miembros: { $ne: usuario._id } },
        { $addToSet: { miembros: usuario._id } }
    );

    if (!resultado.modifiedCount) {
        throw crearErrorHttp(409, 'El usuario ya es miembro del tablero');
    }

    const tableroActualizado = await Tablero.findById(tablero._id)
        .populate('miembros', 'nombre email');

    // Aviso por correo (HU-10). No se espera: no debe retrasar la respuesta (RNF08)
    // y, si falla, la invitacion ya quedo guardada. enviarInvitacion nunca lanza.
    const invitador = tableroActualizado.miembros.find(
        (miembro) => miembro._id.toString() === usuarioId
    );
    correoService.enviarInvitacion({
        email: usuario.email,
        nombreInvitado: usuario.nombre,
        nombreInvitador: invitador?.nombre,
        nombreTablero: tableroActualizado.nombre,
        tableroId: tableroActualizado._id.toString()
    });

    return {
        message: 'Usuario invitado añadido al tablero',
        ...serializarTablero(tableroActualizado, {
            conteos: await obtenerConteosTablero(tablero._id)
        })
    };
};

const listarMiembros = async (id, usuarioId) => {
    const tablero = await obtenerTableroMiembro(id, usuarioId);
    const creadorId = tablero.creadorId.toString();

    return tablero.miembros.map((miembro) => serializarMiembro(miembro, creadorId));
};

module.exports = {
    crearTablero,
    listarTableros,
    obtenerTablero,
    actualizarTablero,
    eliminarTablero,
    invitarMiembro,
    listarMiembros
};
