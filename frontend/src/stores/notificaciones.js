import { defineStore } from 'pinia'
import { ref } from 'vue'

// Mensajes cortos tipo "toast" (ej. RF19: avisar que un movimiento no se guardo)
export const useNotificacionesStore = defineStore('notificaciones', () => {
  const lista = ref([])
  let siguienteId = 1

  const mostrar = (mensaje, tipo = 'error', duracion = 4000) => {
    const id = siguienteId++
    lista.value.push({ id, mensaje, tipo })
    setTimeout(() => cerrar(id), duracion)
  }

  const cerrar = (id) => {
    lista.value = lista.value.filter((n) => n.id !== id)
  }

  return { lista, mostrar, cerrar }
})
