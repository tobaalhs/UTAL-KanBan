import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { effectScope, nextTick, ref } from 'vue'
import { useTableroEnVivo } from './useTableroEnVivo'
import { useAuthStore } from '../stores/auth'
import { useTareasStore } from '../stores/tareas'
import { useTablerosStore } from '../stores/tableros'

vi.mock('../services/tareas', () => ({
  listar: vi.fn().mockResolvedValue([]),
  crear: vi.fn(),
  actualizar: vi.fn(),
  actualizarEstado: vi.fn(),
  eliminar: vi.fn(),
  ESTADOS: ['Pendiente', 'En curso', 'Terminado'],
}))

// Socket falso: guarda los handlers y registra lo que se emite
const crearSocketFalso = () => {
  const handlers = {}
  return {
    connected: false,
    emitidos: [],
    on(evento, fn) {
      handlers[evento] = fn
    },
    emit(evento, ...args) {
      this.emitidos.push([evento, ...args])
    },
    disconnect: vi.fn(),
    recibir(evento, datos) {
      handlers[evento]?.(datos)
    },
  }
}

describe('useTableroEnVivo (tiempo real)', () => {
  let socket
  let scope
  let enVivo
  let tareas

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useRealTimers()
    const auth = useAuthStore()
    auth.token = 'jwt'
    auth.usuario = { _id: 'yo', nombre: 'Yo' }
    tareas = useTareasStore()
    tareas.tableroId = 'tab-1'
    tareas.lista = [
      {
        _id: 't-1',
        titulo: 'Tarea 1',
        estado: 'Pendiente',
        tableroId: 'tab-1',
      },
    ]
    useTablerosStore().actual = {
      _id: 'tab-1',
      cantidadTareas: 1,
      cantidadTerminadas: 0,
    }

    socket = crearSocketFalso()
    scope = effectScope()
    enVivo = scope.run(() =>
      useTableroEnVivo(ref('tab-1'), { crear: () => socket }),
    )
  })

  it('se une a la sala del tablero al conectarse', () => {
    socket.connected = true
    socket.recibir('connect')
    expect(socket.emitidos).toContainEqual(['tablero:unirse', 'tab-1'])
  })

  it('aplica en el store una tarea movida por otro miembro y actualiza el conteo de terminadas', () => {
    socket.recibir('tarea:movida', { _id: 't-1', estado: 'Terminado' })
    expect(tareas.lista[0].estado).toBe('Terminado')
    expect(useTablerosStore().actual.cantidadTerminadas).toBe(1)

    // El mismo evento repetido (eco de mi propio cambio) no vuelve a sumar
    socket.recibir('tarea:movida', { _id: 't-1', estado: 'Terminado' })
    expect(useTablerosStore().actual.cantidadTerminadas).toBe(1)
  })

  it('agrega una tarea creada por otro miembro solo una vez', () => {
    const nueva = {
      _id: 't-2',
      titulo: 'Nueva',
      estado: 'Pendiente',
      tableroId: 'tab-1',
    }
    socket.recibir('tarea:creada', nueva)
    socket.recibir('tarea:creada', nueva)
    expect(tareas.lista.map((t) => t._id)).toEqual(['t-1', 't-2'])
    expect(useTablerosStore().actual.cantidadTareas).toBe(2)
  })

  it('ignora tareas creadas en otro tablero', () => {
    socket.recibir('tarea:creada', {
      _id: 't-9',
      estado: 'Pendiente',
      tableroId: 'otro',
    })
    expect(tareas.lista).toHaveLength(1)
  })

  it('quita una tarea eliminada por otro miembro', () => {
    socket.recibir('tarea:eliminada', { _id: 't-1' })
    expect(tareas.lista).toHaveLength(0)
    expect(useTablerosStore().actual.cantidadTareas).toBe(0)
  })

  it('registra los arrastres remotos y los limpia al terminar', () => {
    const usuario = { _id: 'u-2', nombre: 'Nelson' }
    socket.recibir('arrastre:inicio', { usuario, tareaId: 't-1' })
    socket.recibir('arrastre:mover', {
      usuario,
      tareaId: 't-1',
      estado: 'En curso',
      x: 0.5,
      y: 0.3,
    })
    expect(enVivo.arrastres.get('t-1')).toEqual({
      usuario,
      estado: 'En curso',
      x: 0.5,
      y: 0.3,
    })

    socket.recibir('arrastre:fin', { usuarioId: 'u-2', tareaId: 't-1' })
    expect(enVivo.arrastres.has('t-1')).toBe(false)
  })

  it('excluye al usuario actual de la lista de presentes', () => {
    socket.recibir('presencia', [
      { _id: 'yo', nombre: 'Yo' },
      { _id: 'u-2', nombre: 'Nelson' },
    ])
    expect(enVivo.otrosPresentes.value.map((u) => u.nombre)).toEqual(['Nelson'])
  })

  it('limita el envío de posiciones mientras arrastro y avisa el fin', async () => {
    vi.useFakeTimers()
    enVivo.iniciarArrastre('t-1')
    enVivo.moverArrastre({ x: 0.1, y: 0.1, estado: 'Pendiente' })
    enVivo.moverArrastre({ x: 0.2, y: 0.2, estado: 'Pendiente' })
    enVivo.moverArrastre({ x: 0.3, y: 0.3, estado: 'En curso' })

    const movimientos = () =>
      socket.emitidos.filter(([e]) => e === 'arrastre:mover')
    expect(movimientos()).toHaveLength(1)

    vi.advanceTimersByTime(60)
    expect(movimientos()).toHaveLength(2)
    expect(movimientos()[1][1]).toEqual({
      tareaId: 't-1',
      x: 0.3,
      y: 0.3,
      estado: 'En curso',
    })

    enVivo.terminarArrastre()
    expect(socket.emitidos.at(-1)).toEqual(['arrastre:fin'])
    vi.useRealTimers()
  })

  it('se desconecta al salir de la vista', async () => {
    scope.stop()
    await nextTick()
    expect(socket.disconnect).toHaveBeenCalled()
  })
})
