const tableroService = require('../services/tablero.service');
const { responderError } = require('../utils/errorHttp');

const crear = async (req, res) => {
    try {
        const tablero = await tableroService.crearTablero(req.body, req.user.id);
        return res.status(201).json(tablero);
    } catch (error) {
        return responderError(res, error);
    }
};

const listar = async (req, res) => {
    try {
        const tableros = await tableroService.listarTableros(req.user.id);
        return res.status(200).json(tableros);
    } catch (error) {
        return responderError(res, error);
    }
};

const obtener = async (req, res) => {
    try {
        const tablero = await tableroService.obtenerTablero(req.params.id, req.user.id);
        return res.status(200).json(tablero);
    } catch (error) {
        return responderError(res, error);
    }
};

const actualizar = async (req, res) => {
    try {
        const tablero = await tableroService.actualizarTablero(
            req.params.id,
            req.body,
            req.user.id
        );
        return res.status(200).json(tablero);
    } catch (error) {
        return responderError(res, error);
    }
};

const eliminar = async (req, res) => {
    try {
        await tableroService.eliminarTablero(req.params.id, req.user.id);
        return res.status(200).json({ message: 'Tablero eliminado con éxito' });
    } catch (error) {
        return responderError(res, error);
    }
};

const invitar = async (req, res) => {
    try {
        const resultado = await tableroService.invitarMiembro(
            req.params.id,
            req.body.email,
            req.user.id
        );
        return res.status(200).json(resultado);
    } catch (error) {
        return responderError(res, error);
    }
};

const listarMiembros = async (req, res) => {
    try {
        const miembros = await tableroService.listarMiembros(req.params.id, req.user.id);
        return res.status(200).json(miembros);
    } catch (error) {
        return responderError(res, error);
    }
};

module.exports = {
    crear,
    listar,
    obtener,
    actualizar,
    eliminar,
    invitar,
    listarMiembros
};
