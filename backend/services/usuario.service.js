const User = require('../models/usuario.models');
const bcrypt = require('bcrypt');

const jwt = require('jsonwebtoken');

const registrarUsuario = async (nombre, email, password) => {
    const existeUsuario = await User.findOne({ email });
    if (existeUsuario) {
        throw new Error('El correo electrónico ya está registrado');
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const nuevoUsuario = new User({
        nombre,
        email,
        password: hashedPassword
    });

    return await nuevoUsuario.save();
};

const loginUsuario = async (email, password) => {
    const usuario = await User.findOne({ email });
    if (!usuario) {
        throw new Error('Credenciales inválidas');
    }

    const passwordValida = await bcrypt.compare(password, usuario.password);
    if (!passwordValida) {
        throw new Error('Credenciales inválidas');
    }

    const token = jwt.sign(
        { id: usuario._id, email: usuario.email },
        process.env.JWT_SECRET || 'clave_secreta_jwt', //despues hay que aplicar esto en el .env
        { expiresIn: '2h' }
    );

    return { usuario, token };
};

module.exports = {
    registrarUsuario,
    loginUsuario
};
