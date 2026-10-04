<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import AvatarUsuario from './AvatarUsuario.vue'
import Icono from './Icono.vue'
import ListaNotificaciones from './ListaNotificaciones.vue'
import LogoMarca from './LogoMarca.vue'

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
      <RouterLink :to="{ name: 'tableros' }" class="logo" aria-label="Utal KanBan, ir a mis tableros">
        <LogoMarca :tamano="30" />
      </RouterLink>

      <nav>
        <span class="seccion">Espacio de trabajo</span>
        <template v-for="item in navegacion" :key="item.nombre">
          <RouterLink v-if="item.ruta" :to="item.ruta" class="nav-item">
            <Icono :nombre="item.icono" :tamano="17" />
            <span>{{ item.nombre }}</span>
          </RouterLink>
          <span v-else class="nav-item deshabilitado" title="Próximamente">
            <Icono :nombre="item.icono" :tamano="17" />
            <span>{{ item.nombre }}</span>
            <small class="pronto">Pronto</small>
          </span>
        </template>
      </nav>

      <div class="usuario">
        <AvatarUsuario v-if="auth.usuario" :usuario="auth.usuario" :tamano="34" />
        <div class="usuario-datos">
          <strong>{{ auth.usuario?.nombre }}</strong>
          <small>{{ auth.usuario?.email }}</small>
        </div>
        <button class="btn-icono" title="Cerrar sesión" aria-label="Cerrar sesión" @click="cerrarSesion">
          <Icono nombre="salir" :tamano="17" />
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
  grid-template-columns: 248px 1fr;
  min-height: 100vh;
  background:
    radial-gradient(60% 50% at 100% 0%, rgb(99 102 241 / 0.07), transparent 70%),
    var(--color-fondo);
}
.lateral {
  position: sticky;
  top: 0;
  height: 100vh;
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
  padding: 1.2rem 0.85rem 1rem;
  border-right: 1px solid var(--color-borde);
  background: rgb(21 23 34 / 0.7);
}
.logo {
  padding: 0 0.45rem;
}
nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}
.seccion {
  padding: 0 0.7rem 0.5rem;
  color: var(--color-texto-3);
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.nav-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.7rem;
  height: 38px;
  padding: 0 0.7rem;
  border-radius: 8px;
  color: var(--color-texto-2);
  font-size: 0.9rem;
  font-weight: 500;
  transition: background var(--transicion), color var(--transicion);
}
a.nav-item:hover {
  background: var(--color-superficie-2);
  color: var(--color-texto);
}
.nav-item.router-link-active {
  background: var(--color-superficie-2);
  color: var(--color-texto);
}
.nav-item.router-link-active::before {
  content: '';
  position: absolute;
  left: -0.85rem;
  top: 9px;
  bottom: 9px;
  width: 3px;
  border-radius: 0 3px 3px 0;
  background: var(--color-primario);
}
.nav-item.router-link-active svg {
  color: var(--color-primario-claro);
}
.deshabilitado {
  color: var(--color-texto-3);
  cursor: default;
}
.pronto {
  margin-left: auto;
  padding: 0 0.4rem;
  border: 1px solid var(--color-borde-fuerte);
  border-radius: 5px;
  font-size: 0.65rem;
  line-height: 16px;
}
.usuario {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.6rem;
  border: 1px solid var(--color-borde);
  border-radius: 12px;
  background: var(--color-superficie);
}
.usuario-datos {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
  line-height: 1.3;
}
.usuario-datos strong {
  font-size: 0.875rem;
}
.usuario-datos small {
  color: var(--color-texto-3);
  font-size: 0.75rem;
}
.usuario-datos strong,
.usuario-datos small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
    position: sticky;
    z-index: 10;
    height: auto;
    flex-direction: row;
    align-items: center;
    gap: 0.5rem;
    padding: 0.6rem 1rem;
    border-right: none;
    border-bottom: 1px solid var(--color-borde);
    background: rgb(13 15 24 / 0.85);
    backdrop-filter: blur(10px);
  }
  .logo :deep(.texto),
  .seccion,
  .nav-item span,
  .deshabilitado,
  .usuario-datos {
    display: none;
  }
  nav {
    flex-direction: row;
  }
  .nav-item.router-link-active::before {
    display: none;
  }
  .usuario {
    padding: 0;
    border: none;
    background: none;
  }
}
</style>
