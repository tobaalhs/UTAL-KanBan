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
  background: rgb(5 6 12 / 0.65);
  backdrop-filter: blur(4px);
  animation: aparecer 0.15s ease-out;
}
.modal {
  width: 100%;
  max-width: 480px;
  max-height: calc(100vh - 2rem);
  overflow-y: auto;
  padding: 1.4rem 1.5rem 1.5rem;
  border-radius: 16px;
  border: 1px solid var(--color-borde-fuerte);
  background: var(--color-superficie);
  box-shadow: var(--sombra-elevada);
  animation: entrar 0.2s cubic-bezier(0.2, 0.9, 0.3, 1.2);
}
@keyframes aparecer {
  from {
    opacity: 0;
  }
}
@keyframes entrar {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.97);
  }
}
header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
}
h2 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
}
</style>
