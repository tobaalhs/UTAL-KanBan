const User = require('../models/usuario.models');
const bcrypt = require('bcrypt');

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

module.exports = {
    registrarUsuario
};
