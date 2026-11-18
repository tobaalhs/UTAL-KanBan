<script setup>
import { computed, onMounted, ref } from 'vue'
import AvatarUsuario from '../components/AvatarUsuario.vue'
import Icono from '../components/Icono.vue'
import { useAuthStore } from '../stores/auth'
import { useResumenStore } from '../stores/resumen'

const auth = useAuthStore()
const resumen = useResumenStore()
const busqueda = ref('')

onMounted(resumen.cargar)

const filtrados = computed(() => {
  const texto = busqueda.value.trim().toLowerCase()
  if (!texto) return resumen.miembros
  return resumen.miembros.filter((m) => m.nombre.toLowerCase().includes(texto) || m.email.toLowerCase().includes(texto))
})

const MAX_TABLEROS = 3
</script>

<template>
  <div class="pagina">
    <header class="encabezado">
      <div>
        <p class="subtitulo">Personas con las que colaboras</p>
        <h1>Miembros <span v-if="resumen.cargado" class="contador">{{ resumen.miembros.length }}</span></h1>
      </div>
      <label class="buscador">
        <Icono nombre="buscar" :tamano="16" />
        <input v-model="busqueda" type="search" placeholder="Buscar por nombre o correo" aria-label="Buscar miembros" />
      </label>
    </header>

    <p v-if="resumen.error" class="alerta alerta-error">
      <Icono nombre="alerta" :tamano="16" />{{ resumen.error }}
    </p>

    <div v-else-if="!resumen.cargado" class="cargando"><span class="spinner" aria-hidden="true"></span> Cargando miembros...</div>

    <p v-else-if="!resumen.miembros.length" class="nota">
      Aún no participas en ningún tablero. Crea uno o pide que te inviten.
    </p>

    <p v-else-if="!filtrados.length" class="nota">No hay miembros que coincidan con "{{ busqueda }}".</p>

    <ul v-else class="grilla">
      <li v-for="m in filtrados" :key="m._id" class="tarjeta">
        <div class="persona">
          <AvatarUsuario :usuario="m" :tamano="44" />
          <div class="persona-datos">
            <strong>
              {{ m.nombre }}
              <span v-if="m._id === auth.usuario?._id" class="tu">Tú</span>
            </strong>
            <small>{{ m.email }}</small>
          </div>
        </div>

        <dl class="cifras">
          <div>
            <dt>Tableros</dt>
            <dd>{{ m.tableros.length }}</dd>
          </div>
          <div>
            <dt>Tareas</dt>
            <dd>{{ m.asignadas }}</dd>
          </div>
          <div>
            <dt>Terminadas</dt>
            <dd>{{ m.terminadas }}</dd>
          </div>
        </dl>

        <div class="tableros">
          <RouterLink
            v-for="t in m.tableros.slice(0, MAX_TABLEROS)"
            :key="t._id"
            :to="{ name: 'tablero', params: { id: t._id } }"
            class="chip"
            :title="t.nombre"
          >
            {{ t.nombre }}
          </RouterLink>
          <span v-if="m.tableros.length > MAX_TABLEROS" class="chip extra">+{{ m.tableros.length - MAX_TABLEROS }}</span>
        </div>
      </li>
    </ul>
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
.subtitulo {
  margin: 0 0 0.2rem;
  color: var(--color-texto-2);
  font-size: 0.875rem;
}
h1 {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin: 0;
  font-size: 1.6rem;
  font-weight: 700;
}
.contador {
  padding: 0 0.55rem;
  border-radius: 8px;
  background: var(--color-superficie-2);
  color: var(--color-texto-2);
  font-size: 0.85rem;
  font-weight: 600;
  line-height: 24px;
}
.buscador {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 280px;
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
.cargando {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  color: var(--color-texto-2);
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
.nota {
  color: var(--color-texto-2);
}

.grilla {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
  gap: 1rem;
  margin: 0;
  padding: 0;
  list-style: none;
}
.tarjeta {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.2rem;
  border: 1px solid var(--color-borde);
  border-radius: var(--radio-grande);
  background: var(--color-superficie);
}
.persona {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}
.persona-datos {
  display: flex;
  flex-direction: column;
  min-width: 0;
  line-height: 1.35;
}
.persona-datos strong {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.95rem;
}
.persona-datos small {
  overflow: hidden;
  color: var(--color-texto-3);
  text-overflow: ellipsis;
  white-space: nowrap;
}
.tu {
  padding: 0 0.4rem;
  border-radius: 5px;
  background: rgb(99 102 241 / 0.16);
  color: var(--color-primario-claro);
  font-size: 0.68rem;
  font-weight: 600;
  line-height: 18px;
}
.cifras {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
  margin: 0;
  padding: 0.75rem 0;
  border-block: 1px solid var(--color-borde);
  text-align: center;
}
.cifras dt {
  color: var(--color-texto-3);
  font-size: 0.72rem;
}
.cifras dd {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.tableros {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}
.chip {
  max-width: 100%;
  padding: 0 0.6rem;
  border: 1px solid var(--color-borde-fuerte);
  border-radius: 999px;
  color: var(--color-texto-2);
  font-size: 0.75rem;
  line-height: 22px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: border-color var(--transicion), color var(--transicion);
}
a.chip:hover {
  border-color: var(--color-primario);
  color: var(--color-texto);
}
.extra {
  color: var(--color-texto-3);
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
    width: auto;
  }
}
</style>
