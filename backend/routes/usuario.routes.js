const { Router } = require('express');
const { registro, login } = require('../controllers/usuario.controller');

const router = Router();

router.post('/login', login);

router.post('/registro', registro);

module.exports = router;