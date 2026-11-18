import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTareasStore } from './tareas'
import * as api from '../services/tareas'

vi.mock('../services/tareas', () => ({
  listar: vi.fn(),
  crear: vi.fn(),
  actualizar: vi.fn(),
  actualizarEstado: vi.fn(),
  eliminar: vi.fn(),
  ESTADOS: ['Pendiente', 'En curso', 'Terminado'],
  PRIORIDADES: ['Alta', 'Media', 'Baja']
}))

describe('Store: tareas', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('mover cambia el estado de la tarea de forma optimista cuando la API tiene éxito (RF17)', async () => {
    const store = useTareasStore()
    store.lista = [{ _id: 't-1', titulo: 'Tarea 1', estado: 'Pendiente' }]
    api.actualizarEstado.mockResolvedValueOnce({ _id: 't-1', estado: 'En curso' })

    await store.mover('t-1', 'En curso')

    const tarea = store.lista.find((t) => t._id === 't-1')
    expect(tarea.estado).toBe('En curso')
    expect(api.actualizarEstado).toHaveBeenCalledWith('t-1', 'En curso')
  })

  it('mover revierte el estado de la tarea al estado anterior si la llamada al backend falla (RF19)', async () => {
    const store = useTareasStore()
    store.lista = [{ _id: 't-1', titulo: 'Tarea 1', estado: 'Pendiente' }]
    api.actualizarEstado.mockRejectedValueOnce(new Error('Fallo de red'))

    await expect(store.mover('t-1', 'En curso')).rejects.toThrow('Fallo de red')

    // Verificamos que se revirtió a Pendiente
    const tarea = store.lista.find((t) => t._id === 't-1')
    expect(tarea.estado).toBe('Pendiente')
  })

  it('reordenar organiza las tareas de un estado respetando el orden especificado', () => {
    const store = useTareasStore()
    store.lista = [
      { _id: 't-1', titulo: 'Tarea 1', estado: 'Pendiente' },
      { _id: 't-2', titulo: 'Tarea 2', estado: 'Pendiente' },
      { _id: 't-3', titulo: 'Tarea 3', estado: 'En curso' }
    ]

    store.reordenar('Pendiente', ['t-2', 't-1'])

    const pendientes = store.lista.filter((t) => t.estado === 'Pendiente')
    expect(pendientes[0]._id).toBe('t-2')
    expect(pendientes[1]._id).toBe('t-1')
    // La tarea en otro estado se preserva
    expect(store.lista.find((t) => t._id === 't-3')).toBeDefined()
  })
})
