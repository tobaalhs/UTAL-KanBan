<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import VentanaModal from './VentanaModal.vue'
import Icono from './Icono.vue'
import AvatarUsuario from './AvatarUsuario.vue'
import { mensajeDeError } from '../api/http'
import { buscar as buscarUsuarios } from '../services/usuarios'

// RF10-RF12: ver miembros del tablero e invitar por correo
const props = defineProps({
  tablero: { type: Object, required: true },
  invitar: { type: Function, required: true },
  esCreador: { type: Boolean, default: false },
  eliminarMiembro: { type: Function, default: null },
})
const emit = defineEmits(['cerrar'])

const MAX_SUGERENCIAS = 5

const email = ref('')
const error = ref('')
const exito = ref('')
const enviando = ref(false)
const miembroAEliminar = ref(null)
const eliminando = ref(false)
const sugerencias = ref([])
const mostrarSugerencias = ref(false)
const indiceActivo = ref(-1)

let temporizador = null
let ultimaConsulta = 0

const idsMiembros = computed(() => new Set(props.tablero.miembros.map((m) => m._id)))

const limpiarSugerencias = () => {
  sugerencias.value = []
  mostrarSugerencias.value = false
  indiceActivo.value = -1
}

const alEscribir = () => {
  clearTimeout(temporizador)
  const texto = email.value.trim()
  if (!texto) {
    limpiarSugerencias()
    return
  }

  temporizador = setTimeout(async () => {
    const idConsulta = ++ultimaConsulta
    try {
      const resultados = await buscarUsuarios(texto)
      if (idConsulta !== ultimaConsulta) return
      sugerencias.value = resultados
        .filter((u) => !idsMiembros.value.has(u._id))
        .slice(0, MAX_SUGERENCIAS)
      indiceActivo.value = -1
      mostrarSugerencias.value = sugerencias.value.length > 0
    } catch {
      if (idConsulta === ultimaConsulta) limpiarSugerencias()
    }
  }, 200)
}

const seleccionar = (usuario) => {
  clearTimeout(temporizador)
  ultimaConsulta++
  email.value = usuario.email
  limpiarSugerencias()
}

const alTecla = (e) => {
  if (!mostrarSugerencias.value || !sugerencias.value.length) return

  if (e.key === 'ArrowDown') {
    e.preventDefault()
    indiceActivo.value = (indiceActivo.value + 1) % sugerencias.value.length
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    indiceActivo.value = (indiceActivo.value - 1 + sugerencias.value.length) % sugerencias.value.length
  } else if (e.key === 'Enter' && indiceActivo.value >= 0) {
    e.preventDefault()
    seleccionar(sugerencias.value[indiceActivo.value])
  } else if (e.key === 'Escape') {
    e.preventDefault()
    limpiarSugerencias()
  }
}

const alSalir = () => {
  mostrarSugerencias.value = false
  indiceActivo.value = -1
}

onBeforeUnmount(() => clearTimeout(temporizador))

const enviar = async () => {
  error.value = ''
  exito.value = ''
  limpiarSugerencias()
  enviando.value = true
  try {
    await props.invitar(email.value)
    exito.value = `${email.value} fue agregado al tablero`
    email.value = ''
  } catch (e) {
    error.value = mensajeDeError(e, 'No se pudo invitar al usuario')
  } finally {
    enviando.value = false
  }
}

const confirmarEliminar = (miembro) => {
  error.value = ''
  exito.value = ''
  miembroAEliminar.value = miembro
}

const cancelarEliminar = () => {
  if (eliminando.value) return
  miembroAEliminar.value = null
}

const ejecutarEliminar = async () => {
  if (!miembroAEliminar.value || !props.eliminarMiembro) return
  const objetivo = miembroAEliminar.value
  eliminando.value = true
  error.value = ''
  exito.value = ''
  try {
    await props.eliminarMiembro(objetivo._id)
    exito.value = `${objetivo.nombre} fue eliminado del tablero`
    miembroAEliminar.value = null
  } catch (e) {
    error.value = mensajeDeError(e, 'No se pudo eliminar al miembro')
    miembroAEliminar.value = null
  } finally {
    eliminando.value = false
  }
}
</script>

