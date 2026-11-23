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
    body('asignadoId')
        .optional({ values: 'null' })
        .isMongoId()
        .withMessage('El usuario asignado no es válido'),
    body('etiquetas')
        .optional()
        .isArray()
        .withMessage('Las etiquetas deben ser una lista'),
    body('etiquetas.*')
        .isString().withMessage('Cada etiqueta debe ser texto')
        .bail()
        .trim()
        .notEmpty().withMessage('Las etiquetas no pueden estar vacías'),
    body('subtareas')
        .optional()
        .isArray()
        .withMessage('Las subtareas deben ser una lista'),
    body('subtareas.*.titulo')
        .isString().withMessage('El título de la subtarea debe ser texto')
        .bail()
        .trim()
        .notEmpty().withMessage('El título de la subtarea no puede estar vacío'),
    body('subtareas.*.completada')
        .optional()
        .isBoolean()
        .withMessage('El estado de la subtarea debe ser booleano'),
    body('subtareas.*.asignadoId')
        .optional({ values: 'null' })
        .isMongoId()
        .withMessage('El responsable de la subtarea no es válido'),
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
router.get('/tags', tareaController.listarEtiquetas);
router.delete('/tasks/:id', validarIdTarea, tareaController.eliminar);

module.exports = router;
