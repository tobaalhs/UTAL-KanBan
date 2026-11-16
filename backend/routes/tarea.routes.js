const { Router } = require('express');
const { body, param } = require('express-validator');
const tareaController = require('../controllers/tarea.controller');
const validarCampos = require('../middlewares/validarCampos');

const router = Router();

const validarIdTarea = [
    param('id').isMongoId().withMessage('ID de tarea inválido'),
    validarCampos
];

const validarDatosTarea = [
    body('titulo')
        .isString().withMessage('El título debe ser texto')
        .bail()
        .trim()
        .notEmpty().withMessage('El título no puede estar vacío'),
    body('descripcion')
        .optional()
        .isString().withMessage('La descripción debe ser texto')
        .bail()
        .trim(),
    body('prioridad')
        .optional()
        .isIn(['Alta', 'Media', 'Baja'])
        .withMessage('La prioridad no es válida'),
    validarCampos
];

router.post(
    '/boards/:boardId/tasks',
    param('boardId').isMongoId().withMessage('ID de tablero inválido'),
    ...validarDatosTarea.slice(0, -1),
    validarCampos,
    tareaController.crear
);
router.put(
    '/tasks/:id',
    ...validarIdTarea.slice(0, -1),
    ...validarDatosTarea,
    tareaController.actualizar
);
router.patch(
    '/tasks/:id/status',
    param('id').isMongoId().withMessage('ID de tarea inválido'),
    body('estado')
        .isIn(['Pendiente', 'En curso', 'Terminado'])
        .withMessage('El estado no es válido'),
    validarCampos,
    tareaController.actualizarEstado
);
router.delete('/tasks/:id', validarIdTarea, tareaController.eliminar);

module.exports = router;
