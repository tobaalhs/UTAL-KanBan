<script setup>
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AuthLayout from '../components/AuthLayout.vue'
import { useAuthStore } from '../stores/auth'
import { mensajeDeError } from '../api/http'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const form = reactive({ email: '', password: '', recordar: false })
const error = ref('')
const cargando = ref(false)

const enviar = async () => {
  error.value = ''
  cargando.value = true
  try {
    await auth.login(form.email, form.password, form.recordar)
    router.push(route.query.redirect || { name: 'tableros' })
  } catch (e) {
    error.value = mensajeDeError(e, 'No se pudo iniciar sesión')
  } finally {
    cargando.value = false
  }
}
</script>

<template>
  <AuthLayout titulo="Iniciar sesión" subtitulo="Bienvenido de vuelta">
    <form class="form" @submit.prevent="enviar">
      <p v-if="route.query.registrado" class="alerta alerta-exito">Cuenta creada, ya puedes iniciar sesión.</p>
      <p v-if="error" class="alerta alerta-error" role="alert">{{ error }}</p>

      <div class="campo">
        <label for="email">Correo electrónico</label>
        <input id="email" v-model.trim="form.email" type="email" autocomplete="email" required />
      </div>
      <div class="campo">
        <label for="password">Contraseña</label>
        <input id="password" v-model="form.password" type="password" autocomplete="current-password" required />
      </div>
      <label class="recordar">
        <input v-model="form.recordar" type="checkbox" />
        Recordar sesión
      </label>

      <button class="btn btn-primario" type="submit" :disabled="cargando">
        {{ cargando ? 'Ingresando...' : 'Iniciar sesión' }}
      </button>
      <p class="cambiar">¿No tienes cuenta? <RouterLink :to="{ name: 'registro' }">Regístrate</RouterLink></p>
    </form>
  </AuthLayout>
</template>

<style scoped>
.form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.recordar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: var(--color-texto-2);
  cursor: pointer;
}
.recordar input {
  accent-color: var(--color-primario);
}
.cambiar {
  margin: 0;
  text-align: center;
  font-size: 0.9rem;
  color: var(--color-texto-2);
}
</style>
