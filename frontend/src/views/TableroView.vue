<script setup>
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { VueDraggable } from 'vue-draggable-plus'
import EstadoIcono from '../components/EstadoIcono.vue'
import GrupoAvatares from '../components/GrupoAvatares.vue'
import Icono from '../components/Icono.vue'
import MiembrosModal from '../components/MiembrosModal.vue'
import TableroModal from '../components/TableroModal.vue'
import TareaCard from '../components/TareaCard.vue'
import TareaModal from '../components/TareaModal.vue'
import { useAuthStore } from '../stores/auth'
import { useNotificacionesStore } from '../stores/notificaciones'
import { useTablerosStore } from '../stores/tableros'
import { useTareasStore } from '../stores/tareas'
import { ESTADOS, ETIQUETAS_SUGERIDAS, PRIORIDADES, listarEtiquetas } from '../services/tareas'
import { mensajeDeError } from '../api/http'

const props = defineProps({
  id: { type: String, required: true },
})

const auth = useAuthStore()
const tableros = useTablerosStore()
const tareas = useTareasStore()
const notificaciones = useNotificacionesStore()
const router = useRouter()

const error = ref('')
const modal = ref(null) // 'nueva-tarea' | 'editar-tablero' | 'miembros' | { tarea }
const soloMias = ref(false)
const prioridadFiltro = ref('')
const etiquetaFiltro = ref('')
const etiquetasGlobales = ref([])
const etiquetasDisponibles = computed(() => {
  const unicas = new Map()
  for (const tag of [...ETIQUETAS_SUGERIDAS, ...etiquetasGlobales.value]) {
    const clave = tag.toLowerCase()
    if (!unicas.has(clave)) unicas.set(clave, tag)
  }
  for (const t of tareas.lista) {
    for (const tag of t.etiquetas || []) {
      const clave = tag.toLowerCase()
      if (!unicas.has(clave)) unicas.set(clave, tag)
    }
  }
  return [...unicas.values()].sort((a, b) => a.localeCompare(b, 'es'))
})
const hayFiltros = computed(() => Boolean(prioridadFiltro.value) || Boolean(etiquetaFiltro.value) || soloMias.value)
const limpiarFiltros = () => {
  prioridadFiltro.value = ''
  etiquetaFiltro.value = ''
  soloMias.value = false
}

const tablero = computed(() => tableros.actual)
const esCreador = computed(() => tablero.value?.creador === auth.usuario?._id)

const cargar = async () => {
  error.value = ''
  try {
    const [, , etiquetas] = await Promise.all([
      tableros.abrir(props.id),
      tareas.cargar(props.id),
      listarEtiquetas().catch(() => []),
    ])
    etiquetasGlobales.value = etiquetas
  } catch (e) {
    error.value = mensajeDeError(e, 'No se pudo cargar el tablero')
  }
}
watch(() => props.id, cargar, { immediate: true })

// Cada columna es una copia de la lista del store que el drag & drop puede mutar.
// Se reconstruye cada vez que el store cambia (incluido cuando se revierte un movimiento).
const columnas = reactive(Object.fromEntries(ESTADOS.map((e) => [e, []])))
watch(
  [() => tareas.lista, soloMias, prioridadFiltro, etiquetaFiltro],
  ([lista, filtrarMias, prioridad, etiqueta]) => {
    const yo = auth.usuario?._id
    const visibles = lista.filter((t) => {
      if (filtrarMias) {
        const asignadaATarea = (t.asignado?._id ?? t.asignado) === yo
        const asignadaASubtarea = (t.subtareas || []).some((s) => (s.asignado?._id ?? s.asignado) === yo)
        if (!asignadaATarea && !asignadaASubtarea) return false
      }
      if (prioridad && t.prioridad !== prioridad) return false
      if (etiqueta && !(t.etiquetas || []).includes(etiqueta)) return false
      return true
    })
    for (const estado of ESTADOS) columnas[estado] = visibles.filter((t) => t.estado === estado)
  },
  { deep: true, immediate: true },
)

const progreso = computed(() => {
  const total = tareas.lista.length
  const terminadas = tareas.lista.filter((t) => t.estado === 'Terminado').length
  return { total, terminadas, porcentaje: total ? Math.round((terminadas / total) * 100) : 0 }
})

const textoVacio = {
  Pendiente: 'Sin tareas pendientes',
  'En curso': 'Arrastra aquí lo que estés trabajando',
  Terminado: 'Las tareas completadas aparecerán aquí',
}

