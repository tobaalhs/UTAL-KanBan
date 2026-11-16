const { Router } = require('express');
const { body, param } = require('express-validator');
const tableroController = require('../controllers/tablero.controller');
const validarCampos = require('../middlewares/validarCampos');

const router = Router();

const validarIdTablero = [
    param('id').isMongoId().withMessage('ID de tablero inválido'),
    validarCampos
];

const validarDatosTablero = [
    body('nombre')
        .isString().withMessage('El nombre debe ser texto')
        .bail()
        .trim()
        .notEmpty().withMessage('El nombre no puede estar vacío'),
    body('descripcion')
        .optional()
        .isString().withMessage('La descripción debe ser texto')
        .bail()
        .trim(),
    validarCampos
];

router.post('/', validarDatosTablero, tableroController.crear);
router.get('/', tableroController.listar);
router.get('/:id/members', validarIdTablero, tableroController.listarMiembros);
router.post(
    '/:id/members',
    param('id').isMongoId().withMessage('ID de tablero inválido'),
    body('email')
        .isString().withMessage('El correo electrónico debe ser texto')
        .bail()
        .trim()
        .isEmail().withMessage('El correo electrónico no es válido'),
    validarCampos,
    tableroController.invitar
);
router.get('/:id', validarIdTablero, tableroController.obtener);
router.put('/:id', [...validarIdTablero.slice(0, -1), ...validarDatosTablero], tableroController.actualizar);
router.delete('/:id', validarIdTablero, tableroController.eliminar);

module.exports = router;
