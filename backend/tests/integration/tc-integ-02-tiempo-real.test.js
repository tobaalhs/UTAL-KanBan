const http = require('http');
const jwt = require('jsonwebtoken');
const request = require('supertest');
const { io: conectar } = require('socket.io-client');
const app = require('../../index');
const Tablero = require('../../models/tablero.models');
const {
    iniciarTiempoReal,
    cerrarTiempoReal
} = require('../../realtime/socket');
const { conectarTestDb, desconectarTestDb } = require('../helpers/testDb');
const { poblarDatosPrueba } = require('../fixtures/seedData');

const JWT_SECRET = process.env.JWT_SECRET || 'clave_secreta_jwt';

// Espera un evento del socket; falla si no llega a tiempo
const esperar = (socket, evento, ms = 3000) =>
    new Promise((resolve, reject) => {
        const timer = setTimeout(
            () => reject(new Error(`No llegó el evento ${evento}`)),
            ms
        );
        socket.once(evento, (datos) => {
            clearTimeout(timer);
            resolve(datos);
        });
    });

// Espera la lista de presencia que cumpla una condicion (llegan varias al unirse)
const esperarPresencia = (socket, condicion, ms = 3000) =>
    new Promise((resolve, reject) => {
        const timer = setTimeout(
            () => reject(new Error('No llegó la presencia esperada')),
            ms
        );
        const alRecibir = (usuarios) => {
            if (!condicion(usuarios)) return;
            clearTimeout(timer);
            socket.off('presencia', alRecibir);
            resolve(usuarios);
        };
        socket.on('presencia', alRecibir);
    });

describe('TC-INTEG-02: Colaboración en tiempo real (Socket.IO)', () => {
    let servidor;
    let url;
    let datos;
    let tokenA;
    let tokenB;
    const abiertos = [];

    const abrirSocket = (token) => {
        const socket = conectar(url, {
            auth: token ? { token } : {},
            transports: ['websocket'],
            reconnection: false,
            forceNew: true
        });
        abiertos.push(socket);
        return socket;
    };

    const conectado = (socket) =>
        new Promise((resolve, reject) => {
            socket.once('connect', resolve);
            socket.once('connect_error', reject);
        });

    const unirse = (socket, tableroId) =>
        new Promise((resolve) =>
            socket.emit('tablero:unirse', tableroId, resolve)
        );

    beforeAll(async () => {
        await conectarTestDb();
        servidor = http.createServer(app);
        iniciarTiempoReal(servidor);
        await new Promise((resolve) => servidor.listen(0, resolve));
        url = `http://127.0.0.1:${servidor.address().port}`;
    });

    afterAll(async () => {
        await cerrarTiempoReal();
        await new Promise((resolve) => servidor.close(resolve));
        await desconectarTestDb();
    });

    beforeEach(async () => {
        datos = await poblarDatosPrueba();
        tokenA = jwt.sign(
            { id: datos.usuarioA._id.toString(), email: datos.usuarioA.email },
            JWT_SECRET
        );
        tokenB = jwt.sign(
            { id: datos.usuarioB._id.toString(), email: datos.usuarioB.email },
            JWT_SECRET
        );
    });

    afterEach(() => {
        while (abiertos.length) abiertos.pop().disconnect();
    });

    const agregarBComoMiembro = () =>
        Tablero.updateOne(
            { _id: datos.tableroA._id },
            { $addToSet: { miembros: datos.usuarioB._id } }
        );

    it('1. Debe rechazar la conexión sin token', async () => {
        const socket = abrirSocket(null);
        await expect(conectado(socket)).rejects.toThrow(
            'Token de autenticación requerido'
        );
    });

    it('2. Debe impedir que un usuario que no es miembro se una a la sala del tablero', async () => {
        const socketB = abrirSocket(tokenB);
        await conectado(socketB);

        const respuesta = await unirse(socketB, datos.tableroA._id.toString());

        expect(respuesta.ok).toBe(false);
    });

    it('3. Debe avisar a los demás miembros cuando una tarea cambia de columna', async () => {
        await agregarBComoMiembro();
        const socketB = abrirSocket(tokenB);
        await conectado(socketB);
        expect((await unirse(socketB, datos.tableroA._id.toString())).ok).toBe(
            true
        );

        const evento = esperar(socketB, 'tarea:movida');
        const res = await request(app)
            .patch(`/api/v1/tasks/${datos.tareaA._id}/status`)
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ estado: 'En curso' });

        expect(res.status).toBe(200);
        expect(await evento).toEqual({
            _id: datos.tareaA._id.toString(),
            estado: 'En curso'
        });
    });

    it('4. Debe retransmitir el arrastre en vivo y la presencia a los demás miembros', async () => {
        await agregarBComoMiembro();
        const tableroId = datos.tableroA._id.toString();
        const tareaId = datos.tareaA._id.toString();

        const socketA = abrirSocket(tokenA);
        const socketB = abrirSocket(tokenB);
        await Promise.all([conectado(socketA), conectado(socketB)]);
        await unirse(socketB, tableroId);

        const presencia = esperarPresencia(
            socketB,
            (usuarios) => usuarios.length === 2
        );
        await unirse(socketA, tableroId);
        const usuarios = await presencia;
        expect(usuarios.map((u) => u.nombre).sort()).toEqual([
            'Usuario A',
            'Usuario B'
        ]);

        const inicio = esperar(socketB, 'arrastre:inicio');
        socketA.emit('arrastre:inicio', { tareaId });
        expect(await inicio).toMatchObject({
            tareaId,
            usuario: { nombre: 'Usuario A' }
        });

        const mover = esperar(socketB, 'arrastre:mover');
        socketA.emit('arrastre:mover', {
            tareaId,
            estado: 'Terminado',
            x: 0.8,
            y: 4
        });
        expect(await mover).toMatchObject({
            tareaId,
            estado: 'Terminado',
            x: 0.8,
            y: 1
        });

        // Si quien arrastra se desconecta, los demas dejan de ver el arrastre
        const fin = esperar(socketB, 'arrastre:fin');
        socketA.disconnect();
        expect(await fin).toEqual({
            usuarioId: datos.usuarioA._id.toString(),
            tareaId
        });
    });
});
