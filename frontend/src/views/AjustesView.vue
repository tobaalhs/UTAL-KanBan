<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AvatarUsuario from '../components/AvatarUsuario.vue'
import Icono from '../components/Icono.vue'
import { CLAVE_SESION, useAuthStore } from '../stores/auth'
import { useResumenStore } from '../stores/resumen'

const auth = useAuthStore()
const resumen = useResumenStore()
const router = useRouter()

onMounted(resumen.cargar)

// La fecha de expiracion viene dentro del token JWT (campo `exp`, en segundos)
const expiracion = computed(() => {
  try {
    const payload = JSON.parse(atob(auth.token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    return payload.exp ? new Date(payload.exp * 1000) : null
  } catch {
    return null
  }
})
const expiracionTexto = computed(() =>
  expiracion.value ? expiracion.value.toLocaleString('es-CL', { dateStyle: 'long', timeStyle: 'short' }) : 'No disponible',
)

// "Recordar sesion" guarda la sesion en localStorage; si no, solo vive en esta pestaña
const recordada = computed(() => !!localStorage.getItem(CLAVE_SESION))

const cerrarSesion = () => {
  auth.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="pagina">
    <header class="encabezado">
      <p class="subtitulo">Tu cuenta y tu sesión</p>
      <h1>Ajustes</h1>
    </header>

    <div class="secciones">
      <section class="tarjeta">
        <h2>Perfil</h2>
        <div class="perfil">
          <AvatarUsuario v-if="auth.usuario" :usuario="auth.usuario" :tamano="64" />
          <dl class="datos">
            <div>
              <dt>Nombre</dt>
              <dd>{{ auth.usuario?.nombre }}</dd>
            </div>
            <div>
              <dt>Correo electrónico</dt>
              <dd>{{ auth.usuario?.email }}</dd>
            </div>
          </dl>
        </div>
        <p class="nota">Con este correo te pueden invitar a tableros y recibirás los avisos de la aplicación.</p>
      </section>

      <section class="tarjeta">
        <h2>Actividad</h2>
        <p v-if="resumen.error" class="alerta alerta-error"><Icono nombre="alerta" :tamano="16" />{{ resumen.error }}</p>
        <dl v-else class="cifras">
          <div>
            <dt>Tableros</dt>
            <dd>{{ resumen.cargado ? resumen.tableros.length : '–' }}</dd>
          </div>
          <div>
            <dt>Creados por ti</dt>
            <dd>{{ resumen.cargado ? resumen.tablerosCreados : '–' }}</dd>
          </div>
          <div>
            <dt>Tareas asignadas</dt>
            <dd>{{ resumen.cargado ? resumen.misTareas.length : '–' }}</dd>
          </div>
        </dl>
        <p class="nota">Solo el creador de un tablero puede eliminarlo, junto con sus tareas.</p>
      </section>

      <section class="tarjeta">
        <h2>Sesión</h2>
        <dl class="datos">
          <div>
            <dt>Expira</dt>
            <dd>{{ expiracionTexto }}</dd>
          </div>
          <div>
            <dt>Almacenamiento</dt>
            <dd>{{ recordada ? 'Recordada en este navegador' : 'Solo mientras esta pestaña esté abierta' }}</dd>
          </div>
        </dl>
        <p class="nota">Al expirar la sesión tendrás que volver a iniciar sesión.</p>
        <button class="btn btn-peligro" @click="cerrarSesion">
          <Icono nombre="salir" :tamano="16" /> Cerrar sesión
        </button>
      </section>
    </div>
  </div>
</template>

<style scoped>
.pagina {
  max-width: 920px;
  padding: 2rem 2.25rem;
}
.encabezado {
  margin-bottom: 1.5rem;
}
.subtitulo {
  margin: 0 0 0.2rem;
  color: var(--color-texto-2);
  font-size: 0.875rem;
}
h1 {
  margin: 0;
  font-size: 1.6rem;
  font-weight: 700;
}
h2 {
  margin: 0 0 1rem;
  font-size: 0.95rem;
  font-weight: 600;
}
.secciones {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
  align-items: start;
}
.tarjeta {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.2rem;
  border: 1px solid var(--color-borde);
  border-radius: var(--radio-grande);
  background: var(--color-superficie);
}
.tarjeta h2 {
  margin: 0;
}
.tarjeta .btn {
  align-self: flex-start;
}
.perfil {
  display: flex;
  align-items: center;
  gap: 1.1rem;
}
.datos {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-width: 0;
  margin: 0;
}
.datos dt {
  color: var(--color-texto-3);
  font-size: 0.75rem;
}
.datos dd {
  margin: 0;
  font-size: 0.92rem;
  overflow-wrap: anywhere;
}
.cifras {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
  margin: 0;
  text-align: center;
}
.cifras dt {
  color: var(--color-texto-3);
  font-size: 0.72rem;
}
.cifras dd {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.nota {
  margin: 0;
  color: var(--color-texto-3);
  font-size: 0.8rem;
  line-height: 1.5;
}

@media (max-width: 768px) {
  .pagina {
    padding: 1.25rem 1rem;
  }
  .secciones {
    grid-template-columns: 1fr;
  }
}
</style>
