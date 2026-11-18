import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { mensajeDeError } from '../api/http'
import { ESTADOS, PRIORIDADES } from '../services/tareas'
import * as apiTableros from '../services/tableros'
import { useAuthStore } from './auth'

// Datos agregados de todos los tableros del usuario. Alimenta el Dashboard, Miembros y Ajustes.
// No hay un endpoint de resumen: se pide la lista de tableros y el detalle de cada uno
// (el detalle incluye sus tareas), y todo lo demas se calcula aqui.
export const useResumenStore = defineStore('resumen', () => {
  const tableros = ref([])
  const tareas = ref([])
  const cargando = ref(false)
  const cargado = ref(false)
  const error = ref('')

  const cargar = async () => {
    cargando.value = true
    error.value = ''
    try {
      const lista = await apiTableros.listar()
      const detalles = await Promise.all(lista.map((t) => apiTableros.obtener(t._id)))
      tableros.value = lista
      tareas.value = detalles.flatMap((d) => d.tareas.map((t) => ({ ...t, tableroNombre: d.nombre })))
      cargado.value = true
    } catch (e) {
      error.value = mensajeDeError(e, 'No se pudo cargar el resumen')
    } finally {
      cargando.value = false
    }
  }

  const contarPor = (campo, valores) =>
    Object.fromEntries(valores.map((v) => [v, tareas.value.filter((t) => t[campo] === v).length]))

  const porEstado = computed(() => contarPor('estado', ESTADOS))
  const porPrioridad = computed(() => contarPor('prioridad', PRIORIDADES))
  const total = computed(() => tareas.value.length)
  const terminadas = computed(() => porEstado.value.Terminado)
  const porcentaje = computed(() => (total.value ? Math.round((terminadas.value / total.value) * 100) : 0))

  const misTareas = computed(() => {
    const yo = useAuthStore().usuario?._id
    return tareas.value.filter((t) => t.asignado?._id === yo)
  })

  const tablerosCreados = computed(() => {
    const yo = useAuthStore().usuario?._id
    return tableros.value.filter((t) => t.creador === yo).length
  })

  // Personas con las que se comparte algun tablero, con sus tableros en comun y sus tareas
  const miembros = computed(() => {
    const personas = new Map()

    for (const tablero of tableros.value) {
      for (const m of tablero.miembros) {
        if (!personas.has(m._id)) {
          personas.set(m._id, { ...m, tableros: [], asignadas: 0, terminadas: 0 })
        }
        personas.get(m._id).tableros.push({ _id: tablero._id, nombre: tablero.nombre })
      }
    }

    for (const tarea of tareas.value) {
      const persona = tarea.asignado && personas.get(tarea.asignado._id)
      if (persona) {
        persona.asignadas++
        if (tarea.estado === 'Terminado') persona.terminadas++
      }
    }

    return [...personas.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
  })

  return {
    tableros,
    tareas,
    cargando,
    cargado,
    error,
    cargar,
    porEstado,
    porPrioridad,
    total,
    terminadas,
    porcentaje,
    misTareas,
    tablerosCreados,
    miembros,
  }
})
