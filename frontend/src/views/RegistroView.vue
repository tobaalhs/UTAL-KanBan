<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import AuthLayout from '../components/AuthLayout.vue'
import { useAuthStore } from '../stores/auth'
import { mensajeDeError } from '../api/http'

const auth = useAuthStore()
const router = useRouter()

const form = reactive({ nombre: '', email: '', password: '', confirmar: '' })
const error = ref('')
const cargando = ref(false)

const enviar = async () => {
  error.value = ''
  if (form.password.length < 6) {
    error.value = 'La contraseña debe tener al menos 6 caracteres'
    return
  }
  if (form.password !== form.confirmar) {
    error.value = 'Las contraseñas no coinciden'
    return
  }
  cargando.value = true
  try {
    await auth.registro(form.nombre, form.email, form.password)
    router.push({ name: 'login', query: { registrado: '1' } })
  } catch (e) {
    error.value = mensajeDeError(e, 'No se pudo crear la cuenta')
  } finally {
    cargando.value = false
  }
}
</script>

<template>
  <AuthLayout titulo="Crear cuenta" subtitulo="Organiza tus tareas en equipo">
    <form class="form" @submit.prevent="enviar">
      <p v-if="error" class="alerta alerta-error" role="alert">{{ error }}</p>

      <div class="campo">
        <label for="nombre">Nombre de usuario</label>
        <input id="nombre" v-model.trim="form.nombre" type="text" autocomplete="name" required />
      </div>
      <div class="campo">
        <label for="email">Correo electrónico</label>
        <input id="email" v-model.trim="form.email" type="email" autocomplete="email" required />
      </div>
      <div class="campo">
        <label for="password">Contraseña</label>
        <input id="password" v-model="form.password" type="password" autocomplete="new-password" required />
      </div>
      <div class="campo">
        <label for="confirmar">Confirmar contraseña</label>
        <input id="confirmar" v-model="form.confirmar" type="password" autocomplete="new-password" required />
      </div>

      <button class="btn btn-primario" type="submit" :disabled="cargando">
        {{ cargando ? 'Creando cuenta...' : 'Registrarse' }}
      </button>
      <p class="cambiar">¿Ya tienes cuenta? <RouterLink :to="{ name: 'login' }">Inicia sesión</RouterLink></p>
    </form>
  </AuthLayout>
</template>

<style scoped>
.form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.cambiar {
  margin: 0;
  text-align: center;
  font-size: 0.9rem;
  color: var(--color-texto-2);
}
</style>
