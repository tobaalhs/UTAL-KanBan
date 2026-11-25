import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as api from '../services/tareas'
import { useTablerosStore } from './tableros'

export const useTareasStore = defineStore('tareas', () => {
  const lista = ref([])
  const tableroId = ref(null)

  const buscar = (id) => lista.value.find((t) => t._id === id)

  const cargar = async (id) => {
    tableroId.value = id
    lista.value = []
    lista.value = await api.listar(id)
  }

  // Vuelve a pedir las tareas sin vaciar el tablero (por ejemplo, tras reconectar el socket)
  const refrescar = async () => {
    if (!tableroId.value) return
    lista.value = await api.listar(tableroId.value)
  }

  // Agrega la tarea si aun no esta. Puede llegar primero por la respuesta HTTP o por el socket.
  const agregarSiFalta = (tarea) => {
    const existente = buscar(tarea._id)
    if (existente) {
      Object.assign(existente, tarea)
      return
    }
    lista.value.push(tarea)
    useTablerosStore().ajustarConteo(tableroId.value, 1)
    if (tarea.estado === 'Terminado')
      useTablerosStore().ajustarTerminadas(tableroId.value, 1)
  }

  const quitarSiEsta = (id) => {
    const tarea = buscar(id)
    if (!tarea) return
    lista.value = lista.value.filter((t) => t._id !== id)
    useTablerosStore().ajustarConteo(tableroId.value, -1)
    if (tarea.estado === 'Terminado')
      useTablerosStore().ajustarTerminadas(tableroId.value, -1)
  }

  const cambiarEstadoLocal = (tarea, nuevoEstado) => {
    const anterior = tarea.estado
    if (anterior === nuevoEstado) return
    tarea.estado = nuevoEstado
    if (anterior === 'Terminado')
      useTablerosStore().ajustarTerminadas(tableroId.value, -1)
    if (nuevoEstado === 'Terminado')
      useTablerosStore().ajustarTerminadas(tableroId.value, 1)
  }

  const crear = async (datos) => {
    const tarea = await api.crear(tableroId.value, datos)
    agregarSiFalta(tarea)
  }

  const editar = async (id, datos) => {
    const tarea = await api.actualizar(id, datos)
    Object.assign(buscar(id), tarea)
  }

  const eliminar = async (id) => {
    await api.eliminar(id)
    quitarSiEsta(id)
  }

  // RF17-RF19: actualizacion optimista. La tarjeta cambia de columna al instante
  // y, si el backend falla, vuelve a su estado anterior y se lanza el error.
  const mover = async (id, nuevoEstado) => {
    const tarea = buscar(id)
    if (!tarea || tarea.estado === nuevoEstado) return
    const anterior = tarea.estado
    tarea.estado = nuevoEstado
    try {
      await api.actualizarEstado(id, nuevoEstado)
      if (anterior === 'Terminado') {
        useTablerosStore().ajustarTerminadas(tableroId.value, -1)
      }
      if (nuevoEstado === 'Terminado') {
        useTablerosStore().ajustarTerminadas(tableroId.value, 1)
      }
    } catch (error) {
      tarea.estado = anterior
      throw error
    }
  }

  // Orden dentro de una columna (solo visual, el backend no guarda orden)
  const reordenar = (estado, idsEnOrden) => {
    const otras = lista.value.filter((t) => !idsEnOrden.includes(t._id))
    const ordenadas = idsEnOrden.map(buscar).filter(Boolean)
    lista.value = [...otras, ...ordenadas]
  }

  // ---- Cambios hechos por otros miembros (llegan por Socket.IO) ----
  // Son idempotentes: si el cambio ya esta aplicado (porque lo hice yo) no pasa nada.
  const aplicarCreada = (tarea) => {
    if (tarea?.tableroId && tarea.tableroId !== tableroId.value) return
    agregarSiFalta(tarea)
  }

  const aplicarActualizada = (tarea) => {
    const existente = buscar(tarea?._id)
    if (!existente) return
    const { estado, ...resto } = tarea
    Object.assign(existente, resto)
    cambiarEstadoLocal(existente, estado)
  }

  const aplicarMovida = ({ _id, estado }) => {
    const tarea = buscar(_id)
    if (tarea) cambiarEstadoLocal(tarea, estado)
  }

  const aplicarEliminada = ({ _id }) => quitarSiEsta(_id)

  return {
    lista,
    tableroId,
    cargar,
    refrescar,
    crear,
    editar,
    eliminar,
    mover,
    reordenar,
    aplicarCreada,
    aplicarActualizada,
    aplicarMovida,
    aplicarEliminada,
  }
})
