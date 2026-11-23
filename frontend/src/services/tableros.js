import http from '../api/http'

export const listar = async () => {
  const { data } = await http.get('/v1/boards')
  return data
}

export const obtener = async (id) => {
  const { data } = await http.get(`/v1/boards/${id}`)
  return data
}

export const crear = async (datos) => {
  const { data } = await http.post('/v1/boards', datos)
  return data
}

export const actualizar = async (id, datos) => {
  const { data } = await http.put(`/v1/boards/${id}`, datos)
  return data
}

export const eliminar = async (id) => {
  const { data } = await http.delete(`/v1/boards/${id}`)
  return data
}

export const invitar = async (id, email) => {
  const { data } = await http.post(`/v1/boards/${id}/members`, { email })
  return data
}

export const eliminarMiembro = async (id, usuarioId) => {
  const { data } = await http.delete(`/v1/boards/${id}/members/${usuarioId}`)
  return data
}
