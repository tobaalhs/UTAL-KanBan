// Origenes permitidos: localhost en desarrollo y despliegues de Vercel.
// Se comparte entre Express y Socket.IO.
const origenPermitido = (origin, callback) => {
    if (!origin) {
        return callback(null, true);
    }

    let url;
    try {
        url = new URL(origin);
    } catch (error) {
        return callback(null, false);
    }

    const esLocalhost =
        url.hostname === 'localhost' || url.hostname === '127.0.0.1';
    const esVercel =
        url.protocol === 'https:' && url.hostname.endsWith('.vercel.app');
    return callback(null, esLocalhost || esVercel);
};

module.exports = { origin: origenPermitido };
