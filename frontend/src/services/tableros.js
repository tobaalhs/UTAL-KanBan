// Servicio de tableros.
// TODO backend: reemplazar cada funcion por la llamada real con `http`, por ejemplo:
//   listar:   http.get('/tableros')
//   obtener:  http.get(`/tableros/${id}`)
//   crear:    http.post('/tableros', datos)
//   actualizar: http.patch(`/tableros/${id}`, datos)
//   eliminar: http.delete(`/tableros/${id}`)
//   invitar:  http.post(`/tableros/${id}/miembros`, { email })
import { useAuthStore } from '../stores/auth'
import { fallar, guardarDb, leerDb, nuevoId, responder, usuariosMock } from './mock/db'

const db = () => leerDb(useAuthStore().usuario)

const conConteo = (tablero) => {
  const tareas = db().tareas.filter((t) => t.tablero === tablero._id)
  return {
    ...tablero,
    cantidadTareas: tareas.length,
    cantidadTerminadas: tareas.filter((t) => t.estado === 'Terminado').length,
  }
}

const buscar = (id) => db().tableros.find((t) => t._id === id)

export const listar = () => responder(db().tableros.map(conConteo))

export const obtener = (id) => {
  const tablero = buscar(id)
  return tablero ? responder(conConteo(tablero)) : fallar(404, 'Tablero no encontrado')
}

export const crear = ({ nombre, descripcion }) => {
  const yo = useAuthStore().usuario
  const ahora = new Date().toISOString()
  const tablero = {
    _id: nuevoId('tablero'),
    nombre,
    descripcion,
    creador: yo._id,
    miembros: [yo],
    createdAt: ahora,
    updatedAt: ahora,
  }
  db().tableros.unshift(tablero)
  guardarDb()
  return responder(conConteo(tablero))
}

export const actualizar = (id, datos) => {
  const tablero = buscar(id)
  if (!tablero) return fallar(404, 'Tablero no encontrado')
  Object.assign(tablero, datos, { updatedAt: new Date().toISOString() })
  guardarDb()
  return responder(conConteo(tablero))
}

export const eliminar = (id) => {
  const tablero = buscar(id)
  if (!tablero) return fallar(404, 'Tablero no encontrado')
  if (tablero.creador !== useAuthStore().usuario._id) {
    return fallar(403, 'Solo el creador puede eliminar el tablero')
  }
  db().tableros = db().tableros.filter((t) => t._id !== id)
  db().tareas = db().tareas.filter((t) => t.tablero !== id)
  guardarDb()
  return responder({ mensaje: 'Tablero eliminado' })
}

export const invitar = (id, email) => {
  const tablero = buscar(id)
  if (!tablero) return fallar(404, 'Tablero no encontrado')
  const usuario = usuariosMock.find((u) => u.email === email.trim().toLowerCase())
  if (!usuario) return fallar(404, 'No existe un usuario registrado con ese correo')
  if (tablero.miembros.some((m) => m._id === usuario._id)) {
    return fallar(400, 'El usuario ya es miembro del tablero')
  }
  tablero.miembros.push(usuario)
  guardarDb()
  return responder(conConteo(tablero))
}
