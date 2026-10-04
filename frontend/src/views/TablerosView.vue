<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()

const cerrarSesion = () => {
  auth.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <main class="tableros">
    <header class="barra">
      <h1>Mis tableros</h1>
      <div class="usuario">
        <span>Hola, {{ auth.usuario?.nombre }}</span>
        <button class="btn btn-secundario" @click="cerrarSesion">Cerrar sesión</button>
      </div>
    </header>
    <!-- TODO: listar tableros cuando exista el endpoint /api/tableros -->
    <p class="vacio">Aún no hay tableros.</p>
  </main>
</template>

<style scoped>
.tableros {
  max-width: 1100px;
  margin: 0 auto;
  padding: 1.5rem 1rem;
}
.barra {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: space-between;
  align-items: center;
}
.barra h1 {
  margin: 0;
  font-size: 1.5rem;
}
.usuario {
  display: flex;
  align-items: center;
  gap: 1rem;
  color: var(--color-texto-2);
}
.vacio {
  color: var(--color-texto-2);
}
</style>
