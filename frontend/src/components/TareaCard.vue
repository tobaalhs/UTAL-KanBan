<script setup>
import Icono from './Icono.vue'
import { fechaCorta } from '../utils/fechas'

defineProps({
  tarea: { type: Object, required: true },
})
defineEmits(['editar'])
</script>

<template>
  <article class="tarea" tabindex="0" @click="$emit('editar')" @keydown.enter="$emit('editar')">
    <span class="prioridad" :class="`prioridad-${tarea.prioridad.toLowerCase()}`">● {{ tarea.prioridad }}</span>
    <h3>{{ tarea.titulo }}</h3>
    <p v-if="tarea.descripcion">{{ tarea.descripcion }}</p>
    <footer>
      <Icono nombre="calendario" :tamano="13" />
      {{ fechaCorta(tarea.createdAt) }}
    </footer>
  </article>
</template>

<style scoped>
.tarea {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  padding: 0.9rem;
  border: 1px solid var(--color-borde);
  border-radius: var(--radio);
  background: var(--color-superficie-2);
  cursor: grab;
  transition: border-color 0.15s;
}
.tarea:hover,
.tarea:focus-visible {
  border-color: var(--color-primario);
  outline: none;
}
.prioridad {
  align-self: flex-start;
  padding: 0.15rem 0.5rem;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}
.prioridad-alta {
  background: rgb(239 68 68 / 0.15);
  color: var(--color-error);
}
.prioridad-media {
  background: rgb(234 179 8 / 0.15);
  color: var(--color-alerta);
}
.prioridad-baja {
  background: rgb(34 197 94 / 0.15);
  color: var(--color-exito);
}
h3 {
  margin: 0;
  font-size: 0.95rem;
}
p {
  margin: 0;
  color: var(--color-texto-2);
  font-size: 0.82rem;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
footer {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  color: var(--color-texto-2);
  font-size: 0.75rem;
}
</style>
