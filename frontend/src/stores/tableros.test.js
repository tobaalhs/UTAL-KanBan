import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTablerosStore } from './tableros'
import * as api from '../services/tableros'

vi.mock('../services/tableros', () => ({
  listar: vi.fn(),
  obtener: vi.fn(),
  crear: vi.fn(),
  actualizar: vi.fn(),
  eliminar: vi.fn(),
  invitar: vi.fn()
}))

describe('Store: tableros', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('inicia con lista vacía y no cargando', () => {
    const store = useTablerosStore()
    expect(store.lista).toEqual([])
    expect(store.actual).toBeNull()
    expect(store.cargando).toBe(false)
  })

  it('crear añade el nuevo tablero al inicio de la lista', async () => {
    const nuevoTablero = { _id: 't-1', nombre: 'Nuevo Tablero' }
    api.crear.mockResolvedValueOnce(nuevoTablero)

    const store = useTablerosStore()
    store.lista = [{ _id: 't-0', nombre: 'Tablero Viejo' }]

    const resultado = await store.crear({ nombre: 'Nuevo Tablero' })

    expect(resultado).toEqual(nuevoTablero)
    expect(store.lista[0]).toEqual(nuevoTablero)
    expect(store.lista.length).toBe(2)
  })

  it('reemplazar actualiza el tablero tanto en lista como en actual si coincide', () => {
    const store = useTablerosStore()
    store.lista = [{ _id: 't-1', nombre: 'Original' }]
    store.actual = { _id: 't-1', nombre: 'Original' }

    api.actualizar.mockResolvedValueOnce({ _id: 't-1', nombre: 'Modificado' })

    return store.actualizar('t-1', { nombre: 'Modificado' }).then(() => {
      expect(store.lista[0].nombre).toBe('Modificado')
      expect(store.actual.nombre).toBe('Modificado')
    })
  })

  it('ajustarConteo y ajustarTerminadas actualizan los contadores', () => {
    const store = useTablerosStore()
    const tLista = { _id: 't-1', cantidadTareas: 5, cantidadTerminadas: 2 }
    const tActual = { _id: 't-1', cantidadTareas: 5, cantidadTerminadas: 2 }
    store.lista = [tLista]
    store.actual = tActual

    store.ajustarConteo('t-1', 1)
    expect(tLista.cantidadTareas).toBe(6)
    expect(tActual.cantidadTareas).toBe(6)

    store.ajustarTerminadas('t-1', 1)
    expect(tLista.cantidadTerminadas).toBe(3)
    expect(tActual.cantidadTerminadas).toBe(3)
  })

  it('eliminar remueve el tablero de la lista y limpia actual si coincide', async () => {
    const store = useTablerosStore()
    store.lista = [{ _id: 't-1' }, { _id: 't-2' }]
    store.actual = { _id: 't-1' }
    api.eliminar.mockResolvedValueOnce()

    await store.eliminar('t-1')

    expect(store.lista).toEqual([{ _id: 't-2' }])
    expect(store.actual).toBeNull()
  })
})
