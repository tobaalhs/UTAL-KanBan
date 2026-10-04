<script setup>
import { useNotificacionesStore } from '../stores/notificaciones'

const notificaciones = useNotificacionesStore()
</script>

<template>
  <div class="notificaciones" aria-live="polite">
    <TransitionGroup name="toast">
      <p
        v-for="n in notificaciones.lista"
        :key="n.id"
        class="alerta"
        :class="n.tipo === 'error' ? 'alerta-error' : 'alerta-exito'"
        role="status"
        @click="notificaciones.cerrar(n.id)"
      >
        {{ n.mensaje }}
      </p>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.notificaciones {
  position: fixed;
  right: 1rem;
  bottom: 1rem;
  left: 1rem;
  z-index: 60;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
  pointer-events: none;
}
.alerta {
  margin: 0;
  max-width: 360px;
  background-color: var(--color-superficie);
  box-shadow: 0 8px 24px rgb(0 0 0 / 0.4);
  pointer-events: auto;
  cursor: pointer;
}
.toast-enter-active,
.toast-leave-active {
  transition: all 0.2s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
