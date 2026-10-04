<script setup>
import { computed } from 'vue'

const props = defineProps({
  usuario: { type: Object, required: true },
  tamano: { type: Number, default: 26 },
})

const colores = ['#f59e0b', '#ec4899', '#0ea5e9', '#8b5cf6', '#14b8a6', '#f97316', '#6366f1']

// El mismo usuario siempre obtiene el mismo color
const color = computed(() => {
  const id = props.usuario._id || ''
  const hash = [...id].reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return colores[hash % colores.length]
})
</script>

<template>
  <span
    class="avatar"
    :title="usuario.nombre"
    :style="{ background: color, width: `${tamano}px`, height: `${tamano}px`, fontSize: `${tamano * 0.42}px` }"
  >
    {{ usuario.nombre?.charAt(0).toUpperCase() }}
  </span>
</template>

<style scoped>
.avatar {
  display: inline-grid;
  place-items: center;
  flex-shrink: 0;
  border-radius: 50%;
  border: 2px solid var(--color-superficie);
  color: #fff;
  font-weight: 700;
}
</style>
