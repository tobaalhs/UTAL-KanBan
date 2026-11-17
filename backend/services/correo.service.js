const { Resend } = require('resend');

const REMITENTE_POR_DEFECTO = 'Utal KanBan <onboarding@resend.dev>';
const URL_APP_POR_DEFECTO = 'http://localhost:5173';

let clienteCacheado = null;

// Devuelve el cliente de Resend o null si no hay API key configurada
const obtenerCliente = () => {
    const apiKey = process.env.EMAIL_API_KEY;

    if (!apiKey) {
        return null;
    }

    if (!clienteCacheado || clienteCacheado.apiKey !== apiKey) {
        clienteCacheado = { apiKey, instancia: new Resend(apiKey) };
    }

    return clienteCacheado.instancia;
};

const urlApp = () => (process.env.APP_URL || URL_APP_POR_DEFECTO).replace(/\/+$/, '');

// Los nombres vienen de los usuarios, asi que se escapan antes de ir dentro del HTML
const escaparHtml = (texto) =>
    String(texto)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

const limpiarLinea = (texto) => String(texto).replace(/[\r\n]+/g, ' ').trim();

const plantillaInvitacion = ({ nombreInvitado, nombreInvitador, nombreTablero, urlTablero }) => {
    const invitado = escaparHtml(nombreInvitado);
    const invitador = escaparHtml(nombreInvitador);
    const tablero = escaparHtml(nombreTablero);
    const enlace = escaparHtml(urlTablero);

    const asunto = limpiarLinea(`${nombreInvitador} te agregó al tablero "${nombreTablero}"`);

    const texto = [
        `Hola ${nombreInvitado},`,
        '',
        `${nombreInvitador} te agregó al tablero "${nombreTablero}" en Utal KanBan.`,
        '',
        `Ábrelo aquí: ${urlTablero}`,
        '',
        'Si no esperabas esta invitación, puedes ignorar este correo.'
    ].join('\n');

    // Estilos en linea: es lo unico que los clientes de correo respetan de forma consistente
    const html = `<!doctype html>
<html lang="es">
<body style="margin:0;padding:0;background:#0d0f18;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0d0f18;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#151722;border:1px solid #262a3f;border-radius:14px;font-family:Arial,Helvetica,sans-serif;color:#f1f5f9;">
          <tr>
            <td style="padding:28px 28px 8px;font-size:18px;font-weight:bold;">
              Utal <span style="color:#818cf8;">KanBan</span>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 0;font-size:15px;line-height:1.6;color:#f1f5f9;">
              <p style="margin:0 0 12px;">Hola ${invitado},</p>
              <p style="margin:0 0 20px;color:#94a3b8;">
                <strong style="color:#f1f5f9;">${invitador}</strong> te agregó al tablero
                <strong style="color:#f1f5f9;">${tablero}</strong>. Ya puedes ver sus tareas y colaborar con el equipo.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 24px;">
              <a href="${enlace}" style="display:inline-block;padding:12px 22px;background:#6366f1;color:#ffffff;text-decoration:none;border-radius:10px;font-size:15px;font-weight:bold;">
                Abrir tablero
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px 24px;border-top:1px solid #262a3f;font-size:12px;line-height:1.5;color:#64748b;">
              Si no esperabas esta invitación, puedes ignorar este correo.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    return { asunto, html, texto };
};

// Envia un correo. Nunca lanza: devuelve { enviado, ... } para que quien lo use
// decida si le importa el resultado (un aviso por correo no debe romper la operacion principal).
const enviarCorreo = async ({ para, asunto, html, texto }) => {
    const resend = obtenerCliente();

    if (!resend) {
        console.warn('[correo] EMAIL_API_KEY no esta configurada: no se envio el correo');
        return { enviado: false, motivo: 'sin-configurar' };
    }

    try {
        const { data, error } = await resend.emails.send({
            from: process.env.EMAIL_FROM || REMITENTE_POR_DEFECTO,
            to: para,
            subject: asunto,
            html,
            text: texto
        });

        if (error) {
            console.error(`[correo] Resend rechazo el envio: ${error.message}`);
            return { enviado: false, motivo: 'rechazado', error: error.message };
        }

        return { enviado: true, id: data.id };
    } catch (error) {
        console.error(`[correo] Error al enviar el correo: ${error.message}`);
        return { enviado: false, motivo: 'error', error: error.message };
    }
};

// HU-10: avisa por correo a un usuario que fue agregado a un tablero
const enviarInvitacion = ({ email, nombreInvitado, nombreInvitador, nombreTablero, tableroId }) => {
    const contenido = plantillaInvitacion({
        nombreInvitado: nombreInvitado || 'usuario',
        nombreInvitador: nombreInvitador || 'Un miembro del equipo',
        nombreTablero,
        urlTablero: `${urlApp()}/tableros/${tableroId}`
    });

    return enviarCorreo({ para: email, ...contenido });
};

module.exports = {
    enviarCorreo,
    enviarInvitacion,
    plantillaInvitacion
};
