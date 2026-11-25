<script setup>
import { computed } from 'vue'
import { colorUsuario } from '../utils/colorUsuario'

const props = defineProps({
  usuario: { type: Object, required: true },
  tamano: { type: Number, default: 26 },
})

const color = computed(() => colorUsuario(props.usuario._id))
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
