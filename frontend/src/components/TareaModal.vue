<script setup>
import { reactive, ref } from 'vue'
import VentanaModal from './VentanaModal.vue'
import Icono from './Icono.vue'
import EstadoIcono from './EstadoIcono.vue'
import PrioridadIndicador from './PrioridadIndicador.vue'
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
      <p v-if="error" class="alerta alerta-error" role="alert"><Icono nombre="alerta" :tamano="16" />{{ error }}</p>
      <p v-if="tarea" class="estado-actual">
        <EstadoIcono :estado="tarea.estado" :tamano="14" /> {{ tarea.estado }}
      </p>
      <div class="campo">
        <label for="tarea-titulo">Título</label>
        <input id="tarea-titulo" v-model="form.titulo" maxlength="100" required />
      </div>
      <div class="campo">
        <label for="tarea-descripcion">Descripción</label>
        <textarea id="tarea-descripcion" v-model="form.descripcion" maxlength="500" />
      </div>
      <fieldset class="campo">
        <legend class="etiqueta">Prioridad</legend>
        <div class="segmentado">
          <label v-for="p in PRIORIDADES" :key="p" :class="{ activo: form.prioridad === p }">
            <input v-model="form.prioridad" type="radio" name="prioridad" :value="p" />
            <PrioridadIndicador :prioridad="p" />
          </label>
        </div>
      </fieldset>
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
.estado-actual {
  display: inline-flex;
  align-self: flex-start;
  align-items: center;
  gap: 0.4rem;
  margin: -0.4rem 0 0;
  padding: 0.2rem 0.6rem;
  border: 1px solid var(--color-borde-fuerte);
  border-radius: 999px;
  color: var(--color-texto-2);
  font-size: 0.78rem;
  font-weight: 500;
}
fieldset {
  margin: 0;
  padding: 0;
  border: none;
}
legend {
  margin-bottom: 0.4rem;
  padding: 0;
}
.segmentado {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
  padding: 4px;
  border: 1px solid var(--color-borde-fuerte);
  border-radius: var(--radio);
  background: var(--color-fondo);
}
.segmentado label {
  display: grid;
  place-items: center;
  height: 34px;
  border-radius: 7px;
  cursor: pointer;
  opacity: 0.55;
  transition: background var(--transicion), opacity var(--transicion);
}
.segmentado label:hover {
  opacity: 0.85;
}
.segmentado label.activo {
  background: var(--color-superficie-3);
  opacity: 1;
}
.segmentado label:has(input:focus-visible) {
  outline: 2px solid var(--color-primario);
}
.segmentado input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}
</style>