// RF17-RF19: al soltar en otra columna se persiste; si falla, el store revierte y avisamos
const alSoltarEnColumna = async (evento, estado) => {
  await nextTick()
  // Reordenar y mover en el mismo tick para que la tarjeta no "parpadee" en la columna anterior
  tareas.reordenar(estado, columnas[estado].map((t) => t._id))
  try {
    await tareas.mover(evento.data._id, estado)
  } catch {
    notificaciones.mostrar('No se pudo actualizar la tarea, intenta nuevamente')
  }
}

const alReordenar = async (estado) => {
  await nextTick()
  tareas.reordenar(estado, columnas[estado].map((t) => t._id))
}

const editarTablero = (datos) => tableros.actualizar(props.id, datos)
const invitar = (email) => tableros.invitar(props.id, email)
const eliminarMiembro = async (usuarioId) => {
  await tableros.eliminarMiembro(props.id, usuarioId)
  for (const t of tareas.lista) {
    if (t.asignado?._id === usuarioId) t.asignado = null
    for (const s of t.subtareas || []) {
      if (s.asignado?._id === usuarioId) s.asignado = null
    }
  }
}

const eliminarTablero = async () => {
  if (!confirm(`¿Eliminar el tablero "${tablero.value.nombre}" y todas sus tareas?`)) return
  try {
    await tableros.eliminar(props.id)
    router.push({ name: 'tableros' })
  } catch (e) {
    notificaciones.mostrar(mensajeDeError(e, 'No se pudo eliminar el tablero'))
  }
}
</script>

<template>
  <div v-if="error" class="mensaje">
    <p class="alerta alerta-error"><Icono nombre="alerta" :tamano="16" />{{ error }}</p>
    <RouterLink :to="{ name: 'tableros' }">Volver a mis tableros</RouterLink>
  </div>

  <div v-else-if="!tablero" class="mensaje cargando">
    <span class="spinner" aria-hidden="true"></span> Cargando tablero...
  </div>

  <div v-else class="pagina">
    <header class="encabezado">
      <div class="titulo">
        <nav class="migas" aria-label="Ruta">
          <RouterLink :to="{ name: 'tableros' }">Tableros</RouterLink>
          <Icono nombre="separador" :tamano="14" />
          <span>{{ tablero.nombre }}</span>
        </nav>
        <div class="titulo-fila">
          <h1>{{ tablero.nombre }}</h1>
          <button class="btn-icono" title="Editar tablero" aria-label="Editar tablero" @click="modal = 'editar-tablero'">
            <Icono nombre="editar" :tamano="16" />
          </button>
        </div>
        <p v-if="tablero.descripcion">{{ tablero.descripcion }}</p>
      </div>

      <div class="barra-controles">
        <div class="filtros">
          <select
            v-model="prioridadFiltro"
            class="btn-filtro select-filtro"
            :class="{ activo: Boolean(prioridadFiltro) }"
            aria-label="Filtrar por prioridad"
            title="Filtrar por prioridad"
          >
            <option value="">Todas las prioridades</option>
            <option v-for="p in PRIORIDADES" :key="p" :value="p">Prioridad {{ p }}</option>
          </select>
          <select
            v-model="etiquetaFiltro"
            class="btn-filtro select-filtro"
            :class="{ activo: Boolean(etiquetaFiltro) }"
            aria-label="Filtrar por etiqueta"
            title="Filtrar por etiqueta"
          >
            <option value="">Todas las etiquetas</option>
            <option v-for="tag in etiquetasDisponibles" :key="tag" :value="tag">{{ tag }}</option>
          </select>
          <button
            type="button"
            class="btn-filtro"
            :class="{ activo: soloMias }"
            :aria-pressed="soloMias"
            :title="soloMias ? 'Mostrar todas las tareas' : 'Filtrar solo mis tareas'"
            @click="soloMias = !soloMias"
          >
            <Icono nombre="miembros" :tamano="15" />
            <span>{{ soloMias ? 'Mis tareas' : 'Todas las tareas' }}</span>
          </button>
          <button
            type="button"
            class="btn-filtro btn-goma"
            :disabled="!hayFiltros"
            title="Limpiar filtros"
            aria-label="Limpiar filtros"
            @click="limpiarFiltros"
          >
            <Icono nombre="goma" :tamano="15" />
          </button>
        </div>

        <div class="acciones">
          <div class="progreso" :title="`${progreso.terminadas} de ${progreso.total} tareas terminadas`">
            <span>{{ progreso.porcentaje }}%</span>
            <div class="barra"><div :style="{ width: `${progreso.porcentaje}%` }"></div></div>
          </div>
          <button class="miembros" title="Miembros del tablero" @click="modal = 'miembros'">
            <GrupoAvatares :usuarios="tablero.miembros" :maximo="3" :tamano="26" />
            <Icono nombre="invitar" :tamano="16" />
          </button>
          <button
            v-if="esCreador"
            class="btn-icono peligro"
            title="Eliminar tablero"
            aria-label="Eliminar tablero"
            @click="eliminarTablero"
          >
            <Icono nombre="eliminar" :tamano="17" />
          </button>
          <button class="btn btn-primario" @click="modal = 'nueva-tarea'">
            <Icono nombre="mas" :tamano="16" /> Nueva tarea
          </button>
        </div>
      </div>
    </header>

    <div class="columnas">
      <section v-for="estado in ESTADOS" :key="estado" class="columna">
        <header class="columna-encabezado">
          <EstadoIcono :estado="estado" />
          <h2>{{ estado }}</h2>
          <span class="contador">{{ columnas[estado].length }}</span>
          <button
            v-if="estado === 'Pendiente'"
            class="btn-icono agregar-rapido"
            title="Agregar tarea"
            aria-label="Agregar tarea"
            @click="modal = 'nueva-tarea'"
          >
            <Icono nombre="mas" :tamano="16" />
          </button>
        </header>

        <div class="columna-cuerpo">
          <div v-if="!columnas[estado].length" class="vacio" aria-hidden="true">
            <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
              <rect x="6" y="9" width="32" height="10" rx="3" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3 3" />
              <rect x="6" y="25" width="32" height="10" rx="3" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3 3" opacity=".5" />
            </svg>
            <span>{{ textoVacio[estado] }}</span>
          </div>

          <VueDraggable
            v-model="columnas[estado]"
            class="lista"
            group="tareas"
            :animation="180"
            :delay="150"
            :delay-on-touch-only="true"
            ghost-class="fantasma"
            drag-class="arrastrando"
            @add="alSoltarEnColumna($event, estado)"
            @update="alReordenar(estado)"
          >
            <TareaCard v-for="tarea in columnas[estado]" :key="tarea._id" :tarea="tarea" @editar="modal = { tarea }" />
          </VueDraggable>
        </div>
      </section>
    </div>

    <TareaModal
      v-if="modal === 'nueva-tarea'"
      :miembros="tablero.miembros"
      :etiquetas-globales="etiquetasDisponibles"
      :guardar="tareas.crear"
      @cerrar="modal = null"
    />
    <TareaModal
      v-else-if="modal?.tarea"
      :tarea="modal.tarea"
      :miembros="tablero.miembros"
      :etiquetas-globales="etiquetasDisponibles"
      :puede-eliminar="esCreador"
      :guardar="(datos) => tareas.editar(modal.tarea._id, datos)"
      :eliminar="() => tareas.eliminar(modal.tarea._id)"
      @cerrar="modal = null"
    />
    <TableroModal v-else-if="modal === 'editar-tablero'" :tablero="tablero" :guardar="editarTablero" @cerrar="modal = null" />
    <MiembrosModal
      v-else-if="modal === 'miembros'"
      :tablero="tablero"
      :invitar="invitar"
      :es-creador="esCreador"
      :eliminar-miembro="eliminarMiembro"
      @cerrar="modal = null"
    />
  </div>
