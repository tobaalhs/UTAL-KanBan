const tareaService = require('../services/tarea.service');
const { responderError } = require('../utils/errorHttp');

const crear = async (req, res) => {
    try {
        const tarea = await tareaService.crearTarea(
            req.params.boardId,
            req.body,
            req.user.id
        );
        return res.status(201).json(tarea);
    } catch (error) {
        return responderError(res, error);
    }
};

const actualizar = async (req, res) => {
    try {
        const tarea = await tareaService.actualizarTarea(
            req.params.id,
            req.body,
            req.user.id
        );
        return res.status(200).json(tarea);
    } catch (error) {
        return responderError(res, error);
    }
};

const actualizarEstado = async (req, res) => {
    try {
        const resultado = await tareaService.actualizarEstadoTarea(
            req.params.id,
            req.body.estado,
            req.user.id
        );
        return res.status(200).json(resultado);
    } catch (error) {
        return responderError(res, error);
    }
};

const eliminar = async (req, res) => {
    try {
        await tareaService.eliminarTarea(req.params.id, req.user.id);
        return res.status(200).json({ message: 'Tarea eliminada con éxito' });
    } catch (error) {
        return responderError(res, error);
    }
};

const listarEtiquetas = async (req, res) => {
    try {
        const etiquetas = await tareaService.listarEtiquetasGlobales();
        return res.status(200).json(etiquetas);
    } catch (error) {
        return responderError(res, error);
    }
};

module.exports = {
    crear,
    actualizar,
    actualizarEstado,
    eliminar,
    listarEtiquetas
};
