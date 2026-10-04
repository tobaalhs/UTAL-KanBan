import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as api from '../services/tableros'

export const useTablerosStore = defineStore('tableros', () => {
  const lista = ref([])
  const actual = ref(null)
  const cargando = ref(false)

  const reemplazar = (tablero) => {
    const i = lista.value.findIndex((t) => t._id === tablero._id)
    if (i !== -1) lista.value[i] = tablero
    if (actual.value?._id === tablero._id) actual.value = tablero
  }

  const cargar = async () => {
    cargando.value = true
    try {
      lista.value = await api.listar()
    } finally {
      cargando.value = false
    }
  }

  const abrir = async (id) => {
    actual.value = null
    actual.value = await api.obtener(id)
  }

  const crear = async (datos) => {
    const tablero = await api.crear(datos)
    lista.value.unshift(tablero)
    return tablero
  }

  const actualizar = async (id, datos) => reemplazar(await api.actualizar(id, datos))

  const eliminar = async (id) => {
    await api.eliminar(id)
    lista.value = lista.value.filter((t) => t._id !== id)
    if (actual.value?._id === id) actual.value = null
  }

  const invitar = async (id, email) => reemplazar(await api.invitar(id, email))

  // Mantiene al dia el contador de tareas de la tarjeta del tablero
  const ajustarConteo = (id, delta) => {
    for (const t of [actual.value, lista.value.find((t) => t._id === id)]) {
      if (t?._id === id) t.cantidadTareas += delta
    }
  }

  return { lista, actual, cargando, cargar, abrir, crear, actualizar, eliminar, invitar, ajustarConteo }
})