</template>

<style scoped>
.mensaje {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1rem;
  padding: 2rem;
  color: var(--color-texto-2);
}
.cargando {
  flex-direction: row;
  align-items: center;
  gap: 0.6rem;
}
.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid var(--color-superficie-3);
  border-top-color: var(--color-primario);
  border-radius: 50%;
  animation: girar 0.7s linear infinite;
}
@keyframes girar {
  to {
    transform: rotate(360deg);
  }
}

.pagina {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

/* ---------- Encabezado ---------- */
.encabezado {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  padding: 1.25rem 2rem 1rem;
  border-bottom: 1px solid var(--color-borde);
}
.barra-controles {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.65rem;
}
.filtros {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.45rem;
  min-width: 0;
}
@media (max-width: 1020px) {
  .barra-controles {
    flex-wrap: wrap;
  }
}
.titulo {
  min-width: 0;
}
.migas {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  margin-bottom: 0.3rem;
  font-size: 0.8rem;
  color: var(--color-texto-3);
}
.migas a {
  color: var(--color-texto-2);
}
.migas a:hover {
  color: var(--color-texto);
}
.migas span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.titulo-fila {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 0.35rem;
}
.titulo-fila .btn-icono {
  opacity: 0;
  transition: opacity var(--transicion), background var(--transicion);
}
.titulo:hover .btn-icono,
.titulo-fila .btn-icono:focus-visible {
  opacity: 1;
}
h1 {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.titulo p {
  margin: 0.2rem 0 0;
  color: var(--color-texto-2);
  font-size: 0.875rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.acciones {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  flex-shrink: 0;
  margin-left: auto;
}
.acciones .btn-primario {
  height: 34px;
  padding: 0 0.85rem;
  font-size: 0.84rem;
}
.progreso {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-right: 0.2rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-texto-2);
  font-variant-numeric: tabular-nums;
}
.barra {
  width: 60px;
  height: 6px;
  border-radius: 6px;
  background: var(--color-superficie-3);
  overflow: hidden;
}
.barra div {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--color-primario), var(--estado-terminado));
  transition: width 0.4s ease;
}
.miembros {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  height: 34px;
  padding: 0 0.55rem 0 0.3rem;
  border: 1px solid var(--color-borde-fuerte);
  border-radius: 999px;
  background: var(--color-superficie);
  color: var(--color-texto-2);
  cursor: pointer;
  transition: border-color var(--transicion), color var(--transicion);
}
.miembros:hover {
  border-color: var(--color-primario);
  color: var(--color-texto);
}
.btn-filtro {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  height: 34px;
  padding: 0 0.7rem;
  border: 1px solid var(--color-borde-fuerte);
  border-radius: 999px;
  background: var(--color-superficie);
  color: var(--color-texto-2);
  font: inherit;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: border-color var(--transicion), background var(--transicion), color var(--transicion);
}
.btn-filtro:hover {
  border-color: var(--color-primario);
  color: var(--color-texto);
}
.btn-filtro.activo {
  border-color: var(--color-primario);
  background: rgb(99 102 241 / 0.16);
  color: var(--color-primario-claro);
}
.select-filtro {
  padding-right: 0.75rem;
}
.select-filtro option {
  background: var(--color-superficie-2);
  color: var(--color-texto);
}
.btn-goma {
  width: 34px;
  padding: 0;
  justify-content: center;
}
.btn-goma:disabled {
  opacity: 0.45;
  cursor: default;
}
.btn-goma:disabled:hover {
  border-color: var(--color-borde-fuerte);
  color: var(--color-texto-2);
}

