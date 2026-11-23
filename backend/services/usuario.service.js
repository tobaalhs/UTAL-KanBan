const User = require('../models/usuario.models');
const bcrypt = require('bcrypt');

const jwt = require('jsonwebtoken');
const { crearErrorHttp } = require('../utils/errorHttp');

const registrarUsuario = async (nombre, email, password) => {
    email = email.trim().toLowerCase();
    const existeUsuario = await User.findOne({ email });
    if (existeUsuario) {
        throw crearErrorHttp(409, 'El correo electrónico ya está registrado');
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const nuevoUsuario = new User({
        nombre,
        email,
        password: hashedPassword
    });

    try {
        return await nuevoUsuario.save();
    } catch (error) {
        if (error.code === 11000) {
            throw crearErrorHttp(409, 'El correo electrónico ya está registrado');
        }

        throw error;
    }
};

const loginUsuario = async (email, password) => {
    const usuario = await User.findOne({ email: email.trim().toLowerCase() });
    if (!usuario) {
        throw crearErrorHttp(401, 'Credenciales inválidas');
    }

    const passwordValida = await bcrypt.compare(password, usuario.password);
    if (!passwordValida) {
        throw crearErrorHttp(401, 'Credenciales inválidas');
    }

    const token = jwt.sign(
        { id: usuario._id.toString(), email: usuario.email },
        process.env.JWT_SECRET || 'clave_secreta_jwt', //despues hay que aplicar esto en el .env
        { expiresIn: '24h' }
    );

    return { usuario, token };
};

const escaparRegex = (texto) => texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buscarUsuarios = async (termino = '', limite = 15) => {
    const limpio = termino.trim();
    if (!limpio) return [];

    const regex = new RegExp(escaparRegex(limpio), 'i');
    return User.find({
        $or: [{ email: regex }, { nombre: regex }]
    })
        .select('_id nombre email')
        .sort({ email: 1 })
        .limit(limite)
        .lean();
};

module.exports = {
    registrarUsuario,
    loginUsuario,
    buscarUsuarios
};
