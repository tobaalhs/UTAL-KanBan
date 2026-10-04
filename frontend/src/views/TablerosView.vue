<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import GrupoAvatares from '../components/GrupoAvatares.vue'
import Icono from '../components/Icono.vue'
import TableroModal from '../components/TableroModal.vue'
import { useTablerosStore } from '../stores/tableros'
import { useNotificacionesStore } from '../stores/notificaciones'
import { mensajeDeError } from '../api/http'
import { fechaRelativa } from '../utils/fechas'

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
      <h1>Mis tableros</h1>
    </header>

    <div class="herramientas">
      <label class="buscador">
        <Icono nombre="buscar" :tamano="16" />
        <input v-model="busqueda" type="search" placeholder="Buscar tableros..." aria-label="Buscar tableros" />
      </label>
      <button class="btn btn-primario" @click="creando = true">
        <Icono nombre="mas" :tamano="16" /> Crear tablero
      </button>
    </div>

    <p v-if="tableros.cargando && !tableros.lista.length" class="vacio">Cargando tableros...</p>

    <div v-else class="grilla">
      <RouterLink
        v-for="tablero in filtrados"
        :key="tablero._id"
        :to="{ name: 'tablero', params: { id: tablero._id } }"
        class="tarjeta"
      >
        <h2>{{ tablero.nombre }}</h2>
        <p class="descripcion">{{ tablero.descripcion || 'Sin descripción' }}</p>
        <footer>
          <GrupoAvatares :usuarios="tablero.miembros" />
          <span class="meta">
            {{ tablero.cantidadTareas }} {{ tablero.cantidadTareas === 1 ? 'tarea' : 'tareas' }}
            · {{ fechaRelativa(tablero.updatedAt) }}
          </span>
        </footer>
      </RouterLink>

      <button v-if="!busqueda" class="tarjeta nueva" @click="creando = true">
        <span class="nueva-icono"><Icono nombre="mas" /></span>
        Crear tablero
      </button>

      <p v-if="busqueda && !filtrados.length" class="vacio">No hay tableros que coincidan con "{{ busqueda }}".</p>
    </div>

    <TableroModal v-if="creando" :guardar="crear" @cerrar="creando = false" />
  </div>
</template>

<style scoped>
.pagina {
  padding: 1.5rem 2rem;
}
.encabezado h1 {
  margin: 0 0 1.25rem;
  font-size: 1.5rem;
}
.herramientas {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
}
.buscador {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  max-width: 320px;
  padding: 0 0.8rem;
  border: 1px solid var(--color-borde);
  border-radius: var(--radio);
  background: var(--color-superficie);
  color: var(--color-texto-2);
}
.buscador:focus-within {
  border-color: var(--color-primario);
}
.buscador input {
  flex: 1;
  min-width: 0;
  padding: 0.65rem 0;
  border: none;
  outline: none;
  background: transparent;
  color: var(--color-texto);
  font: inherit;
}
.grilla {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.25rem;
}
.tarjeta {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  min-height: 170px;
  padding: 1.25rem;
  border: 1px solid var(--color-borde);
  border-radius: 14px;
  background: var(--color-superficie);
  color: var(--color-texto);
  text-decoration: none;
  transition: border-color 0.15s, transform 0.15s;
}
.tarjeta:hover {
  border-color: var(--color-primario);
  text-decoration: none;
  transform: translateY(-2px);
}
.tarjeta h2 {
  margin: 0;
  font-size: 1.05rem;
}
.descripcion {
  flex: 1;
  margin: 0;
  color: var(--color-texto-2);
  font-size: 0.9rem;
  line-height: 1.45;
}
.tarjeta footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}
.meta {
  color: var(--color-texto-2);
  font-size: 0.8rem;
}
.nueva {
  align-items: center;
  justify-content: center;
  border-style: dashed;
  background: transparent;
  color: var(--color-texto-2);
  font: inherit;
  cursor: pointer;
}
.nueva-icono {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border: 1px solid var(--color-borde);
  border-radius: 50%;
}
.vacio {
  color: var(--color-texto-2);
}
@media (max-width: 768px) {
  .pagina {
    padding: 1rem;
  }
  .herramientas {
    flex-direction: column;
  }
  .buscador {
    max-width: none;
  }
}
</style>