/* ---------- Columnas ---------- */
.columnas {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(3, minmax(270px, 1fr));
  gap: 1rem;
  padding: 1.25rem 2rem 1.5rem;
  overflow-x: auto;
  min-height: 0;
}
.columna {
  display: flex;
  flex-direction: column;
  min-height: 0;
  border: 1px solid var(--color-borde);
  border-radius: var(--radio-grande);
  background: rgb(21 23 34 / 0.6);
}
.columna-encabezado {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  height: 48px;
  padding: 0 0.6rem 0 0.95rem;
}
.columna-encabezado h2 {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 600;
  letter-spacing: 0;
}
.contador {
  min-width: 22px;
  padding: 0 0.4rem;
  border-radius: 6px;
  background: var(--color-superficie-2);
  color: var(--color-texto-2);
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 20px;
  text-align: center;
  font-variant-numeric: tabular-nums;
}
.agregar-rapido {
  margin-left: auto;
  width: 28px;
  height: 28px;
}
.columna-cuerpo {
  position: relative;
  flex: 1;
  display: flex;
  min-height: 0;
}
.lista {
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  min-height: 120px;
  padding: 0.15rem 0.6rem 0.75rem;
  overflow-y: auto;
}
.vacio {
  position: absolute;
  inset: 0.15rem 0.6rem 0.75rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  max-height: 220px;
  padding: 1rem;
  border: 1px dashed var(--color-borde-fuerte);
  border-radius: var(--radio);
  color: var(--color-texto-3);
  font-size: 0.8rem;
  text-align: center;
  pointer-events: none;
}
.lista :deep(.fantasma) {
  opacity: 0.35;
  border: 1px dashed var(--color-primario);
  background: rgb(99 102 241 / 0.08);
  box-shadow: none;
}
.lista :deep(.arrastrando) {
  transform: rotate(2deg);
  box-shadow: var(--sombra-elevada);
}

@media (max-width: 900px) {
  .encabezado {
    flex-direction: column;
    align-items: stretch;
    gap: 0.9rem;
    padding: 1rem;
  }
  .acciones {
    flex-wrap: wrap;
  }
  .titulo {
    flex: none;
  }
  .progreso {
    margin-right: auto;
  }
  .titulo-fila .btn-icono {
    opacity: 1;
  }
}
@media (max-width: 768px) {
  .pagina {
    height: auto;
  }
  .columnas {
    grid-template-columns: repeat(3, 85vw);
    padding: 1rem;
    scroll-snap-type: x mandatory;
  }
  .columna {
    scroll-snap-align: start;
    max-height: 70vh;
  }
}
</style>
