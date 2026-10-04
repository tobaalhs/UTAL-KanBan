<script setup>
import { ref } from 'vue'
import VentanaModal from './VentanaModal.vue'
import Icono from './Icono.vue'
import AvatarUsuario from './AvatarUsuario.vue'
import { mensajeDeError } from '../api/http'

// RF10-RF12: ver miembros del tablero e invitar por correo
const props = defineProps({
  tablero: { type: Object, required: true },
  invitar: { type: Function, required: true },
})
const emit = defineEmits(['cerrar'])

const email = ref('')
const error = ref('')
const exito = ref('')
const enviando = ref(false)

const enviar = async () => {
  error.value = ''
  exito.value = ''
  enviando.value = true
  try {
    await props.invitar(email.value)
    exito.value = `${email.value} fue agregado al tablero`
    email.value = ''
  } catch (e) {
    error.value = mensajeDeError(e, 'No se pudo invitar al usuario')
  } finally {
    enviando.value = false
  }
}
</script>

<template>
  <VentanaModal titulo="Miembros del tablero" @cerrar="emit('cerrar')">
    <ul class="miembros">
      <li v-for="m in tablero.miembros" :key="m._id">
        <AvatarUsuario :usuario="m" :tamano="32" />
        <div>
          <strong>{{ m.nombre }}</strong>
          <small>{{ m.email }}</small>
        </div>
        <span v-if="m._id === tablero.creador" class="creador">Creador</span>
      </li>
    </ul>

    <form class="form" @submit.prevent="enviar">
      <p v-if="error" class="alerta alerta-error" role="alert"><Icono nombre="alerta" :tamano="16" />{{ error }}</p>
      <p v-if="exito" class="alerta alerta-exito"><Icono nombre="exito" :tamano="16" />{{ exito }}</p>
      <div class="campo">
        <label for="invitar-email">Invitar por correo</label>
        <input id="invitar-email" v-model.trim="email" type="email" placeholder="correo@utal.cl" required />
      </div>
      <div class="form-acciones">
        <button type="submit" class="btn btn-primario" :disabled="enviando || !email">
          {{ enviando ? 'Invitando...' : 'Invitar' }}
        </button>
      </div>
    </form>
  </VentanaModal>
</template>

<style scoped>
.miembros {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin: 0 0 1.5rem;
  padding: 0;
  list-style: none;
}
.miembros li {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.miembros div {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}
.miembros small {
  color: var(--color-texto-2);
}
.creador {
  padding: 0.15rem 0.5rem;
  border-radius: 6px;
  background: rgb(99 102 241 / 0.15);
  color: var(--color-primario-claro);
  font-size: 0.75rem;
}
</style>
