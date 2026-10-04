<script setup>
import Icono from './Icono.vue'
import PrioridadIndicador from './PrioridadIndicador.vue'
import { fechaCorta } from '../utils/fechas'

defineProps({
  tarea: { type: Object, required: true },
})
defineEmits(['editar'])
</script>

<template>
  <article
    class="tarea"
    :class="{ terminada: tarea.estado === 'Terminado' }"
    tabindex="0"
    @click="$emit('editar')"
    @keydown.enter="$emit('editar')"
  >
    <h3>{{ tarea.titulo }}</h3>
    <p v-if="tarea.descripcion">{{ tarea.descripcion }}</p>
    <footer>
      <PrioridadIndicador :prioridad="tarea.prioridad" />
      <span class="fecha">
        <Icono nombre="calendario" :tamano="12" />
        {{ fechaCorta(tarea.createdAt) }}
      </span>
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
.fecha {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  color: var(--color-texto-3);
  font-size: 0.75rem;
}
</style>
