<script setup>
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { VueDraggable } from 'vue-draggable-plus'
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
import { ESTADOS } from '../services/tareas'
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

const tablero = computed(() => tableros.actual)
const esCreador = computed(() => tablero.value?.creador === auth.usuario?._id)

const cargar = async () => {
  error.value = ''
  try {
    await Promise.all([tableros.abrir(props.id), tareas.cargar(props.id)])
  } catch (e) {
    error.value = mensajeDeError(e, 'No se pudo cargar el tablero')
  }
}
watch(() => props.id, cargar, { immediate: true })

// Cada columna es una copia de la lista del store que el drag & drop puede mutar.
// Se reconstruye cada vez que el store cambia (incluido cuando se revierte un movimiento).
const columnas = reactive(Object.fromEntries(ESTADOS.map((e) => [e, []])))
watch(
  () => tareas.lista,
  (lista) => {
    for (const estado of ESTADOS) columnas[estado] = lista.filter((t) => t.estado === estado)
  },
  { deep: true, immediate: true },
)

const iconoColumna = { Pendiente: '📋', 'En curso': '🔄', Terminado: '✅' }

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
  <div v-if="error" class="estado">
    <p class="alerta alerta-error">{{ error }}</p>
    <RouterLink :to="{ name: 'tableros' }">Volver a mis tableros</RouterLink>
  </div>

  <p v-else-if="!tablero" class="estado">Cargando tablero...</p>

  <div v-else class="pagina">
    <header class="encabezado">
      <RouterLink :to="{ name: 'tableros' }" class="volver">
        <Icono nombre="volver" :tamano="16" /> Tableros
      </RouterLink>
      <div class="titulo">
        <h1>{{ tablero.nombre }}</h1>
        <p v-if="tablero.descripcion">{{ tablero.descripcion }}</p>
      </div>
      <div class="acciones">
        <button class="miembros" title="Miembros" @click="modal = 'miembros'">
          <Icono nombre="miembros" :tamano="16" />
          <GrupoAvatares :usuarios="tablero.miembros" :maximo="3" :tamano="24" />
        </button>
        <button class="btn-icono" title="Editar tablero" aria-label="Editar tablero" @click="modal = 'editar-tablero'">
          <Icono nombre="editar" />
        </button>
        <button v-if="esCreador" class="btn-icono" title="Eliminar tablero" aria-label="Eliminar tablero" @click="eliminarTablero">
          <Icono nombre="eliminar" />
        </button>
        <button class="btn btn-primario" @click="modal = 'nueva-tarea'">
          <Icono nombre="mas" :tamano="16" /> Nueva tarea
        </button>
      </div>
    </header>

    <div class="columnas">
      <section v-for="estado in ESTADOS" :key="estado" class="columna">
        <header>
          <span>{{ iconoColumna[estado] }}</span>
          <h2>{{ estado }}</h2>
          <span class="contador">{{ columnas[estado].length }}</span>
        </header>

        <VueDraggable
          v-model="columnas[estado]"
          class="lista"
          group="tareas"
          :animation="150"
          :delay="150"
          :delay-on-touch-only="true"
          ghost-class="fantasma"
          @add="alSoltarEnColumna($event, estado)"
          @update="alReordenar(estado)"
        >
          <TareaCard v-for="tarea in columnas[estado]" :key="tarea._id" :tarea="tarea" @editar="modal = { tarea }" />
        </VueDraggable>

        <button v-if="estado === 'Pendiente'" class="agregar" @click="modal = 'nueva-tarea'">
          <Icono nombre="mas" :tamano="14" /> Agregar tarea
        </button>
      </section>
    </div>

    <TareaModal v-if="modal === 'nueva-tarea'" :guardar="tareas.crear" @cerrar="modal = null" />
    <TareaModal
      v-else-if="modal?.tarea"
      :tarea="modal.tarea"
      :puede-eliminar="esCreador"
      :guardar="(datos) => tareas.editar(modal.tarea._id, datos)"
      :eliminar="() => tareas.eliminar(modal.tarea._id)"
      @cerrar="modal = null"
    />
    <TableroModal v-else-if="modal === 'editar-tablero'" :tablero="tablero" :guardar="editarTablero" @cerrar="modal = null" />
    <MiembrosModal v-else-if="modal === 'miembros'" :tablero="tablero" :invitar="invitar" @cerrar="modal = null" />
  </div>
</template>

<style scoped>
.estado {
  padding: 2rem;
  color: var(--color-texto-2);
}
.pagina {
  display: flex;
  flex-direction: column;
  height: 100vh;
}
.encabezado {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  padding: 1rem 2rem;
  border-bottom: 1px solid var(--color-borde);
}
.volver {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  color: var(--color-texto-2);
  font-size: 0.9rem;
  white-space: nowrap;
}
.titulo {
  flex: 1;
  min-width: 0;
  padding-left: 1.25rem;
  border-left: 1px solid var(--color-borde);
}
.titulo h1 {
  margin: 0;
  font-size: 1.2rem;
}
.titulo p {
  margin: 0.15rem 0 0;
  color: var(--color-texto-2);
  font-size: 0.85rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.acciones {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.miembros {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.3rem 0.6rem;
  border: 1px solid var(--color-borde);
  border-radius: var(--radio);
  background: var(--color-superficie);
  color: var(--color-primario-claro);
  cursor: pointer;
}
.miembros:hover {
  border-color: var(--color-primario);
}
.columnas {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(3, minmax(260px, 1fr));
  gap: 1.25rem;
  padding: 1.5rem 2rem;
  overflow-x: auto;
  min-height: 0;
}
.columna {
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 0.9rem;
  border: 1px solid var(--color-borde);
  border-radius: 14px;
  background: var(--color-superficie);
}
.columna > header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.9rem;
}
.columna h2 {
  margin: 0;
  font-size: 0.8rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.contador {
  padding: 0 0.45rem;
  border-radius: 6px;
  background: var(--color-superficie-2);
  color: var(--color-texto-2);
  font-size: 0.75rem;
}
.lista {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  min-height: 80px;
  overflow-y: auto;
  padding-right: 2px;
}
.lista :deep(.fantasma) {
  opacity: 0.4;
  border-style: dashed;
  border-color: var(--color-primario);
}
.agregar {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  margin-top: 0.7rem;
  padding: 0.5rem;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--color-texto-2);
  font: inherit;
  font-size: 0.85rem;
  cursor: pointer;
}
.agregar:hover {
  background: var(--color-superficie-2);
  color: var(--color-texto);
}

@media (max-width: 768px) {
  .pagina {
    height: auto;
  }
  .encabezado {
    flex-wrap: wrap;
    padding: 1rem;
    gap: 0.75rem;
  }
  .titulo {
    flex-basis: 100%;
    order: -1;
    padding-left: 0;
    border-left: none;
  }
  .acciones {
    margin-left: auto;
  }
  .acciones .btn {
    padding: 0.55rem 0.8rem;
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
