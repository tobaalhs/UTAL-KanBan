<script setup>
import Icono from './Icono.vue'
import { useNotificacionesStore } from '../stores/notificaciones'

const notificaciones = useNotificacionesStore()
</script>

<template>
  <div class="notificaciones" aria-live="polite">
    <TransitionGroup name="toast">
      <p
        v-for="n in notificaciones.lista"
        :key="n.id"
        class="toast"
        :class="n.tipo"
        role="status"
        @click="notificaciones.cerrar(n.id)"
      >
        <Icono :nombre="n.tipo === 'error' ? 'alerta' : 'exito'" :tamano="18" />
        <span>{{ n.mensaje }}</span>
      </p>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.notificaciones {
  position: fixed;
  right: 1.25rem;
  bottom: 1.25rem;
  left: 1.25rem;
  z-index: 60;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
  pointer-events: none;
}
.toast {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  max-width: 380px;
  margin: 0;
  padding: 0.75rem 1rem;
  border: 1px solid var(--color-borde-fuerte);
  border-radius: 12px;
  background: var(--color-superficie-2);
  box-shadow: var(--sombra-elevada);
  color: var(--color-texto);
  font-size: 0.875rem;
  pointer-events: auto;
  cursor: pointer;
}
.toast svg {
  flex-shrink: 0;
}
.error svg {
  color: var(--color-error);
}
.exito svg {
  color: var(--color-exito);
}
.toast-enter-active,
.toast-leave-active {
  transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.98);
}
</style>
