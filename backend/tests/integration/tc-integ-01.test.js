const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../index');
const Usuario = require('../../models/usuario.models');
const Tablero = require('../../models/tablero.models');
const Tarea = require('../../models/tarea.models');
const { conectarTestDb, desconectarTestDb } = require('../helpers/testDb');
const { poblarDatosPrueba, DATOS_SEMILLA } = require('../fixtures/seedData');

describe('TC-INTEG-01: Integridad de datos y autorización de acceso a tableros y tareas', () => {
  const JWT_SECRET = process.env.JWT_SECRET || 'clave_secreta_jwt';
  let datos;
  let tokenA;
  let tokenB;

  beforeAll(async () => {
    await conectarTestDb();
  });

  afterAll(async () => {
    await desconectarTestDb();
  });

  beforeEach(async () => {
    datos = await poblarDatosPrueba();

    // Obtener JWT de Usuario A mediante login
    const loginA = await request(app)
      .post('/api/usuarios/login')
      .send({
        email: DATOS_SEMILLA.usuarioA.email,
        password: DATOS_SEMILLA.usuarioA.password
      });
    tokenA = loginA.body.token;

    // Obtener JWT de Usuario B mediante login
    const loginB = await request(app)
      .post('/api/usuarios/login')
      .send({
        email: DATOS_SEMILLA.usuarioB.email,
        password: DATOS_SEMILLA.usuarioB.password
      });
    tokenB = loginB.body.token;
  });

  // Bloque 1: Autenticación y sesión (HU-03)
  describe('Bloque 1: Autenticación y sesión (HU-03)', () => {
    it('1. Debe rechazar con HTTP 401 una petición sin el header Authorization', async () => {
      const res = await request(app).get('/api/v1/boards');

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('mensaje');
      expect(res.body.mensaje).toBe('Token de autenticación requerido');
    });

    it('2. Debe rechazar con HTTP 401 una petición con un token con la firma alterada', async () => {
      // Modificamos el último carácter de la firma
      const ultimoChar = tokenA.slice(-1);
      const charAlterado = ultimoChar === 'a' ? 'b' : 'a';
      const tokenAlterado = tokenA.slice(0, -1) + charAlterado;

      const res = await request(app)
        .get('/api/v1/boards')
        .set('Authorization', `Bearer ${tokenAlterado}`);

      expect(res.status).toBe(401);
      expect(res.body.mensaje).toBe('Token de autenticación inválido o expirado');
    });

    it('3. Debe rechazar con HTTP 401 una petición con un token expirado', async () => {
      const tokenExpirado = jwt.sign(
        { id: datos.usuarioA._id.toString(), email: datos.usuarioA.email },
        JWT_SECRET,
        { expiresIn: '-2s' }
      );

      const res = await request(app)
        .get('/api/v1/boards')
        .set('Authorization', `Bearer ${tokenExpirado}`);

      expect(res.status).toBe(401);
      expect(res.body.mensaje).toBe('Token de autenticación inválido o expirado');
    });
  });


  // Bloque 2: Aislamiento entre usuarios (HU-17, RNF09)
  describe('Bloque 2: Aislamiento entre usuarios (HU-17 / RNF09)', () => {
    it('4. Usuario B recibe HTTP 403 al intentar ver el tablero del Usuario A usando su ID', async () => {
      const res = await request(app)
        .get(`/api/v1/boards/${datos.tableroA._id}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(403);
      expect(res.body).toHaveProperty('mensaje');
      expect(res.body.mensaje).toBe('No tienes permiso para acceder a este tablero');
    });

    it('5. Usuario B recibe HTTP 403 al intentar cambiar el estado de la tarea del Usuario A y no se modifica en BD', async () => {
      const res = await request(app)
        .patch(`/api/v1/tasks/${datos.tareaA._id}/status`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ estado: 'En curso' });

      expect(res.status).toBe(403);
      expect(res.body).toHaveProperty('mensaje');

      // Verificar que en la base de datos la tarea permanece en Pendiente
      const tareaEnDb = await Tarea.findById(datos.tareaA._id);
      expect(tareaEnDb.estado).toBe('Pendiente');
    });

    it('6. Usuario B recibe HTTP 403 al intentar eliminar el tablero del Usuario A y este permanece en BD', async () => {
      const res = await request(app)
        .delete(`/api/v1/boards/${datos.tableroA._id}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(403);

      // Verificar que el tablero sigue existiendo en MongoDB
      const tableroEnDb = await Tablero.findById(datos.tableroA._id);
      expect(tableroEnDb).not.toBeNull();
    });

    it('7. El listado de tableros del Usuario B no incluye ningún tablero del Usuario A', async () => {
      const res = await request(app)
        .get('/api/v1/boards')
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);

      const incluyeTableroAjeno = res.body.some(
        (t) => t._id === datos.tableroA._id.toString() || t.id === datos.tableroA._id.toString()
      );
      expect(incluyeTableroAjeno).toBe(false);
    });

    it('8. Consultar un tablero inexistente con ID válido responde HTTP 404', async () => {
      const idInexistente = '000000000000000000000000';
      const res = await request(app)
        .get(`/api/v1/boards/${idInexistente}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(404);
      expect(res.body.mensaje).toBe('Tablero no encontrado');
    });
  });


  // Bloque 3: Restricciones del esquema (HU-11, HU-14, RF06, RNF03, RNF04)
  describe('Bloque 3: Restricciones del esquema (HU-11, HU-14)', () => {
    it('9. Enviar un estado inválido ("Bloqueado") responde HTTP 400 y la tarea conserva su valor', async () => {
      const res = await request(app)
        .patch(`/api/v1/tasks/${datos.tareaA._id}/status`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ estado: 'Bloqueado' });

      expect(res.status).toBe(400);

      const tareaEnDb = await Tarea.findById(datos.tareaA._id);
      expect(tareaEnDb.estado).toBe('Pendiente');
    });

    it('10. Enviar una prioridad inválida ("Urgente") responde HTTP 400 y conserva su prioridad original', async () => {
      const res = await request(app)
        .put(`/api/v1/tasks/${datos.tareaA._id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          titulo: datos.tareaA.titulo,
          prioridad: 'Urgente'
        });

      expect(res.status).toBe(400);

      const tareaEnDb = await Tarea.findById(datos.tareaA._id);
      expect(tareaEnDb.prioridad).toBe('Media');
    });

    it('11. Una tarea nueva enviada con estado "Terminado" se guarda igualmente en estado "Pendiente"', async () => {
      const res = await request(app)
        .post(`/api/v1/boards/${datos.tableroA._id}/tasks`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          titulo: 'Tarea Nueva Forzada',
          estado: 'Terminado',
          prioridad: 'Alta'
        });

      expect(res.status).toBe(201);
      expect(res.body.estado).toBe('Pendiente');

      // Verificar directamente en MongoDB
      const tareaCreada = await Tarea.findById(res.body._id || res.body.id);
      expect(tareaCreada).not.toBeNull();
      expect(tareaCreada.estado).toBe('Pendiente');
    });

    it('12. Crear una tarea con el título vacío responde HTTP 400 y no crea ningún documento', async () => {
      const totalTareasAntes = await Tarea.countDocuments();

      const res = await request(app)
        .post(`/api/v1/boards/${datos.tableroA._id}/tasks`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          titulo: ''
        });

      expect(res.status).toBe(400);

      const totalTareasDespues = await Tarea.countDocuments();
      expect(totalTareasDespues).toBe(totalTareasAntes);
    });

    it('13. Enviar un ID con formato inválido ("abc") responde HTTP 400 sin caerse el servidor', async () => {
      const res = await request(app)
        .get('/api/v1/boards/abc')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('mensaje');
    });

    it('14. Crear una tarea asignada a un miembro válido persiste asignadoId en BD y lo retorna poblado', async () => {
      // Usuario A es miembro/creador de Tablero A
      const res = await request(app)
        .post(`/api/v1/boards/${datos.tableroA._id}/tasks`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          titulo: 'Tarea Asignada a Miembro',
          asignadoId: datos.usuarioA._id.toString()
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('asignado');
      expect(res.body.asignado.id).toBe(datos.usuarioA._id.toString());
      expect(res.body.asignado.email).toBe(DATOS_SEMILLA.usuarioA.email.toLowerCase());

      const enDb = await Tarea.findById(res.body._id || res.body.id);
      expect(enDb.asignadoId.toString()).toBe(datos.usuarioA._id.toString());
    });

    it('15. Asignar una tarea a un usuario que NO es miembro del tablero responde HTTP 400', async () => {
      // Usuario B no es miembro del tablero A
      const res = await request(app)
        .post(`/api/v1/boards/${datos.tableroA._id}/tasks`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          titulo: 'Tarea Asignación Inválida',
          asignadoId: datos.usuarioB._id.toString()
        });

      expect(res.status).toBe(400);
      expect(res.body.mensaje).toBe('El usuario asignado no es miembro del tablero');
    });

    it('16. Enviar asignadoId con formato inválido ("123xyz") responde HTTP 400', async () => {
      const res = await request(app)
        .post(`/api/v1/boards/${datos.tableroA._id}/tasks`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          titulo: 'Tarea con ID Inválido',
          asignadoId: '123xyz'
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('mensaje');
    });
  });

  // Bloque 4: Datos sensibles (RNF01) y Formato de Errores
  describe('Bloque 4: Datos sensibles (RNF01) y formato estandarizado', () => {
    it('17. La contraseña del usuario en MongoDB contiene un hash bcrypt ($2b$) y nunca texto plano', async () => {
      const usuarioEnDb = await Usuario.findById(datos.usuarioA._id);

      expect(usuarioEnDb).not.toBeNull();
      expect(usuarioEnDb.password).not.toBe(DATOS_SEMILLA.usuarioA.password);
      expect(usuarioEnDb.password).toMatch(/^\$2[aby]\$\d{2}\$/);
    });

    it('18. Todas las respuestas de error utilizan el formato { "mensaje": "..." }', async () => {
      const res = await request(app)
        .get('/api/v1/boards/000000000000000000000000')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('mensaje');
      expect(typeof res.body.mensaje).toBe('string');
      expect(res.body.mensaje.length).toBeGreaterThan(0);
    });
  });

  // Bloque 5: Etiquetas, subtareas, filtros e inmutabilidad de tareas finalizadas
  describe('Bloque 5: Etiquetas, subtareas, filtros y bloqueo de tareas finalizadas', () => {
    it('19. Debe crear una tarea con etiquetas normalizadas (sin duplicados ni espacios) y listarlas en GET /api/v1/tags', async () => {
      const resCrear = await request(app)
        .post(`/api/v1/boards/${datos.tableroA._id}/tasks`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          titulo: 'Tarea con Etiquetas',
          prioridad: 'Alta',
          etiquetas: ['  Backend ', 'backend', 'Urgente', 'Diseño']
        });

      expect(resCrear.status).toBe(201);
      expect(resCrear.body.etiquetas).toEqual(['Backend', 'Urgente', 'Diseño']);

      const resTags = await request(app)
        .get('/api/v1/tags')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(resTags.status).toBe(200);
      expect(resTags.body).toEqual(['Backend', 'Diseño', 'Urgente']);
    });

    it('20. Debe rechazar con HTTP 400 etiquetas con formato inválido (vacías o no arreglo)', async () => {
      const resNoArray = await request(app)
        .post(`/api/v1/boards/${datos.tableroA._id}/tasks`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          titulo: 'Tarea Etiqueta Inválida',
          etiquetas: 'no-es-lista'
        });

      expect(resNoArray.status).toBe(400);

      const resVacia = await request(app)
        .post(`/api/v1/boards/${datos.tableroA._id}/tasks`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          titulo: 'Tarea Etiqueta Vacía',
          etiquetas: ['   ']
        });

      expect(resVacia.status).toBe(400);
    });

    it('21. Debe crear y actualizar subtareas con responsable miembro del tablero y poblar sus datos', async () => {
      const resCrear = await request(app)
        .post(`/api/v1/boards/${datos.tableroA._id}/tasks`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          titulo: 'Tarea con Subtareas',
          subtareas: [
            {
              titulo: 'Configurar base de datos',
              completada: false,
              asignadoId: datos.usuarioA._id.toString()
            },
            {
              titulo: 'Crear componentes de filtro',
              completada: true,
              asignadoId: null
            }
          ]
        });

      expect(resCrear.status).toBe(201);
      expect(resCrear.body.subtareas).toHaveLength(2);
      expect(resCrear.body.subtareas[0].titulo).toBe('Configurar base de datos');
      expect(resCrear.body.subtareas[0].completada).toBe(false);
      expect(resCrear.body.subtareas[0].asignado).toMatchObject({
        id: datos.usuarioA._id.toString(),
        nombre: DATOS_SEMILLA.usuarioA.nombre,
        email: DATOS_SEMILLA.usuarioA.email.toLowerCase()
      });
      expect(resCrear.body.subtareas[1].completada).toBe(true);
      expect(resCrear.body.subtareas[1].asignado).toBeNull();
    });

    it('22. Debe rechazar con HTTP 400 una subtarea sin título o asignada a un usuario que no es miembro del tablero', async () => {
      const resNoMiembro = await request(app)
        .post(`/api/v1/boards/${datos.tableroA._id}/tasks`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          titulo: 'Tarea Subtarea Intruso',
          subtareas: [
            {
              titulo: 'Subtarea asignada a Usuario B',
              asignadoId: datos.usuarioB._id.toString()
            }
          ]
        });

      expect(resNoMiembro.status).toBe(400);
      expect(resNoMiembro.body.mensaje).toBe('El usuario asignado no es miembro del tablero');

      const resSinTitulo = await request(app)
        .post(`/api/v1/boards/${datos.tableroA._id}/tasks`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          titulo: 'Tarea Subtarea Sin Título',
          subtareas: [{ titulo: '   ' }]
        });

      expect(resSinTitulo.status).toBe(400);
    });

    it('23. Al obtener el tablero se entregan los campos requeridos para los 3 filtros (asignado en tarea/subtarea, prioridad y etiquetas)', async () => {
      // Invitar a Usuario B al tablero A para probar asignaciones cruzadas
      await request(app)
        .post(`/api/v1/boards/${datos.tableroA._id}/members`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ email: DATOS_SEMILLA.usuarioB.email });

      await request(app)
        .post(`/api/v1/boards/${datos.tableroA._id}/tasks`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          titulo: 'Tarea Filtrable',
          prioridad: 'Alta',
          asignadoId: datos.usuarioA._id.toString(),
          etiquetas: ['FiltroTag', 'Backend'],
          subtareas: [
            {
              titulo: 'Subtarea de Usuario B',
              completada: false,
              asignadoId: datos.usuarioB._id.toString()
            }
          ]
        });

      const resTablero = await request(app)
        .get(`/api/v1/boards/${datos.tableroA._id}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(resTablero.status).toBe(200);
      const tareaFiltrable = resTablero.body.tareas.find((t) => t.titulo === 'Tarea Filtrable');
      expect(tareaFiltrable).toBeDefined();
      expect(tareaFiltrable.prioridad).toBe('Alta');
      expect(tareaFiltrable.etiquetas).toEqual(['FiltroTag', 'Backend']);
      expect(tareaFiltrable.asignado.id).toBe(datos.usuarioA._id.toString());
      expect(tareaFiltrable.subtareas[0].asignado.id).toBe(datos.usuarioB._id.toString());

      // Al eliminar a Usuario B del tablero, se limpia su asignación tanto en tareas como en subtareas
      const resEliminarMiembro = await request(app)
        .delete(`/api/v1/boards/${datos.tableroA._id}/members/${datos.usuarioB._id}`)
        .set('Authorization', `Bearer ${tokenA}`);
      expect(resEliminarMiembro.status).toBe(200);

      const resTableroDespues = await request(app)
        .get(`/api/v1/boards/${datos.tableroA._id}`)
        .set('Authorization', `Bearer ${tokenA}`);
      const tareaDespues = resTableroDespues.body.tareas.find((t) => t.titulo === 'Tarea Filtrable');
      expect(tareaDespues.subtareas[0].asignado).toBeNull();
    });

    it('24. Una tarea finalizada (estado "Terminado") no se puede modificar (responde HTTP 409 y conserva sus datos en BD)', async () => {
      // 1. Marcar la tarea como Terminado
      const resEstado = await request(app)
        .patch(`/api/v1/tasks/${datos.tareaA._id}/status`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ estado: 'Terminado' });

      expect(resEstado.status).toBe(200);
      expect(resEstado.body.estado).toBe('Terminado');

      // 2. Intentar modificar título, prioridad, etiquetas o subtareas mediante PUT
      const resEditar = await request(app)
        .put(`/api/v1/tasks/${datos.tareaA._id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          titulo: 'Título Modificado Ilegalmente',
          descripcion: 'Nueva descripción',
          prioridad: 'Alta',
          etiquetas: ['Hack'],
          subtareas: [{ titulo: 'Subtarea nueva' }]
        });

      expect(resEditar.status).toBe(409);
      expect(resEditar.body.mensaje).toBe('Una tarea finalizada no se puede modificar');

      // 3. Verificar en MongoDB que ningún campo fue modificado
      const tareaEnDb = await Tarea.findById(datos.tareaA._id);
      expect(tareaEnDb.titulo).toBe(DATOS_SEMILLA.tareaA.titulo);
      expect(tareaEnDb.prioridad).toBe(DATOS_SEMILLA.tareaA.prioridad);
      expect(tareaEnDb.etiquetas).toEqual([]);
      expect(tareaEnDb.subtareas).toHaveLength(0);
    });
  });
});
