const { Router } = require('express');
const { registro } = require('../controllers/usuario.controller');

const router = Router();

router.post('/login', (req, res) => {
    const { } = req.body;
});

router.post('/registro', registro);

module.exports = router;