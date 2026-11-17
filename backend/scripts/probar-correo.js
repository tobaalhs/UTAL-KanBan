// Envia un correo de invitacion de prueba para comprobar la configuracion de Resend.
// Uso: npm run correo:probar -- correo@ejemplo.cl
require('dotenv').config();
const correoService = require('../services/correo.service');

const destinatario = process.argv[2];

if (!destinatario) {
    console.error('Uso: npm run correo:probar -- correo@ejemplo.cl');
    process.exit(1);
}

correoService
    .enviarInvitacion({
        email: destinatario,
        nombreInvitado: 'Prueba',
        nombreInvitador: 'Utal KanBan',
        nombreTablero: 'Tablero de prueba',
        tableroId: '000000000000000000000000'
    })
    .then((resultado) => {
        if (resultado.enviado) {
            console.log(`Correo enviado (id: ${resultado.id})`);
            process.exit(0);
        }
        console.error(`No se envio el correo: ${resultado.motivo}`);
        process.exit(1);
    });
