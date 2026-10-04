<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import GrupoAvatares from '../components/GrupoAvatares.vue'
import Icono from '../components/Icono.vue'
import TableroModal from '../components/TableroModal.vue'
import { useAuthStore } from '../stores/auth'
import { useTablerosStore } from '../stores/tableros'
import { useNotificacionesStore } from '../stores/notificaciones'
import { mensajeDeError } from '../api/http'
import { fechaRelativa } from '../utils/fechas'

const auth = useAuthStore()
const tableros = useTablerosStore()
const notificaciones = useNotificacionesStore()
const router = useRouter()

const busqueda = ref('')
const creando = ref(false)

const filtrados = computed(() => {
  const texto = busqueda.value.trim().toLowerCase()
  if (!texto) return tableros.lista
  return tableros.lista.filter((t) => t.nombre.toLowerCase().includes(texto))
})

const saludo = computed(() => {
  const hora = new Date().getHours()
  if (hora < 12) return 'Buenos días'
  if (hora < 20) return 'Buenas tardes'
  return 'Buenas noches'
})

// Cada tablero obtiene un acento de color estable segun su id
const acentos = ['#6366f1', '#0ea5e9', '#14b8a6', '#f59e0b', '#ec4899', '#8b5cf6']
const acento = (id) => acentos[[...id].reduce((a, c) => a + c.charCodeAt(0), 0) % acentos.length]

const porcentaje = (t) => (t.cantidadTareas ? Math.round((t.cantidadTerminadas / t.cantidadTareas) * 100) : 0)

const crear = async (datos) => {
  const tablero = await tableros.crear(datos)
  router.push({ name: 'tablero', params: { id: tablero._id } })
}

onMounted(async () => {
  try {
    await tableros.cargar()
  } catch (e) {
    notificaciones.mostrar(mensajeDeError(e, 'No se pudieron cargar los tableros'))
  }
})
</script>

<template>
  <div class="pagina">
    <header class="encabezado">
      <div>
        <p class="saludo">{{ saludo }}, {{ auth.usuario?.nombre }}</p>
        <h1>Mis tableros</h1>
      </div>
      <div class="herramientas">
        <label class="buscador">
          <Icono nombre="buscar" :tamano="16" />
          <input v-model="busqueda" type="search" placeholder="Buscar tableros" aria-label="Buscar tableros" />
        </label>
        <button class="btn btn-primario" @click="creando = true">
          <Icono nombre="mas" :tamano="16" /> Crear tablero
        </button>
      </div>
    </header>

    <div v-if="tableros.cargando && !tableros.lista.length" class="grilla">
      <div v-for="n in 3" :key="n" class="tarjeta esqueleto" aria-hidden="true"></div>
    </div>

    <div v-else-if="!tableros.lista.length" class="sin-tableros">
      <svg width="120" height="88" viewBox="0 0 120 88" fill="none" aria-hidden="true">
        <rect x="1" y="1" width="118" height="86" rx="12" stroke="currentColor" stroke-opacity=".25" stroke-width="1.5" />
        <rect x="12" y="14" width="28" height="60" rx="6" fill="currentColor" fill-opacity=".08" />
        <rect x="46" y="14" width="28" height="44" rx="6" fill="currentColor" fill-opacity=".08" />
        <rect x="80" y="14" width="28" height="52" rx="6" fill="currentColor" fill-opacity=".08" />
        <rect x="16" y="20" width="20" height="10" rx="3" fill="#6366f1" fill-opacity=".7" />
        <rect x="50" y="20" width="20" height="10" rx="3" fill="#818cf8" fill-opacity=".5" />
        <rect x="84" y="20" width="20" height="10" rx="3" fill="#22c55e" fill-opacity=".6" />
      </svg>
      <h2>Aún no tienes tableros</h2>
      <p>Crea tu primer tablero para empezar a organizar tareas con tu equipo.</p>
      <button class="btn btn-primario" @click="creando = true">
        <Icono nombre="mas" :tamano="16" /> Crear tablero
      </button>
    </div>

    <template v-else>
      <div class="grilla">
        <RouterLink
          v-for="tablero in filtrados"
          :key="tablero._id"
          :to="{ name: 'tablero', params: { id: tablero._id } }"
          class="tarjeta"
          :style="{ '--acento': acento(tablero._id) }"
        >
          <div class="tarjeta-cabecera">
            <span class="insignia">{{ tablero.nombre.charAt(0).toUpperCase() }}</span>
            <span class="actualizado">
              <Icono nombre="reloj" :tamano="12" />
              {{ fechaRelativa(tablero.updatedAt) }}
            </span>
          </div>
          <h2>{{ tablero.nombre }}</h2>
          <p class="descripcion">{{ tablero.descripcion || 'Sin descripción' }}</p>

          <div class="avance">
            <div class="avance-texto">
              <span>{{ tablero.cantidadTerminadas }}/{{ tablero.cantidadTareas }} tareas</span>
              <span>{{ porcentaje(tablero) }}%</span>
            </div>
            <div class="barra"><div :style="{ width: `${porcentaje(tablero)}%` }"></div></div>
          </div>

          <footer>
            <GrupoAvatares :usuarios="tablero.miembros" :tamano="26" />
            <span class="miembros-texto">
              {{ tablero.miembros.length }} {{ tablero.miembros.length === 1 ? 'miembro' : 'miembros' }}
            </span>
          </footer>
        </RouterLink>

        <button v-if="!busqueda" class="tarjeta nueva" @click="creando = true">
          <span class="nueva-icono"><Icono nombre="mas" :tamano="20" /></span>
          <strong>Nuevo tablero</strong>
          <small>Organiza un nuevo proyecto</small>
        </button>
      </div>

      <p v-if="busqueda && !filtrados.length" class="sin-resultados">
        No hay tableros que coincidan con "{{ busqueda }}".
      </p>
    </template>

    <TableroModal v-if="creando" :guardar="crear" @cerrar="creando = false" />
  </div>
