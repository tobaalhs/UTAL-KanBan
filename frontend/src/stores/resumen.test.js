import { setActivePinia, createPinia } from 'pinia'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useResumenStore } from './resumen'
import { useAuthStore } from './auth'
import * as apiTableros from '../services/tableros'

vi.mock('../services/tableros')

describe('Store: resumen', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('debe tener el estado inicial vacío', () => {
    const store = useResumenStore()
    expect(store.tableros).toEqual([])
    expect(store.tareas).toEqual([])
    expect(store.cargando).toBe(false)
    expect(store.cargado).toBe(false)
    expect(store.error).toBe('')
    expect(store.total).toBe(0)
    expect(store.porcentaje).toBe(0)
    expect(store.miembros).toEqual([])
  })

  it('debe cargar tableros y tareas, y calcular métricas agregadas', async () => {
    const auth = useAuthStore()
    auth.usuario = { _id: 'user_1', nombre: 'Usuario Actual', email: 'yo@utal.cl' }

    const mockTableros = [
      {
        _id: 'tablero_1',
        nombre: 'Tablero A',
        creador: 'user_1',
        miembros: [
          { _id: 'user_1', nombre: 'Usuario Actual', email: 'yo@utal.cl' },
          { _id: 'user_2', nombre: 'Compañero Beta', email: 'beta@utal.cl' },
        ],
      },
      {
        _id: 'tablero_2',
        nombre: 'Tablero B',
        creador: 'user_2',
        miembros: [
          { _id: 'user_1', nombre: 'Usuario Actual', email: 'yo@utal.cl' },
        ],
      },
    ]

    const mockDetalleA = {
      _id: 'tablero_1',
      nombre: 'Tablero A',
      tareas: [
        {
          _id: 't1',
          titulo: 'Tarea 1',
          estado: 'Pendiente',
          prioridad: 'Alta',
          asignado: { _id: 'user_1', nombre: 'Usuario Actual' },
        },
        {
          _id: 't2',
          titulo: 'Tarea 2',
          estado: 'Terminado',
          prioridad: 'Media',
          asignado: { _id: 'user_2', nombre: 'Compañero Beta' },
        },
      ],
    }

    const mockDetalleB = {
      _id: 'tablero_2',
      nombre: 'Tablero B',
      tareas: [
        {
          _id: 't3',
          titulo: 'Tarea 3',
          estado: 'Terminado',
          prioridad: 'Alta',
          asignado: { _id: 'user_1', nombre: 'Usuario Actual' },
        },
      ],
    }

    apiTableros.listar.mockResolvedValue(mockTableros)
    apiTableros.obtener.mockImplementation((id) => {
      if (id === 'tablero_1') return Promise.resolve(mockDetalleA)
      if (id === 'tablero_2') return Promise.resolve(mockDetalleB)
      return Promise.reject(new Error('Tablero no encontrado'))
    })

    const store = useResumenStore()
    await store.cargar()

    expect(store.cargado).toBe(true)
    expect(store.cargando).toBe(false)
    expect(store.tableros).toHaveLength(2)
    expect(store.tareas).toHaveLength(3)

    // Métricas por estado
    expect(store.porEstado).toEqual({
      Pendiente: 1,
      'En curso': 0,
      Terminado: 2,
    })

    // Métricas por prioridad
    expect(store.porPrioridad).toEqual({
      Alta: 2,
      Media: 1,
      Baja: 0,
    })

    // Métricas globales
    expect(store.total).toBe(3)
    expect(store.terminadas).toBe(2)
    // 2 de 3 tareas terminadas = 67%
    expect(store.porcentaje).toBe(67)

    // Filtro misTareas (asignadas a user_1)
    expect(store.misTareas).toHaveLength(2)
    expect(store.misTareas.map((t) => t._id)).toEqual(['t1', 't3'])

    // Tableros creados por mí (creador === user_1)
    expect(store.tablerosCreados).toBe(1)

    // Agregación de miembros únicos ordenados alfabéticamente
    expect(store.miembros).toHaveLength(2)
    const beta = store.miembros.find((m) => m._id === 'user_2')
    expect(beta).toBeDefined()
    expect(beta.asignadas).toBe(1)
    expect(beta.terminadas).toBe(1)
  })

  it('debe manejar errores de carga adecuadamente', async () => {
    apiTableros.listar.mockRejectedValue(new Error('Fallo de red'))

    const store = useResumenStore()
    await store.cargar()

    expect(store.cargado).toBe(false)
    expect(store.cargando).toBe(false)
    expect(store.error).toBe('No se pudo cargar el resumen')
  })
})
