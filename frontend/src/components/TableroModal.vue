<script setup>
import { reactive, ref } from 'vue'
import VentanaModal from './VentanaModal.vue'
import Icono from './Icono.vue'
import { mensajeDeError } from '../api/http'

// Sirve para crear (sin `tablero`) y para editar un tablero existente
const props = defineProps({
  tablero: { type: Object, default: null },
  guardar: { type: Function, required: true },
})
const emit = defineEmits(['cerrar'])

const form = reactive({
  nombre: props.tablero?.nombre ?? '',
  descripcion: props.tablero?.descripcion ?? '',
})
const error = ref('')
const guardando = ref(false)

const enviar = async () => {
  error.value = ''
  guardando.value = true
  try {
    await props.guardar({ nombre: form.nombre.trim(), descripcion: form.descripcion.trim() })
    emit('cerrar')
  } catch (e) {
    error.value = mensajeDeError(e, 'No se pudo guardar el tablero')
  } finally {
    guardando.value = false
  }
}
</script>

<template>
  <VentanaModal :titulo="tablero ? 'Editar tablero' : 'Crear tablero'" @cerrar="emit('cerrar')">
    <form class="form" @submit.prevent="enviar">
      <p v-if="error" class="alerta alerta-error" role="alert"><Icono nombre="alerta" :tamano="16" />{{ error }}</p>
      <div class="campo">
        <label for="tablero-nombre">Nombre</label>
        <input id="tablero-nombre" v-model="form.nombre" maxlength="60" required />
      </div>
      <div class="campo">
        <label for="tablero-descripcion">Descripción (opcional)</label>
        <textarea id="tablero-descripcion" v-model="form.descripcion" maxlength="200" />
      </div>
      <div class="form-acciones">
        <button type="button" class="btn btn-secundario" @click="emit('cerrar')">Cancelar</button>
        <button type="submit" class="btn btn-primario" :disabled="guardando || !form.nombre.trim()">
          {{ guardando ? 'Guardando...' : tablero ? 'Guardar' : 'Crear tablero' }}
        </button>
      </div>
    </form>
  </VentanaModal>
</template>
