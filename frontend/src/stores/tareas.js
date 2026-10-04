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

  const crear = async (datos) => {
    const tarea = await api.crear(tableroId.value, datos)
    lista.value.push(tarea)
    useTablerosStore().ajustarConteo(tableroId.value, 1)
  }

  const editar = async (id, datos) => {
    const tarea = await api.actualizar(id, datos)
    Object.assign(buscar(id), tarea)
  }

  const eliminar = async (id) => {
    await api.eliminar(id)
    lista.value = lista.value.filter((t) => t._id !== id)
    useTablerosStore().ajustarConteo(tableroId.value, -1)
  }

  // RF17-RF19: actualizacion optimista. La tarjeta cambia de columna al instante
  // y, si el backend falla, vuelve a su estado anterior y se lanza el error.
  const mover = async (id, nuevoEstado) => {
    const tarea = buscar(id)
    if (!tarea || tarea.estado === nuevoEstado) return
    const anterior = tarea.estado
    tarea.estado = nuevoEstado
    try {
      await api.actualizar(id, { estado: nuevoEstado })
    } catch (error) {
      tarea.estado = anterior
      throw error
    }
  }

  // Orden dentro de una columna (solo visual, el backend no guarda orden)
  const reordenar = (estado, idsEnOrden) => {
    const otras = lista.value.filter((t) => t.estado !== estado && !idsEnOrden.includes(t._id))
    const ordenadas = idsEnOrden.map(buscar).filter(Boolean)
    lista.value = [...otras, ...ordenadas]
  }

  return { lista, cargar, crear, editar, eliminar, mover, reordenar }
})
