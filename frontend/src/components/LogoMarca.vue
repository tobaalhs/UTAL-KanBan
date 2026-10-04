<script setup>
defineProps({
  tamano: { type: Number, default: 30 },
  conTexto: { type: Boolean, default: true },
})
</script>

<template>
  <span class="marca">
    <svg :width="tamano" :height="tamano" viewBox="0 0 32 32" aria-hidden="true">
      <defs>
        <linearGradient id="logo-gradiente" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#818cf8" />
          <stop offset="1" stop-color="#4f46e5" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#logo-gradiente)" />
      <rect x="7" y="7" width="5" height="18" rx="2" fill="#fff" />
      <rect x="13.5" y="7" width="5" height="11" rx="2" fill="#fff" fill-opacity=".75" />
      <rect x="20" y="7" width="5" height="14" rx="2" fill="#fff" fill-opacity=".5" />
    </svg>
    <span v-if="conTexto" class="texto">Utal <strong>KanBan</strong></span>
  </span>
</template>

<style scoped>
.marca {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
}
.texto {
  font-size: 1.05rem;
  font-weight: 500;
  letter-spacing: -0.01em;
  color: var(--color-texto);
}
.texto strong {
  font-weight: 700;
}
</style>
