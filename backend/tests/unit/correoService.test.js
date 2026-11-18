const mockSend = jest.fn();

// Mock del paquete 'resend' para no hacer llamadas reales a internet ni consumir cuota
jest.mock('resend', () => {
    return {
        Resend: jest.fn().mockImplementation(() => ({
            emails: {
                send: (...args) => mockSend(...args)
            }
        }))
    };
});

const correoService = require('../../services/correo.service');

describe('Servicio: correo.service (Notificaciones por Email con Resend)', () => {
    const envOriginal = process.env;

    beforeEach(() => {
        jest.clearAllMocks();
        mockSend.mockReset();
        process.env = { ...envOriginal };
    });

    afterAll(() => {
        process.env = envOriginal;
    });

    describe('plantillaInvitacion', () => {
        it('debe generar el asunto, texto plano y html correctamente', () => {
            const datos = {
                nombreInvitado: 'Carlos',
                nombreInvitador: 'Ana',
                nombreTablero: 'Proyecto Tesis',
                urlTablero: 'http://localhost:5173/tableros/123'
            };

            const resultado = correoService.plantillaInvitacion(datos);

            expect(resultado.asunto).toBe('Ana te agregó al tablero "Proyecto Tesis"');
            expect(resultado.texto).toContain('Hola Carlos,');
            expect(resultado.texto).toContain('Ana te agregó al tablero "Proyecto Tesis"');
            expect(resultado.texto).toContain('http://localhost:5173/tableros/123');
            expect(resultado.html).toContain('Ana');
            expect(resultado.html).toContain('Proyecto Tesis');
            expect(resultado.html).toContain('href="http://localhost:5173/tableros/123"');
        });

        it('debe escapar caracteres HTML para prevenir inyecciones XSS en el correo', () => {
            const datosMaliciosos = {
                nombreInvitado: '<script>alert("xss")</script>',
                nombreInvitador: 'Juan & Co',
                nombreTablero: 'Tablero "Seguro" <test>',
                urlTablero: 'http://localhost:5173/tableros/123?a=1&b=2'
            };

            const resultado = correoService.plantillaInvitacion(datosMaliciosos);

            expect(resultado.html).not.toContain('<script>');
            expect(resultado.html).toContain('&lt;script&gt;');
            expect(resultado.html).toContain('Juan &amp; Co');
            expect(resultado.html).toContain('Tablero &quot;Seguro&quot; &lt;test&gt;');
            expect(resultado.html).toContain('a=1&amp;b=2');
        });
    });

    describe('enviarCorreo', () => {
        it('debe retornar { enviado: false, motivo: "sin-configurar" } si EMAIL_API_KEY no existe y no lanzar error', async () => {
            delete process.env.EMAIL_API_KEY;

            const resultado = await correoService.enviarCorreo({
                para: 'test@utalca.cl',
                asunto: 'Prueba',
                html: '<p>Hola</p>',
                texto: 'Hola'
            });

            expect(resultado).toEqual({ enviado: false, motivo: 'sin-configurar' });
            expect(mockSend).not.toHaveBeenCalled();
        });

        it('debe invocar a Resend con los parámetros adecuados cuando hay API KEY', async () => {
            process.env.EMAIL_API_KEY = 're_test_success';
            process.env.EMAIL_FROM = 'Kanban <test@dominio.cl>';

            mockSend.mockResolvedValue({
                data: { id: 'msg_abc123' },
                error: null
            });

            const resultado = await correoService.enviarCorreo({
                para: 'usuario@utalca.cl',
                asunto: 'Invitación a tablero',
                html: '<p>Bienvenido</p>',
                texto: 'Bienvenido'
            });

            expect(mockSend).toHaveBeenCalledWith({
                from: 'Kanban <test@dominio.cl>',
                to: 'usuario@utalca.cl',
                subject: 'Invitación a tablero',
                html: '<p>Bienvenido</p>',
                text: 'Bienvenido'
            });
            expect(resultado).toEqual({ enviado: true, id: 'msg_abc123' });
        });

        it('debe capturar errores de rechazo de Resend sin interrumpir la ejecución (resiliencia)', async () => {
            process.env.EMAIL_API_KEY = 're_test_rejection';

            mockSend.mockResolvedValue({
                data: null,
                error: { message: 'El plan gratuito solo puede enviar correos a cuentas verificadas' }
            });

            const resultado = await correoService.enviarCorreo({
                para: 'otro@correo.com',
                asunto: 'Invitación',
                html: '<p>Hola</p>',
                texto: 'Hola'
            });

            expect(resultado.enviado).toBe(false);
            expect(resultado.motivo).toBe('rechazado');
            expect(resultado.error).toContain('plan gratuito');
        });

        it('debe capturar excepciones no controladas de red y retornar motivo "error" sin crashear', async () => {
            process.env.EMAIL_API_KEY = 're_test_network_error';

            mockSend.mockRejectedValue(new Error('Fallo de conexión timeout'));

            const resultado = await correoService.enviarCorreo({
                para: 'otro@correo.com',
                asunto: 'Invitación',
                html: '<p>Hola</p>',
                texto: 'Hola'
            });

            expect(resultado.enviado).toBe(false);
            expect(resultado.motivo).toBe('error');
            expect(resultado.error).toBe('Fallo de conexión timeout');
        });
    });

    describe('enviarInvitacion', () => {
        it('debe generar la URL del tablero y llamar a enviarCorreo sin bloquear el flujo', async () => {
            delete process.env.EMAIL_API_KEY;

            const resultado = await correoService.enviarInvitacion({
                email: 'invitado@utalca.cl',
                nombreInvitado: 'Carlos',
                nombreInvitador: 'Ana',
                nombreTablero: 'Sprint 1',
                tableroId: '65f1a2b3c4d5e6f7a8b9c0d1'
            });

            expect(resultado).toEqual({ enviado: false, motivo: 'sin-configurar' });
        });
    });
});
