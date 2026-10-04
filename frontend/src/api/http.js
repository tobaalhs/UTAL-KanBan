import axios from 'axios'
import { useAuthStore } from '../stores/auth'
import router from '../router'

const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
})

// Adjunta el token JWT en cada peticion
http.interceptors.request.use((config) => {
  const auth = useAuthStore()
  if (auth.token) {
    config.headers.Authorization = `Bearer ${auth.token}`
  }
  return config
})

// Si el token expiro o es invalido, cerramos sesion y volvemos al login (RF21)
http.interceptors.response.use(
  (response) => response,
  (error) => {
    const auth = useAuthStore()
    if (error.response?.status === 401 && auth.token) {
      auth.logout()
      router.push({ name: 'login' })
    }
    return Promise.reject(error)
  },
)

// Extrae el mensaje de error que envia el backend ({ mensaje })
export const mensajeDeError = (error, porDefecto = 'Ocurrió un error, intenta nuevamente') =>
  error.response?.data?.mensaje || porDefecto

export default http
