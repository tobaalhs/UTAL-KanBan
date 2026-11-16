const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const verificarToken = (req, res, next) => {
    const autorizacion = req.headers.authorization;
    const partes = autorizacion ? autorizacion.split(' ') : [];
    const [esquema, token] = partes;

    if (partes.length !== 2 || esquema !== 'Bearer' || !token) {
        return res.status(401).json({ mensaje: 'Token de autenticación requerido' });
    }

    let payload;
    try {
        payload = jwt.verify(
            token,
            process.env.JWT_SECRET || 'clave_secreta_jwt'
        );
    } catch (error) {
        return res.status(401).json({ mensaje: 'Token de autenticación inválido o expirado' });
    }

    if (!payload || typeof payload !== 'object' || !mongoose.Types.ObjectId.isValid(payload.id)) {
        return res.status(401).json({ mensaje: 'Token de autenticación inválido' });
    }

    req.user = {
        id: payload.id,
        email: payload.email
    };

    return next();
};

module.exports = verificarToken;
