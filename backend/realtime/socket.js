const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const corsOptions = require('../config/cors.config');
const Usuario = require('../models/usuario.models');
const Tablero = require('../models/tablero.models');

// Colaboracion en tiempo real: cada tablero es una sala de Socket.IO.
// - Los cambios guardados (crear, editar, mover, eliminar) se avisan a toda la sala.
// - Mientras alguien arrastra una tarjeta se retransmite su posicion a los demas miembros.
// - La sala informa quien esta viendo el tablero (presencia).

const ESTADOS = ['Pendiente', 'En curso', 'Terminado'];
const sala = (tableroId) => `tablero:${tableroId}`;

let io = null;

const esIdValido = (id) =>
    typeof id === 'string' && mongoose.Types.ObjectId.isValid(id);
const acotar = (n) =>
    typeof n === 'number' && Number.isFinite(n)
        ? Math.min(1, Math.max(0, n))
        : null;

// Mismas reglas que el middleware verificarToken, pero el token llega en el handshake
const autenticar = async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token || typeof token !== 'string') {
        return next(new Error('Token de autenticación requerido'));
    }

    let payload;
    try {
        payload = jwt.verify(
            token,
            process.env.JWT_SECRET || 'clave_secreta_jwt'
        );
    } catch (error) {
        return next(new Error('Token de autenticación inválido o expirado'));
    }

    if (
        !payload ||
        typeof payload !== 'object' ||
        !mongoose.Types.ObjectId.isValid(payload.id)
    ) {
        return next(new Error('Token de autenticación inválido'));
    }

    try {
        const usuario = await Usuario.findById(payload.id).select(
            'nombre email'
        );
        if (!usuario) {
            return next(new Error('Usuario no encontrado'));
        }
        socket.data.usuario = {
            _id: usuario._id.toString(),
            nombre: usuario.nombre,
            email: usuario.email
        };
        return next();
    } catch (error) {
        return next(new Error('No se pudo autenticar la conexión'));
    }
};

// Usuarios distintos conectados a la sala (un usuario puede tener varias pestañas)
const emitirPresencia = async (tableroId) => {
    if (!io || !tableroId) return;
    const sockets = await io.in(sala(tableroId)).fetchSockets();
    const usuarios = new Map();
    for (const s of sockets) {
        if (s.data.usuario) usuarios.set(s.data.usuario._id, s.data.usuario);
    }
    io.to(sala(tableroId)).emit('presencia', [...usuarios.values()]);
};

const terminarArrastre = (socket) => {
    const { tableroId, arrastrando } = socket.data;
    if (tableroId && arrastrando) {
        socket.to(sala(tableroId)).emit('arrastre:fin', {
            usuarioId: socket.data.usuario._id,
            tareaId: arrastrando
        });
    }
    socket.data.arrastrando = null;
};

const salirDelTablero = async (socket) => {
    const { tableroId } = socket.data;
    if (!tableroId) return;
    terminarArrastre(socket);
    socket.data.tableroId = null;
    await socket.leave(sala(tableroId));
    await emitirPresencia(tableroId);
};

const registrarEventos = (socket) => {
    const usuario = socket.data.usuario;

    socket.on('tablero:unirse', async (tableroId, responder = () => {}) => {
        const ack = typeof responder === 'function' ? responder : () => {};
        if (!esIdValido(tableroId)) {
            return ack({ ok: false, mensaje: 'ID de tablero inválido' });
        }
        try {
            const tablero =
                await Tablero.findById(tableroId).select('miembros');
            const esMiembro = tablero?.miembros.some(
                (id) => id.toString() === usuario._id
            );
            if (!esMiembro) {
                return ack({
                    ok: false,
                    mensaje: 'No tienes permiso para acceder a este tablero'
                });
            }
            if (socket.data.tableroId !== tableroId) {
                await salirDelTablero(socket);
                socket.data.tableroId = tableroId;
                await socket.join(sala(tableroId));
            }
            await emitirPresencia(tableroId);
            return ack({ ok: true });
        } catch (error) {
            return ack({ ok: false, mensaje: 'No se pudo unir al tablero' });
        }
    });

    socket.on('tablero:salir', () => salirDelTablero(socket));

    socket.on('arrastre:inicio', (datos) => {
        const { tableroId } = socket.data;
        if (!tableroId || !esIdValido(datos?.tareaId)) return;
        socket.data.arrastrando = datos.tareaId;
        socket
            .to(sala(tableroId))
            .emit('arrastre:inicio', { usuario, tareaId: datos.tareaId });
    });

    // Posicion del cursor relativa al area de columnas (0..1) y columna sobre la que esta
    socket.on('arrastre:mover', (datos) => {
        const { tableroId, arrastrando } = socket.data;
        if (!tableroId || !arrastrando || datos?.tareaId !== arrastrando)
            return;
        socket.volatile.to(sala(tableroId)).emit('arrastre:mover', {
            usuario,
            tareaId: arrastrando,
            estado: ESTADOS.includes(datos.estado) ? datos.estado : null,
            x: acotar(datos.x),
            y: acotar(datos.y)
        });
    });

    socket.on('arrastre:fin', () => terminarArrastre(socket));

    socket.on('disconnect', () => {
        terminarArrastre(socket);
        emitirPresencia(socket.data.tableroId).catch(() => {});
    });
};

const iniciarTiempoReal = (servidorHttp) => {
    io = new Server(servidorHttp, { cors: corsOptions });
    io.use(autenticar);
    io.on('connection', registrarEventos);
    return io;
};

// Avisa un cambio a todos los miembros conectados al tablero.
// Si el servidor de tiempo real no esta iniciado (por ejemplo en tests) no hace nada.
const emitirATablero = (tableroId, evento, datos) => {
    if (!io || !tableroId) return;
    io.to(sala(tableroId.toString())).emit(evento, datos);
};

const cerrarTiempoReal = async () => {
    if (io) await io.close();
    io = null;
};

module.exports = { iniciarTiempoReal, emitirATablero, cerrarTiempoReal };
