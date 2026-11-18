<script setup>
import { computed, reactive, ref } from 'vue'
import VentanaModal from './VentanaModal.vue'
import Icono from './Icono.vue'
import EstadoIcono from './EstadoIcono.vue'
import PrioridadIndicador from './PrioridadIndicador.vue'
import { mensajeDeError } from '../api/http'
import { ETIQUETAS_SUGERIDAS, PRIORIDADES } from '../services/tareas'
import { useAuthStore } from '../stores/auth'

// Sirve para crear (sin `tarea`) y para editar una tarea existente
const props = defineProps({
  tarea: { type: Object, default: null },
  miembros: { type: Array, default: () => [] },
  etiquetasGlobales: { type: Array, default: () => [] },
  puedeEliminar: { type: Boolean, default: false },
  guardar: { type: Function, required: true },
  eliminar: { type: Function, default: null },
})
const emit = defineEmits(['cerrar'])

const form = reactive({
  titulo: props.tarea?.titulo ?? '',
  descripcion: props.tarea?.descripcion ?? '',
  prioridad: props.tarea?.prioridad ?? 'Media',
  asignadoId: props.tarea?.asignado?._id ?? '',
  etiquetas: [...(props.tarea?.etiquetas ?? [])],
  subtareas: (props.tarea?.subtareas ?? []).map((s) => ({
    ...s,
    asignadoId: s.asignado?._id ?? '',
  })),
})
const nuevaEtiqueta = ref('')
const nuevaSubtarea = ref('')
const nuevaSubtareaAsignado = ref('')
const auth = useAuthStore()
const estaFinalizada = computed(() => props.tarea?.estado === 'Terminado')
const esMiembro = (id) => props.miembros.some((m) => m._id === id)
const puedeAsignarmela = computed(
  () => !estaFinalizada.value && esMiembro(auth.usuario?._id) && form.asignadoId !== auth.usuario._id,
)
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

const subtareasCompletadas = computed(() => form.subtareas.filter((s) => s.completada).length)

const etiquetasSugeridas = computed(() => {
  const vistas = new Set()
  const lista = []
  for (const tag of [...ETIQUETAS_SUGERIDAS, ...props.etiquetasGlobales]) {
    const clave = tag.toLowerCase()
    if (vistas.has(clave)) continue
    vistas.add(clave)
    lista.push(tag)
  }
  return lista
})

const tieneEtiqueta = (nombre) =>
  form.etiquetas.some((e) => e.toLowerCase() === nombre.toLowerCase())

const toggleEtiqueta = (nombre) => {
  if (estaFinalizada.value) return
  const i = form.etiquetas.findIndex((e) => e.toLowerCase() === nombre.toLowerCase())
  if (i >= 0) form.etiquetas.splice(i, 1)
  else form.etiquetas.push(nombre)
}

const agregarEtiqueta = () => {
  if (estaFinalizada.value) return
  const limpia = nuevaEtiqueta.value.trim()
  if (!limpia) return
  if (!tieneEtiqueta(limpia)) form.etiquetas.push(limpia)
  nuevaEtiqueta.value = ''
}

const agregarSubtarea = () => {
  if (estaFinalizada.value) return
  const titulo = nuevaSubtarea.value.trim()
  if (!titulo) return
  form.subtareas.push({
    titulo,
    completada: false,
    asignadoId: nuevaSubtareaAsignado.value || '',
  })
  nuevaSubtarea.value = ''
  nuevaSubtareaAsignado.value = ''
}

const eliminarSubtarea = (indice) => {
  if (estaFinalizada.value) return
  form.subtareas.splice(indice, 1)
}

const enviar = () => {
  if (estaFinalizada.value) return
  return ejecutar(
    () =>
      props.guardar({
        titulo: form.titulo.trim(),
        descripcion: form.descripcion.trim(),
        prioridad: form.prioridad,
        asignadoId: form.asignadoId || null, // null = sin responsable
        etiquetas: form.etiquetas,
        subtareas: form.subtareas.map((s) => ({
          ...(s._id ? { _id: s._id } : {}),
          titulo: s.titulo.trim(),
          completada: Boolean(s.completada),
          asignadoId: s.asignadoId || null,
        })),
      }),
    'No se pudo guardar la tarea',
  )
}

const borrar = () => {
  if (confirm(`¿Eliminar la tarea "${props.tarea.titulo}"?`)) {
    ejecutar(props.eliminar, 'No se pudo eliminar la tarea')
  }
}
</script>

