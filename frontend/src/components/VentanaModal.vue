<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import Icono from './Icono.vue'

defineProps({
  titulo: { type: String, required: true },
})
const emit = defineEmits(['cerrar'])

const alPresionar = (e) => {
  if (e.key === 'Escape') emit('cerrar')
}
const modal = ref(null)
onMounted(() => {
  window.addEventListener('keydown', alPresionar)
  // `autofocus` no funciona en elementos agregados despues de cargar la pagina
  modal.value.querySelector('input, textarea, select')?.focus()
})
onUnmounted(() => window.removeEventListener('keydown', alPresionar))
</script>

<template>
  <Teleport to="body">
    <div class="fondo" @mousedown.self="emit('cerrar')">
      <section ref="modal" class="modal" role="dialog" aria-modal="true" :aria-label="titulo">
        <header>
          <h2>{{ titulo }}</h2>
          <button class="btn-icono" type="button" aria-label="Cerrar" @click="emit('cerrar')">
            <Icono nombre="cerrar" />
          </button>
        </header>
        <slot />
      </section>
    </div>
  </Teleport>
</template>

<style scoped>
.fondo {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: grid;
  place-items: center;
  padding: 1rem;
  background: rgb(5 6 12 / 0.7);
  backdrop-filter: blur(2px);
}
.modal {
  width: 100%;
  max-width: 460px;
  max-height: calc(100vh - 2rem);
  overflow-y: auto;
  padding: 1.5rem;
  border-radius: 14px;
  border: 1px solid var(--color-borde);
  background: var(--color-superficie);
}
header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
}
h2 {
  margin: 0;
  font-size: 1.15rem;
}
</style>
