import http from '../api/http'

export const ESTADOS = ['Pendiente', 'En curso', 'Terminado']
export const PRIORIDADES = ['Alta', 'Media', 'Baja']

export const listar = async (tableroId) => {
  const { data } = await http.get(`/v1/boards/${tableroId}`)
  return data.tareas
}

export const crear = async (tableroId, datos) => {
  const { data } = await http.post(`/v1/boards/${tableroId}/tasks`, datos)
  return data
}

export const actualizar = async (id, datos) => {
  const { data } = await http.put(`/v1/tasks/${id}`, datos)
  return data
}

export const actualizarEstado = async (id, estado) => {
  const { data } = await http.patch(`/v1/tasks/${id}/status`, { estado })
  return data
}

export const eliminar = async (id) => {
  const { data } = await http.delete(`/v1/tasks/${id}`)
  return data
}