<template>
  <VentanaModal :titulo="estaFinalizada ? 'Detalle de tarea' : tarea ? 'Editar tarea' : 'Nueva tarea'" @cerrar="emit('cerrar')">
    <form class="form" @submit.prevent="enviar">
      <p v-if="error" class="alerta alerta-error" role="alert"><Icono nombre="alerta" :tamano="16" />{{ error }}</p>
      <p v-if="tarea" class="estado-actual">
        <EstadoIcono :estado="tarea.estado" :tamano="14" /> {{ tarea.estado }}
      </p>
      <p v-if="estaFinalizada" class="aviso-finalizada">
        Esta tarea está finalizada y no se puede modificar.
      </p>
      <div class="campo">
        <label for="tarea-titulo">Título</label>
        <input id="tarea-titulo" v-model="form.titulo" maxlength="100" :disabled="estaFinalizada" required />
      </div>
      <div class="campo">
        <label for="tarea-descripcion">Descripción</label>
        <textarea id="tarea-descripcion" v-model="form.descripcion" maxlength="500" :disabled="estaFinalizada" />
      </div>
      <fieldset class="campo" :disabled="estaFinalizada">
        <legend class="etiqueta">Prioridad</legend>
        <div class="segmentado">
          <label v-for="p in PRIORIDADES" :key="p" :class="{ activo: form.prioridad === p }">
            <input v-model="form.prioridad" type="radio" name="prioridad" :value="p" :disabled="estaFinalizada" />
            <PrioridadIndicador :prioridad="p" />
          </label>
        </div>
      </fieldset>
      <div class="campo">
        <div class="etiqueta-fila">
          <label for="tarea-asignado">Responsable</label>
          <button v-if="puedeAsignarmela" type="button" class="enlace" @click="form.asignadoId = auth.usuario._id">
            Asignármela a mí
          </button>
        </div>
        <select id="tarea-asignado" v-model="form.asignadoId" :disabled="estaFinalizada">
          <option value="">Sin asignar</option>
          <option v-for="m in miembros" :key="m._id" :value="m._id">{{ m.nombre }}</option>
        </select>
      </div>
      <div class="campo">
        <label for="tarea-etiqueta">Etiquetas</label>
        <div v-if="!estaFinalizada" class="entrada-inline">
          <input
            id="tarea-etiqueta"
            v-model="nuevaEtiqueta"
            maxlength="24"
            placeholder="Agregar etiqueta (ej. Bug)"
            @keydown.enter.prevent="agregarEtiqueta"
          />
          <button type="button" class="btn btn-secundario" :disabled="!nuevaEtiqueta.trim()" @click="agregarEtiqueta">
            Agregar
          </button>
        </div>
        <div v-if="form.etiquetas.length" class="lista-chips">
          <span v-for="tag in form.etiquetas" :key="tag" class="chip-tag">
            {{ tag }}
            <button
              v-if="!estaFinalizada"
              type="button"
              :aria-label="`Quitar etiqueta ${tag}`"
              @click="toggleEtiqueta(tag)"
            >
              ×
            </button>
          </span>
        </div>
        <div v-if="!estaFinalizada" class="sugeridas">
          <button
            v-for="sug in etiquetasSugeridas"
            :key="sug"
            type="button"
            class="chip-sugerida"
            :class="{ activa: tieneEtiqueta(sug) }"
            @click="toggleEtiqueta(sug)"
          >
            {{ sug }}
          </button>
        </div>
      </div>

      <div class="campo">
        <div class="etiqueta-fila">
          <label for="tarea-subtarea">Subtareas</label>
          <span v-if="form.subtareas.length" class="contador-sub">
            {{ subtareasCompletadas }}/{{ form.subtareas.length }}
          </span>
        </div>
        <div v-if="!estaFinalizada" class="entrada-inline">
          <input
            id="tarea-subtarea"
            v-model="nuevaSubtarea"
            maxlength="100"
            placeholder="Nueva subtarea"
            @keydown.enter.prevent="agregarSubtarea"
          />
          <select v-model="nuevaSubtareaAsignado" class="sub-select" aria-label="Responsable de la subtarea">
            <option value="">Cualquiera</option>
            <option v-for="m in miembros" :key="m._id" :value="m._id">{{ m.nombre }}</option>
          </select>
          <button type="button" class="btn btn-secundario" :disabled="!nuevaSubtarea.trim()" @click="agregarSubtarea">
            Agregar
          </button>
        </div>
        <ul v-if="form.subtareas.length" class="lista-subtareas">
          <li v-for="(sub, i) in form.subtareas" :key="sub._id || i" :class="{ completada: sub.completada }">
            <label>
              <input v-model="sub.completada" type="checkbox" :disabled="estaFinalizada" />
              <span>{{ sub.titulo }}</span>
            </label>
            <select
              v-model="sub.asignadoId"
              class="sub-select sub-select-item"
              :disabled="estaFinalizada"
              aria-label="Responsable de la subtarea"
            >
              <option value="">Cualquiera</option>
              <option v-for="m in miembros" :key="m._id" :value="m._id">{{ m.nombre }}</option>
            </select>
            <button
              v-if="!estaFinalizada"
              type="button"
              class="btn-quitar"
              aria-label="Eliminar subtarea"
              @click="eliminarSubtarea(i)"
            >
              ×
            </button>
          </li>
        </ul>
      </div>
      <div class="form-acciones">
        <button v-if="tarea && puedeEliminar" type="button" class="btn btn-peligro izquierda" :disabled="ocupado" @click="borrar">
          <Icono nombre="eliminar" :tamano="16" /> Eliminar
        </button>
        <button type="button" class="btn btn-secundario" @click="emit('cerrar')">
          {{ estaFinalizada ? 'Cerrar' : 'Cancelar' }}
        </button>
        <button v-if="!estaFinalizada" type="submit" class="btn btn-primario" :disabled="ocupado || !form.titulo.trim()">
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
.aviso-finalizada {
  margin: 0;
  padding: 0.6rem 0.8rem;
  border-radius: var(--radio);
  border: 1px solid rgb(34 197 94 / 0.25);
  background: rgb(34 197 94 / 0.08);
  color: var(--color-texto-2);
  font-size: 0.85rem;
}
.etiqueta-fila {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}
.enlace {
  padding: 0;
  border: none;
  background: none;
  color: var(--color-primario-claro);
  font: inherit;
  font-size: 0.8rem;
  cursor: pointer;
}
.enlace:hover {
  color: var(--color-texto);
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
.entrada-inline {
  display: flex;
  gap: 0.5rem;
}
.entrada-inline input {
  flex: 1;
}
.lista-chips,
.sugeridas {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}
.chip-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  border: 1px solid rgb(99 102 241 / 0.35);
  background: rgb(99 102 241 / 0.16);
  color: var(--color-primario-claro);
  font-size: 0.78rem;
  font-weight: 500;
}
.chip-tag button {
  padding: 0;
  border: none;
  background: none;
  color: inherit;
  font-size: 0.95rem;
  line-height: 1;
  cursor: pointer;
}
.chip-sugerida {
  padding: 0.18rem 0.55rem;
  border-radius: 999px;
  border: 1px dashed var(--color-borde-fuerte);
  background: transparent;
  color: var(--color-texto-2);
  font: inherit;
  font-size: 0.75rem;
  cursor: pointer;
  transition: border-color var(--transicion), color var(--transicion), background var(--transicion);
}
.chip-sugerida:hover {
  border-color: var(--color-primario);
  color: var(--color-texto);
}
.chip-sugerida.activa {
  border-style: solid;
  border-color: var(--color-primario);
  background: rgb(99 102 241 / 0.12);
  color: var(--color-primario-claro);
}
.contador-sub {
  font-size: 0.8rem;
  color: var(--color-texto-2);
  font-variant-numeric: tabular-nums;
}
.lista-subtareas {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin: 0;
  padding: 0;
  list-style: none;
}
.lista-subtareas li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.45rem 0.65rem;
  border: 1px solid var(--color-borde);
  border-radius: var(--radio);
  background: var(--color-fondo);
}
.lista-subtareas label {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  flex: 1;
  min-width: 0;
  cursor: pointer;
  font-size: 0.875rem;
}
.lista-subtareas li.completada span {
  color: var(--color-texto-3);
  text-decoration: line-through;
}
.btn-quitar {
  padding: 0 0.25rem;
  border: none;
  background: none;
  color: var(--color-texto-3);
  font-size: 1.05rem;
  line-height: 1;
  cursor: pointer;
}
.btn-quitar:hover {
  color: var(--color-error);
}
.sub-select {
  max-width: 135px;
  font-size: 0.8rem;
}
.sub-select-item {
  height: 28px;
  padding: 0 0.45rem;
  font-size: 0.75rem;
  max-width: 120px;
}
</style>
