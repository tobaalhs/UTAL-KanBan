// Base de datos falsa para avanzar el frontend mientras el backend de tableros/tareas no exista.
// Se guarda en localStorage para que los cambios sobrevivan a una recarga de pagina.
// Cuando existan los endpoints reales, este archivo deja de usarse.

const CLAVE = 'utal-kanban-mock'
const LATENCIA_MS = 250

export const usuariosMock = [
  { _id: 'u-ana', nombre: 'Ana', email: 'ana@utal.cl' },
  { _id: 'u-martin', nombre: 'Martín', email: 'martin@utal.cl' },
  { _id: 'u-javiera', nombre: 'Javiera', email: 'javiera@utal.cl' },
  { _id: 'u-sofia', nombre: 'Sofía', email: 'sofia@utal.cl' },
  { _id: 'u-lucas', nombre: 'Lucas', email: 'lucas@utal.cl' },
]

const haceDias = (n) => new Date(Date.now() - n * 86400000).toISOString()

let contador = Date.now()
export const nuevoId = (prefijo) => `${prefijo}-${(contador++).toString(36)}`

const semilla = (yo) => {
  const [ana, martin, javiera, sofia, lucas] = usuariosMock
  const tableros = [
    {
      _id: 't-software',
      nombre: 'Proyecto Software',
      descripcion: 'Desarrollo de aplicación web full-stack con Vue y Node.js',
      creador: yo._id,
      miembros: [yo, ana, martin, javiera],
      createdAt: haceDias(10),
      updatedAt: haceDias(0),
    },
    {
      _id: 't-marketing',
      nombre: 'Marketing Digital',
      descripcion: 'Campaña de lanzamiento y estrategia SEO',
      creador: yo._id,
      miembros: [yo, sofia, lucas],
      createdAt: haceDias(8),
      updatedAt: haceDias(1),
    },
    {
      _id: 't-cloud',
      nombre: 'Infraestructura Cloud',
      descripcion: 'Migración a la nube y optimización de servidores',
      creador: yo._id,
      miembros: [yo, javiera],
      createdAt: haceDias(6),
      updatedAt: haceDias(3),
    },
  ]

  const t = (tablero, titulo, descripcion, estado, prioridad, dias) => ({
    _id: nuevoId('tarea'),
    tablero,
    titulo,
    descripcion,
    estado,
    prioridad,
    createdAt: haceDias(dias),
    updatedAt: haceDias(dias),
  })

  const tareas = [
    t('t-software', 'Implementar sistema de login', 'Autenticación mediante correo y contraseña con JWT.', 'Pendiente', 'Alta', 4),
    t('t-software', 'Diseño de base de datos', 'Modelar las colecciones de usuarios, tableros y tareas.', 'Pendiente', 'Media', 3),
    t('t-software', 'Componente Kanban Board', 'Tablero interactivo con drag and drop.', 'En curso', 'Alta', 2),
    t('t-software', 'API REST de tareas', 'Endpoints CRUD para la gestión de tareas.', 'En curso', 'Media', 2),
    t('t-software', 'Diseño de wireframes', 'Mockups de las pantallas principales en Figma.', 'Terminado', 'Baja', 7),
    t('t-software', 'Setup del proyecto', 'Inicializar repositorio, dependencias y estructura.', 'Terminado', 'Baja', 9),
    t('t-software', 'Configurar Docker', 'Base de datos local con docker compose.', 'Terminado', 'Media', 6),
    t('t-marketing', 'Definir público objetivo', 'Segmentación y buyer persona.', 'Terminado', 'Alta', 5),
    t('t-marketing', 'Calendario de publicaciones', 'Planificar posts del mes.', 'En curso', 'Media', 2),
    t('t-marketing', 'Auditoría SEO', 'Revisar palabras clave del sitio.', 'Pendiente', 'Baja', 1),
    t('t-cloud', 'Inventario de servidores', 'Listar servicios actuales y su consumo.', 'En curso', 'Media', 3),
    t('t-cloud', 'Estimar costos', 'Comparar proveedores cloud.', 'Pendiente', 'Alta', 2),
  ]

  return { tableros, tareas }
}

// Cada usuario logueado tiene su propia "base de datos" de prueba
let cache = null
let duenoCache = null

export const leerDb = (yo) => {
  if (cache && duenoCache === yo._id) return cache
  const todas = JSON.parse(localStorage.getItem(CLAVE) || '{}')
  cache = todas[yo._id] || semilla(yo)
  duenoCache = yo._id
  guardarDb()
  return cache
}

export const guardarDb = () => {
  const todas = JSON.parse(localStorage.getItem(CLAVE) || '{}')
  todas[duenoCache] = cache
  localStorage.setItem(CLAVE, JSON.stringify(todas))
}

// Simula una peticion HTTP: espera un poco y devuelve una copia (como si viniera serializada del servidor)
export const responder = (valor) =>
  new Promise((resolve) => setTimeout(() => resolve(JSON.parse(JSON.stringify(valor))), LATENCIA_MS))

// Simula un error HTTP con el mismo formato que usa el backend ({ mensaje })
export const fallar = (status, mensaje) =>
  new Promise((_, reject) =>
    setTimeout(() => reject({ response: { status, data: { mensaje } } }), LATENCIA_MS),
  )
