const { Router } = require('express');
const { body } = require('express-validator');
const { registro, login } = require('../controllers/usuario.controller');
const validarCampos = require('../middlewares/validarCampos');

const router = Router();

router.post(
    '/login',
    body('email')
        .isString().withMessage('El correo electrónico debe ser texto')
        .bail()
        .trim()
        .isEmail().withMessage('El correo electrónico no es válido'),
    body('password')
        .isString().withMessage('La contraseña debe ser texto')
        .bail()
        .notEmpty().withMessage('La contraseña es obligatoria'),
    validarCampos,
    login
);

router.post(
    '/registro',
    body('nombre')
        .isString().withMessage('El nombre debe ser texto')
        .bail()
        .trim()
        .notEmpty().withMessage('El nombre no puede estar vacío'),
    body('email')
        .isString().withMessage('El correo electrónico debe ser texto')
        .bail()
        .trim()
        .isEmail().withMessage('El correo electrónico no es válido'),
    body('password')
        .isString().withMessage('La contraseña debe ser texto')
        .bail()
        .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
    validarCampos,
    registro
);

module.exports = router;