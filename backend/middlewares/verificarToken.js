const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const verificarToken = (req, res, next) => {
    const autorizacion = req.headers.authorization;
    const [esquema, token] = autorizacion ? autorizacion.split(' ') : [];

    if (esquema !== 'Bearer' || !token) {
        return res.status(401).json({ mensaje: 'Token de autenticación requerido' });
    }

    try {
        const payload = jwt.verify(
            token,
            process.env.JWT_SECRET || 'clave_secreta_jwt'
        );

        if (!payload || typeof payload !== 'object' || !mongoose.Types.ObjectId.isValid(payload.id)) {
            return res.status(401).json({ mensaje: 'Token de autenticación inválido' });
        }

        req.user = {
            id: payload.id,
            email: payload.email
        };

        return next();
    } catch (error) {
        return res.status(401).json({ mensaje: 'Token de autenticación inválido o expirado' });
    }
};

module.exports = verificarToken;
