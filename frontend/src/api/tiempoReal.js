import { io } from 'socket.io-client'

// El servidor de Socket.IO vive en el mismo origen que la API REST.
// En desarrollo VITE_API_URL no existe y Vite redirige /socket.io al backend.
const origenBackend = () => {
  const api = import.meta.env.VITE_API_URL
  if (!api) return undefined
  try {
    return new URL(api, window.location.href).origin
  } catch {
    return undefined
  }
}

// Crea una conexion autenticada con el JWT de la sesion actual
export const crearConexion = (obtenerToken) =>
  io(origenBackend(), {
    auth: (cb) => cb({ token: obtenerToken() }),
    transports: ['websocket', 'polling'],
  })
