const crearErrorHttp = (status, mensaje) => {
    const error = new Error(mensaje);
    error.status = status;
    return error;
};

const responderError = (res, error) => {
    if (!error.status) {
        console.error(error);
    }

    return res.status(error.status || 500).json({
        mensaje: error.status ? error.message : 'Error interno del servidor'
    });
};

module.exports = {
    crearErrorHttp,
    responderError
};
