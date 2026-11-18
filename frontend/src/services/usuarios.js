import http from '../api/http'

export const buscar = async (q) => {
  const { data } = await http.get('/v1/users', { params: { q } })
  return data
}