</template>

<style scoped>
.pagina {
  max-width: 1200px;
  padding: 2rem 2.25rem;
}
.encabezado {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  flex-wrap: wrap;
  gap: 1.25rem;
  margin-bottom: 1.75rem;
}
.saludo {
  margin: 0 0 0.2rem;
  color: var(--color-texto-2);
  font-size: 0.875rem;
}
h1 {
  margin: 0;
  font-size: 1.6rem;
  font-weight: 700;
}
.herramientas {
  display: flex;
  gap: 0.6rem;
}
.buscador {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 260px;
  height: 38px;
  padding: 0 0.8rem;
  border: 1px solid var(--color-borde-fuerte);
  border-radius: var(--radio);
  background: var(--color-superficie);
  color: var(--color-texto-3);
  transition: border-color var(--transicion), box-shadow var(--transicion);
}
.buscador:focus-within {
  border-color: var(--color-primario);
  box-shadow: 0 0 0 3px rgb(99 102 241 / 0.2);
}
.buscador input {
  flex: 1;
  width: 100%;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  color: var(--color-texto);
  font: inherit;
  font-size: 0.9rem;
}
.buscador input::placeholder {
  color: var(--color-texto-3);
}

/* ---------- Tarjetas ---------- */
.grilla {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
  gap: 1rem;
}
.tarjeta {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 228px;
  padding: 1.15rem 1.2rem 1.05rem;
  border: 1px solid var(--color-borde);
  border-radius: var(--radio-grande);
  background: var(--color-superficie);
  color: var(--color-texto);
  overflow: hidden;
  transition: border-color var(--transicion), transform var(--transicion), box-shadow var(--transicion);
}
.tarjeta::before {
  content: '';
  position: absolute;
  inset: 0 0 auto;
  height: 80px;
  background: radial-gradient(120% 100% at 0% 0%, color-mix(in srgb, var(--acento) 14%, transparent), transparent 70%);
  pointer-events: none;
}
a.tarjeta:hover {
  border-color: color-mix(in srgb, var(--acento) 50%, transparent);
  box-shadow: var(--sombra);
  transform: translateY(-2px);
  color: var(--color-texto);
}
.tarjeta-cabecera {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.9rem;
}
.insignia {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 9px;
  background: color-mix(in srgb, var(--acento) 18%, transparent);
  border: 1px solid color-mix(in srgb, var(--acento) 35%, transparent);
  color: var(--acento);
  font-weight: 700;
}
.actualizado {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  color: var(--color-texto-3);
  font-size: 0.75rem;
}
.tarjeta h2 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}
.descripcion {
  flex: 1;
  margin: 0.3rem 0 1rem;
  color: var(--color-texto-2);
  font-size: 0.85rem;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.avance-texto {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.4rem;
  color: var(--color-texto-2);
  font-size: 0.75rem;
  font-variant-numeric: tabular-nums;
}
.barra {
  height: 5px;
  border-radius: 5px;
  background: var(--color-superficie-3);
  overflow: hidden;
}
.barra div {
  height: 100%;
  border-radius: inherit;
  background: var(--acento);
}
.tarjeta footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
  padding-top: 0.85rem;
  border-top: 1px solid var(--color-borde);
}
.miembros-texto {
  color: var(--color-texto-3);
  font-size: 0.75rem;
}
.nueva {
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  border: 1px dashed var(--color-borde-fuerte);
  background: transparent;
  color: var(--color-texto-2);
  font: inherit;
  cursor: pointer;
}
.nueva:hover {
  border-color: var(--color-primario);
  background: rgb(99 102 241 / 0.04);
}
.nueva:hover .nueva-icono {
  border-color: var(--color-primario);
  color: var(--color-primario-claro);
}
.nueva strong {
  margin-top: 0.4rem;
  color: var(--color-texto);
  font-size: 0.9rem;
}
.nueva small {
  color: var(--color-texto-3);
}
.nueva-icono {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border: 1px solid var(--color-borde-fuerte);
  border-radius: 12px;
  transition: border-color var(--transicion), color var(--transicion);
}

/* ---------- Estados ---------- */
.esqueleto {
  background: linear-gradient(90deg, var(--color-superficie) 0%, var(--color-superficie-2) 50%, var(--color-superficie) 100%);
  background-size: 200% 100%;
  animation: brillo 1.2s ease-in-out infinite;
}
@keyframes brillo {
  to {
    background-position: -200% 0;
  }
}
.sin-tableros {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  max-width: 380px;
  margin: 4rem auto;
  color: var(--color-texto-2);
  text-align: center;
}
.sin-tableros h2 {
  margin: 1rem 0 0;
  color: var(--color-texto);
  font-size: 1.1rem;
}
.sin-tableros p {
  margin: 0 0 1rem;
  font-size: 0.9rem;
}
.sin-resultados {
  color: var(--color-texto-2);
}

@media (max-width: 768px) {
  .pagina {
    padding: 1.25rem 1rem;
  }
  .encabezado {
    flex-direction: column;
    align-items: stretch;
  }
  .buscador {
    flex: 1;
    width: auto;
    min-width: 0;
  }
}
</style>
