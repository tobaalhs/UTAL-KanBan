<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import AvatarUsuario from './AvatarUsuario.vue'
import Icono from './Icono.vue'
import ListaNotificaciones from './ListaNotificaciones.vue'

const auth = useAuthStore()
const router = useRouter()

// Dashboard, Miembros y Ajustes aparecen en el mockup pero aun no estan en el alcance
const navegacion = [
  { nombre: 'Dashboard', icono: 'dashboard' },
  { nombre: 'Mis tableros', icono: 'tableros', ruta: { name: 'tableros' } },
  { nombre: 'Miembros', icono: 'miembros' },
  { nombre: 'Ajustes', icono: 'ajustes' },
]

const cerrarSesion = () => {
  auth.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="app">
    <aside class="lateral">
      <RouterLink :to="{ name: 'tableros' }" class="logo">
        <span class="logo-icono" aria-hidden="true"><i></i><i></i><i></i></span>
        <span>Utal <strong>KanBan</strong></span>
      </RouterLink>

      <nav>
        <template v-for="item in navegacion" :key="item.nombre">
          <RouterLink v-if="item.ruta" :to="item.ruta" class="nav-item">
            <Icono :nombre="item.icono" />
            <span>{{ item.nombre }}</span>
          </RouterLink>
          <span v-else class="nav-item deshabilitado" title="Próximamente">
            <Icono :nombre="item.icono" />
            <span>{{ item.nombre }}</span>
          </span>
        </template>
      </nav>

      <div class="usuario">
        <AvatarUsuario v-if="auth.usuario" :usuario="auth.usuario" :tamano="32" />
        <div class="usuario-datos">
          <strong>{{ auth.usuario?.nombre }}</strong>
          <small>{{ auth.usuario?.email }}</small>
        </div>
        <button class="btn-icono" title="Cerrar sesión" aria-label="Cerrar sesión" @click="cerrarSesion">
          <Icono nombre="salir" />
        </button>
      </div>
    </aside>

    <main class="contenido">
      <RouterView />
    </main>

    <ListaNotificaciones />
  </div>
</template>

<style scoped>
.app {
  display: grid;
  grid-template-columns: 240px 1fr;
  min-height: 100vh;
}
.lateral {
  position: sticky;
  top: 0;
  height: 100vh;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1.25rem 0.9rem;
  border-right: 1px solid var(--color-borde);
  background: var(--color-superficie);
}
.logo {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0 0.4rem;
  font-size: 1.1rem;
  color: var(--color-texto);
  text-decoration: none;
}
.logo strong {
  color: var(--color-primario-claro);
}
.logo-icono {
  display: inline-flex;
  gap: 3px;
  padding: 6px;
  border-radius: 8px;
  background: var(--color-primario);
}
.logo-icono i {
  width: 4px;
  border-radius: 2px;
  background: #fff;
}
.logo-icono i:nth-child(1) { height: 14px; }
.logo-icono i:nth-child(2) { height: 9px; }
.logo-icono i:nth-child(3) { height: 11px; }

nav {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
}
.nav-item {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.6rem 0.75rem;
  border-radius: 8px;
  color: var(--color-texto-2);
  text-decoration: none;
  font-size: 0.95rem;
}
a.nav-item:hover {
  background: var(--color-superficie-2);
  color: var(--color-texto);
}
.nav-item.router-link-active {
  background: rgb(99 102 241 / 0.15);
  color: var(--color-primario-claro);
}
.deshabilitado {
  opacity: 0.45;
  cursor: not-allowed;
}
.usuario {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.75rem 0.4rem 0;
  border-top: 1px solid var(--color-borde);
}
.usuario-datos {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}
.usuario-datos strong,
.usuario-datos small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.usuario-datos small {
  color: var(--color-texto-2);
}
.contenido {
  min-width: 0;
}

/* En movil la barra lateral pasa a ser una barra superior */
@media (max-width: 768px) {
  .app {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr;
  }
  .lateral {
    position: static;
    height: auto;
    flex-direction: row;
    align-items: center;
    gap: 0.5rem;
    padding: 0.6rem 1rem;
    border-right: none;
    border-bottom: 1px solid var(--color-borde);
  }
  .logo > span:last-child,
  .nav-item span,
  .deshabilitado,
  .usuario-datos {
    display: none;
  }
  nav {
    flex-direction: row;
  }
  .usuario {
    padding: 0;
    border-top: none;
  }
}
</style>
