<script setup>
import AvatarUsuario from './AvatarUsuario.vue'

defineProps({
  usuarios: { type: Array, required: true },
  maximo: { type: Number, default: 4 },
  tamano: { type: Number, default: 26 },
})
</script>

<template>
  <div class="grupo">
    <AvatarUsuario v-for="u in usuarios.slice(0, maximo)" :key="u._id" :usuario="u" :tamano="tamano" />
    <span v-if="usuarios.length > maximo" class="extra" :style="{ width: `${tamano}px`, height: `${tamano}px` }">
      +{{ usuarios.length - maximo }}
    </span>
  </div>
</template>

<style scoped>
.grupo {
  display: flex;
}
.grupo > * + * {
  margin-left: -8px;
}
.extra {
  display: inline-grid;
  place-items: center;
  border-radius: 50%;
  border: 2px solid var(--color-superficie);
  background: var(--color-superficie-2);
  color: var(--color-texto-2);
  font-size: 0.7rem;
  font-weight: 700;
}
</style>
