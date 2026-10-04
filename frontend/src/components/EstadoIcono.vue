<script setup>
// Icono propio para cada estado: circulo punteado (Pendiente),
// circulo a medio llenar (En curso) y circulo con check (Terminado)
defineProps({
  estado: { type: String, required: true },
  tamano: { type: Number, default: 16 },
})
</script>

<template>
  <svg :width="tamano" :height="tamano" viewBox="0 0 16 16" fill="none" aria-hidden="true" class="estado-icono">
    <template v-if="estado === 'Pendiente'">
      <circle cx="8" cy="8" r="6.25" stroke="var(--estado-pendiente)" stroke-width="1.5" stroke-dasharray="2.6 2.3" />
    </template>
    <template v-else-if="estado === 'En curso'">
      <circle cx="8" cy="8" r="6.25" stroke="var(--estado-en-curso)" stroke-width="1.5" />
      <path d="M8 4a4 4 0 0 1 0 8z" fill="var(--estado-en-curso)" />
    </template>
    <template v-else>
      <circle cx="8" cy="8" r="7" fill="var(--estado-terminado)" />
      <path d="m5.2 8.2 1.9 1.9 3.8-4" stroke="#0d0f18" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
    </template>
  </svg>
</template>

<style scoped>
.estado-icono {
  flex-shrink: 0;
}
</style>
