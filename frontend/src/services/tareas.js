// Servicio de tareas.
// TODO backend: reemplazar cada funcion por la llamada real con `http`, por ejemplo:
//   listar:     http.get(`/tableros/${tableroId}/tareas`)
//   crear:      http.post(`/tableros/${tableroId}/tareas`, datos)
//   actualizar: http.patch(`/tareas/${id}`, datos)
//   eliminar:   http.delete(`/tareas/${id}`)
import { useAuthStore } from '../stores/auth'
import { fallar, guardarDb, leerDb, nuevoId, responder } from './mock/db'

const db = () => leerDb(useAuthStore().usuario)

export const ESTADOS = ['Pendiente', 'En curso', 'Terminado']
export const PRIORIDADES = ['Alta', 'Media', 'Baja']

export const listar = (tableroId) => responder(db().tareas.filter((t) => t.tablero === tableroId))

export const crear = (tableroId, { titulo, descripcion, prioridad }) => {
  const ahora = new Date().toISOString()
  const tarea = {
    _id: nuevoId('tarea'),
    tablero: tableroId,
    titulo,
    descripcion,
    prioridad,
    estado: 'Pendiente', // RF14: toda tarea nueva parte en Pendiente
    createdAt: ahora,
    updatedAt: ahora,
  }
  db().tareas.push(tarea)
  guardarDb()
  return responder(tarea)
}

export const actualizar = (id, datos) => {
  const tarea = db().tareas.find((t) => t._id === id)
  if (!tarea) return fallar(404, 'Tarea no encontrada')
  if (datos.estado && !ESTADOS.includes(datos.estado)) return fallar(400, 'Estado inválido')
  // Para demostrar RF19: en la consola ejecutar localStorage.setItem('simular-error', '1')
  if (datos.estado && localStorage.getItem('simular-error')) return fallar(500, 'Error simulado')
  Object.assign(tarea, datos, { updatedAt: new Date().toISOString() })
  guardarDb()
  return responder(tarea)
}

export const eliminar = (id) => {
  const tarea = db().tareas.find((t) => t._id === id)
  if (!tarea) return fallar(404, 'Tarea no encontrada')
  const tablero = db().tableros.find((t) => t._id === tarea.tablero)
  if (tablero?.creador !== useAuthStore().usuario._id) {
    return fallar(403, 'Solo el creador del tablero puede eliminar tareas')
  }
  db().tareas = db().tareas.filter((t) => t._id !== id)
  guardarDb()
  return responder({ mensaje: 'Tarea eliminada' })
}
