<script setup>
import { computed } from 'vue'
import AvatarUsuario from './AvatarUsuario.vue'
import Icono from './Icono.vue'
import PrioridadIndicador from './PrioridadIndicador.vue'
import { fechaCorta } from '../utils/fechas'
import { colorUsuario } from '../utils/colorUsuario'

const props = defineProps({
  tarea: { type: Object, required: true },
  // Miembro que esta arrastrando esta tarjeta en otra pantalla (tiempo real)
  arrastradaPor: { type: Object, default: null },
})
defineEmits(['editar'])

const MAX_ETIQUETAS = 3

const subtareasResumen = computed(() => {
  const lista = props.tarea.subtareas || []
  if (!lista.length) return null
  const completadas = lista.filter((s) => s.completada).length
  return { completadas, total: lista.length, todas: completadas === lista.length }
})
</script>

<template>
  <article
    class="tarea"
    :class="{ terminada: tarea.estado === 'Terminado', remota: arrastradaPor }"
    :style="arrastradaPor ? { '--color-remoto': colorUsuario(arrastradaPor._id) } : null"
    tabindex="0"
    @click="$emit('editar')"
    @keydown.enter="$emit('editar')"
  >
    <span v-if="arrastradaPor" class="marca-remota">{{ arrastradaPor.nombre }}</span>
    <h3>{{ tarea.titulo }}</h3>
    <p v-if="tarea.descripcion">{{ tarea.descripcion }}</p>
    <div v-if="tarea.etiquetas?.length" class="etiquetas">
      <span v-for="etiqueta in tarea.etiquetas.slice(0, MAX_ETIQUETAS)" :key="etiqueta" class="etiqueta">
        {{ etiqueta }}
      </span>
      <span v-if="tarea.etiquetas.length > MAX_ETIQUETAS" class="etiqueta extra">
        +{{ tarea.etiquetas.length - MAX_ETIQUETAS }}
      </span>
    </div>
    <footer>
      <PrioridadIndicador :prioridad="tarea.prioridad" />
      <div class="derecha">
        <span
          v-if="subtareasResumen"
          class="subtareas-badge"
          :class="{ completas: subtareasResumen.todas }"
          title="Subtareas completadas"
        >
          <Icono nombre="tareas" :tamano="12" />
          {{ subtareasResumen.completadas }}/{{ subtareasResumen.total }}
        </span>
        <span class="fecha">
          <Icono nombre="calendario" :tamano="12" />
          {{ fechaCorta(tarea.createdAt) }}
        </span>
        <AvatarUsuario v-if="tarea.asignado" :usuario="tarea.asignado" :tamano="24" />
      </div>
    </footer>
  </article>
</template>

<style scoped>
.tarea {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: 0.85rem 0.9rem 0.75rem;
  border: 1px solid var(--color-borde);
  border-radius: var(--radio);
  background: var(--color-superficie-2);
  box-shadow: var(--sombra);
  cursor: grab;
  user-select: none;
  transition: border-color var(--transicion), transform var(--transicion), background var(--transicion);
}
.tarea.remota {
  position: relative;
  border-color: var(--color-remoto);
  box-shadow: 0 0 0 1px var(--color-remoto);
  opacity: 0.75;
}
.marca-remota {
  position: absolute;
  top: -1px;
  right: 10px;
  max-width: 70%;
  overflow: hidden;
  padding: 0.05rem 0.5rem 0.1rem;
  border-radius: 0 0 6px 6px;
  background: var(--color-remoto);
  color: #fff;
  font-size: 0.68rem;
  font-weight: 600;
  line-height: 1.4;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.tarea:hover {
  border-color: var(--color-borde-fuerte);
  background: #1f2235;
}
.tarea:focus-visible {
  outline: none;
  border-color: var(--color-primario);
}
.tarea:active {
  cursor: grabbing;
}
h3 {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 600;
  line-height: 1.35;
}
.terminada h3 {
  color: var(--color-texto-2);
  text-decoration: line-through;
  text-decoration-color: var(--color-texto-3);
}
p {
  margin: 0;
  color: var(--color-texto-2);
  font-size: 0.8rem;
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.35rem;
  padding-top: 0.6rem;
  border-top: 1px solid var(--color-borde);
}
.derecha {
  display: flex;
  align-items: center;
  gap: 0.55rem;
}
.fecha {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  color: var(--color-texto-3);
  font-size: 0.75rem;
}
.etiquetas {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-top: 0.15rem;
}
.etiqueta {
  padding: 0.12rem 0.5rem;
  border-radius: 999px;
  border: 1px solid rgb(99 102 241 / 0.28);
  background: rgb(99 102 241 / 0.12);
  color: var(--color-primario-claro);
  font-size: 0.7rem;
  font-weight: 500;
}
.etiqueta.extra {
  border-color: var(--color-borde-fuerte);
  background: var(--color-superficie-3);
  color: var(--color-texto-2);
}
.subtareas-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  color: var(--color-texto-2);
  font-size: 0.75rem;
  font-variant-numeric: tabular-nums;
}
.subtareas-badge.completas {
  color: var(--estado-terminado);
}
</style>