<template>
  <VentanaModal titulo="Miembros del tablero" @cerrar="emit('cerrar')">
    <ul class="miembros">
      <li v-for="m in tablero.miembros" :key="m._id">
        <AvatarUsuario :usuario="m" :tamano="32" />
        <div>
          <strong>{{ m.nombre }}</strong>
          <small>{{ m.email }}</small>
        </div>
        <span v-if="m._id === tablero.creador" class="creador">Creador</span>
        <button
          v-else-if="esCreador && eliminarMiembro"
          type="button"
          class="btn-icono peligro"
          :title="`Eliminar a ${m.nombre}`"
          :aria-label="`Eliminar a ${m.nombre}`"
          @click="confirmarEliminar(m)"
        >
          <Icono nombre="eliminar" :tamano="16" />
        </button>
      </li>
    </ul>

    <form class="form" @submit.prevent="enviar">
      <p v-if="error" class="alerta alerta-error" role="alert"><Icono nombre="alerta" :tamano="16" />{{ error }}</p>
      <p v-if="exito" class="alerta alerta-exito"><Icono nombre="exito" :tamano="16" />{{ exito }}</p>
      <div class="campo campo-autocompletar">
        <label for="invitar-email">Invitar por correo o nombre</label>
        <input
          id="invitar-email"
          v-model.trim="email"
          type="email"
          placeholder="Nombre o correo@utal.cl"
          autocomplete="off"
          required
          @input="alEscribir"
          @focus="sugerencias.length && (mostrarSugerencias = true)"
          @blur="alSalir"
          @keydown="alTecla"
        />
        <ul v-if="mostrarSugerencias && sugerencias.length" class="sugerencias" role="listbox">
          <li
            v-for="(u, i) in sugerencias"
            :key="u._id"
            role="option"
            :aria-selected="i === indiceActivo"
            :class="{ activa: i === indiceActivo }"
            @mousedown.prevent="seleccionar(u)"
          >
            <AvatarUsuario :usuario="u" :tamano="28" />
            <div class="sugerencia-datos">
              <strong>{{ u.email }}</strong>
              <small>{{ u.nombre }}</small>
            </div>
          </li>
        </ul>
      </div>
      <div class="form-acciones">
        <button type="submit" class="btn btn-primario" :disabled="enviando || !email">
          {{ enviando ? 'Invitando...' : 'Invitar' }}
        </button>
      </div>
    </form>
  </VentanaModal>

  <VentanaModal v-if="miembroAEliminar" titulo="Confirmar eliminación" @cerrar="cancelarEliminar">
    <p class="confirmacion-texto">
      ¿Seguro que quieres eliminar a <strong>{{ miembroAEliminar.nombre }}</strong>
      <span>({{ miembroAEliminar.email }})</span> del tablero?
    </p>
    <p class="confirmacion-nota">Sus tareas asignadas en este tablero quedarán sin asignar.</p>
    <div class="confirmacion-acciones">
      <button type="button" class="btn btn-secundario" :disabled="eliminando" @click="cancelarEliminar">
        Cancelar
      </button>
      <button type="button" class="btn btn-peligro" :disabled="eliminando" @click="ejecutarEliminar">
        {{ eliminando ? 'Eliminando...' : 'Eliminar miembro' }}
      </button>
    </div>
  </VentanaModal>
</template>

<style scoped>
.miembros {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin: 0 0 1.5rem;
  padding: 0;
  list-style: none;
}
.miembros li {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.miembros div {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}
.miembros small {
  color: var(--color-texto-2);
}
.creador {
  padding: 0.15rem 0.5rem;
  border-radius: 6px;
  background: rgb(99 102 241 / 0.15);
  color: var(--color-primario-claro);
  font-size: 0.75rem;
}
.campo-autocompletar {
  position: relative;
}
.sugerencias {
  margin: 0.35rem 0 0;
  padding: 0.35rem;
  list-style: none;
  background: var(--color-superficie-2);
  border: 1px solid var(--color-borde-fuerte);
  border-radius: var(--radio);
}
.sugerencias li {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.5rem 0.6rem;
  border-radius: 7px;
  cursor: pointer;
  transition: background var(--transicion);
}
.sugerencias li:hover,
.sugerencias li.activa {
  background: var(--color-superficie-3);
}
.sugerencia-datos {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.sugerencia-datos strong {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-texto);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.sugerencia-datos small {
  font-size: 0.75rem;
  color: var(--color-texto-2);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.confirmacion-texto {
  margin: 0 0 0.5rem;
  color: var(--color-texto);
  line-height: 1.5;
}
.confirmacion-texto span {
  color: var(--color-texto-2);
}
.confirmacion-nota {
  margin: 0 0 1.25rem;
  font-size: 0.85rem;
  color: var(--color-texto-2);
}
.confirmacion-acciones {
  display: flex;
  justify-content: flex-end;
  gap: 0.65rem;
}
</style>
