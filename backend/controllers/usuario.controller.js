const usuarioService = require('../services/usuario.service');

const registro = async (req, res) => {
    try {
        const { nombre, email, password } = req.body;

        if (!nombre || !email || !password) {
            return res.status(400).json({ mensaje: 'Todos los campos son obligatorios' });
        }

        const usuarioCreado = await usuarioService.registrarUsuario(nombre, email, password);

        res.status(201).json({
            mensaje: 'Usuario registrado exitosamente',
            usuario: {
                _id: usuarioCreado._id,
                nombre: usuarioCreado.nombre,
                email: usuarioCreado.email
            }
        });
    } catch (error) {
        res.status(400).json({ mensaje: error.message });
    }
};

module.exports = {
    registro
};
