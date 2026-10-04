import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import http from '../api/http'

const CLAVE = 'utal-kanban-sesion'

// "Recordar sesion" guarda en localStorage; si no, solo dura mientras la pestaña esté abierta
const leerSesion = () => {
  const guardada = localStorage.getItem(CLAVE) || sessionStorage.getItem(CLAVE)
  return guardada ? JSON.parse(guardada) : { token: null, usuario: null }
}

export const useAuthStore = defineStore('auth', () => {
  const sesion = leerSesion()
  const token = ref(sesion.token)
  const usuario = ref(sesion.usuario)

  const autenticado = computed(() => !!token.value)

  const login = async (email, password, recordar = false) => {
    const { data } = await http.post('/usuarios/login', { email, password })
    token.value = data.token
    usuario.value = data.usuario
    const almacen = recordar ? localStorage : sessionStorage
    almacen.setItem(CLAVE, JSON.stringify({ token: data.token, usuario: data.usuario }))
  }

  const registro = async (nombre, email, password) => {
    const { data } = await http.post('/usuarios/registro', { nombre, email, password })
    return data
  }

  const logout = () => {
    token.value = null
    usuario.value = null
    localStorage.removeItem(CLAVE)
    sessionStorage.removeItem(CLAVE)
  }

  return { token, usuario, autenticado, login, registro, logout }
})
