<script setup>
import { reactive, ref } from 'vue'
import VentanaModal from './VentanaModal.vue'
import Icono from './Icono.vue'
import { mensajeDeError } from '../api/http'
import { PRIORIDADES } from '../services/tareas'

// Sirve para crear (sin `tarea`) y para editar una tarea existente
const props = defineProps({
  tarea: { type: Object, default: null },
  puedeEliminar: { type: Boolean, default: false },
  guardar: { type: Function, required: true },
  eliminar: { type: Function, default: null },
})
const emit = defineEmits(['cerrar'])

const form = reactive({
  titulo: props.tarea?.titulo ?? '',
  descripcion: props.tarea?.descripcion ?? '',
  prioridad: props.tarea?.prioridad ?? 'Media',
})
const error = ref('')
const ocupado = ref(false)

const ejecutar = async (accion, porDefecto) => {
  error.value = ''
  ocupado.value = true
  try {
    await accion()
    emit('cerrar')
  } catch (e) {
    error.value = mensajeDeError(e, porDefecto)
  } finally {
    ocupado.value = false
  }
}

const enviar = () =>
  ejecutar(
    () => props.guardar({ titulo: form.titulo.trim(), descripcion: form.descripcion.trim(), prioridad: form.prioridad }),
    'No se pudo guardar la tarea',
  )

const borrar = () => {
  if (confirm(`¿Eliminar la tarea "${props.tarea.titulo}"?`)) {
    ejecutar(props.eliminar, 'No se pudo eliminar la tarea')
  }
}
</script>

<template>
  <VentanaModal :titulo="tarea ? 'Editar tarea' : 'Nueva tarea'" @cerrar="emit('cerrar')">
    <form class="form" @submit.prevent="enviar">
      <p v-if="error" class="alerta alerta-error" role="alert">{{ error }}</p>
      <div class="campo">
        <label for="tarea-titulo">Título</label>
        <input id="tarea-titulo" v-model="form.titulo" maxlength="100" required />
      </div>
      <div class="campo">
        <label for="tarea-descripcion">Descripción</label>
        <textarea id="tarea-descripcion" v-model="form.descripcion" maxlength="500" />
      </div>
      <div class="campo">
        <label for="tarea-prioridad">Prioridad</label>
        <select id="tarea-prioridad" v-model="form.prioridad">
          <option v-for="p in PRIORIDADES" :key="p" :value="p">{{ p }}</option>
        </select>
      </div>
      <div class="form-acciones">
        <button v-if="tarea && puedeEliminar" type="button" class="btn btn-peligro izquierda" :disabled="ocupado" @click="borrar">
          <Icono nombre="eliminar" :tamano="16" /> Eliminar
        </button>
        <button type="button" class="btn btn-secundario" @click="emit('cerrar')">Cancelar</button>
        <button type="submit" class="btn btn-primario" :disabled="ocupado || !form.titulo.trim()">
          {{ ocupado ? 'Guardando...' : tarea ? 'Guardar' : 'Crear tarea' }}
        </button>
      </div>
    </form>
  </VentanaModal>
</template>

<style scoped>
.izquierda {
  margin-right: auto;
}
</style>
