import { computed, onScopeDispose, reactive, ref, watch } from 'vue'
import { crearConexion } from '../api/tiempoReal'
import { useAuthStore } from '../stores/auth'
import { useTareasStore } from '../stores/tareas'

// Cada cuanto se envia la posicion del cursor mientras se arrastra (ms)
const INTERVALO_ENVIO = 50

// Conecta la vista de un tablero al servidor de tiempo real:
// - aplica en el store los cambios que hacen otros miembros,
// - expone quien esta conectado (presencia) y quien esta arrastrando que tarjeta,
// - envia mis propios arrastres para que los demas los vean en vivo.
export function useTableroEnVivo(tableroId, { crear = crearConexion } = {}) {
  const auth = useAuthStore()
  const tareas = useTareasStore()

  const conectado = ref(false)
  const presentes = ref([])
  // tareaId -> { usuario, estado, x, y }
  const arrastres = reactive(new Map())

  const yo = () => auth.usuario?._id
  const otrosPresentes = computed(() =>
    presentes.value.filter((u) => u._id !== yo()),
  )

  const socket = crear(() => auth.token)
  let primeraConexion = true

  const unirse = () => {
    if (tableroId.value) socket.emit('tablero:unirse', tableroId.value)
  }

  socket.on('connect', () => {
    conectado.value = true
    unirse()
    // Al reconectar pudimos perder eventos: pedimos el estado actual
    if (!primeraConexion) tareas.refrescar().catch(() => {})
    primeraConexion = false
  })
  socket.on('disconnect', () => {
    conectado.value = false
    arrastres.clear()
  })

  socket.on('presencia', (usuarios) => {
    presentes.value = Array.isArray(usuarios) ? usuarios : []
  })

  socket.on('tarea:creada', (tarea) => tareas.aplicarCreada(tarea))
  socket.on('tarea:actualizada', (tarea) => tareas.aplicarActualizada(tarea))
  socket.on('tarea:movida', (datos) => {
    tareas.aplicarMovida(datos)
    arrastres.delete(datos._id)
  })
  socket.on('tarea:eliminada', (datos) => {
    tareas.aplicarEliminada(datos)
    arrastres.delete(datos._id)
  })

  socket.on('arrastre:inicio', ({ usuario, tareaId }) => {
    arrastres.set(tareaId, { usuario, estado: null, x: null, y: null })
  })
  socket.on('arrastre:mover', ({ usuario, tareaId, estado, x, y }) => {
    arrastres.set(tareaId, { usuario, estado, x, y })
  })
  socket.on('arrastre:fin', ({ tareaId }) => arrastres.delete(tareaId))

  watch(tableroId, (nuevo, anterior) => {
    if (anterior) socket.emit('tablero:salir')
    presentes.value = []
    arrastres.clear()
    if (nuevo && socket.connected) unirse()
  })

  // ---- Mis arrastres ----
  let arrastrando = null
  let pendiente = null
  let ultimoEnvio = 0
  let temporizador = null

  const enviarPendiente = () => {
    temporizador = null
    if (!arrastrando || !pendiente) return
    socket.emit('arrastre:mover', { tareaId: arrastrando, ...pendiente })
    ultimoEnvio = Date.now()
    pendiente = null
  }

  const iniciarArrastre = (tareaId) => {
    arrastrando = tareaId
    socket.emit('arrastre:inicio', { tareaId })
  }

  // Limita los envios a uno cada INTERVALO_ENVIO ms, sin perder la ultima posicion
  const moverArrastre = (posicion) => {
    if (!arrastrando) return
    pendiente = posicion
    const espera = INTERVALO_ENVIO - (Date.now() - ultimoEnvio)
    if (espera <= 0) enviarPendiente()
    else if (!temporizador) temporizador = setTimeout(enviarPendiente, espera)
  }

  const terminarArrastre = () => {
    if (!arrastrando) return
    clearTimeout(temporizador)
    temporizador = null
    pendiente = null
    arrastrando = null
    socket.emit('arrastre:fin')
  }

  onScopeDispose(() => {
    clearTimeout(temporizador)
    socket.disconnect()
  })

  return {
    conectado,
    presentes,
    otrosPresentes,
    arrastres,
    iniciarArrastre,
    moverArrastre,
    terminarArrastre,
  }
}
