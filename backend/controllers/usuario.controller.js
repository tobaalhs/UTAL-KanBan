const usuarioService = require('../services/usuario.service');
const { responderError } = require('../utils/errorHttp');

const registro = async (req, res) => {
    try {
        const { nombre, email, password } = req.body;

        const usuarioCreado = await usuarioService.registrarUsuario(nombre, email, password);
        const id = usuarioCreado._id.toString();

        return res.status(201).json({
            message: 'Usuario registrado exitosamente',
            user: {
                id,
                email: usuarioCreado.email
            },
            mensaje: 'Usuario registrado exitosamente',
            usuario: {
                _id: id,
                nombre: usuarioCreado.nombre,
                email: usuarioCreado.email
            }
        });
    } catch (error) {
        return responderError(res, error);
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const { usuario, token } = await usuarioService.loginUsuario(email, password);
        const id = usuario._id.toString();

        return res.status(200).json({
            mensaje: 'Login exitoso',
            token,
            user: {
                id,
                nombre: usuario.nombre,
                email: usuario.email
            },
            usuario: {
                _id: id,
                nombre: usuario.nombre,
                email: usuario.email
            }
        });
    } catch (error) {
        return responderError(res, error);
    }
};

module.exports = {
    registro,
    login
};
