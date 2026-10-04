<script setup>
import { computed } from 'vue'

// Barras tipo "señal": 3 barras = Alta, 2 = Media, 1 = Baja
const props = defineProps({
  prioridad: { type: String, required: true },
  conTexto: { type: Boolean, default: true },
})

const niveles = { Alta: 3, Media: 2, Baja: 1 }
const nivel = computed(() => niveles[props.prioridad] ?? 0)
const clase = computed(() => `prioridad-${props.prioridad.toLowerCase()}`)
</script>

<template>
  <span class="prioridad" :class="clase" :title="`Prioridad ${prioridad.toLowerCase()}`">
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
      <rect x="1" y="8" width="3" height="5" rx="1" :class="{ activa: nivel >= 1 }" />
      <rect x="5.5" y="5" width="3" height="8" rx="1" :class="{ activa: nivel >= 2 }" />
      <rect x="10" y="2" width="3" height="11" rx="1" :class="{ activa: nivel >= 3 }" />
    </svg>
    <span v-if="conTexto">{{ prioridad }}</span>
  </span>
</template>

<style scoped>
.prioridad {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--tono);
}
rect {
  fill: var(--color-superficie-3);
}
rect.activa {
  fill: var(--tono);
}
.prioridad-alta {
  --tono: #f87171;
}
.prioridad-media {
  --tono: #facc15;
}
.prioridad-baja {
  --tono: #4ade80;
}
</style>
