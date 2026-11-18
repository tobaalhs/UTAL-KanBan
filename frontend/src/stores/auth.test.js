import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from './auth'
import http from '../api/http'

vi.mock('../api/http', () => ({
  default: {
    post: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() }
    }
  }
}))

describe('Store: auth', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    sessionStorage.clear()
    vi.clearAllMocks()
  })

  it('inicia sin autenticar cuando no hay sesión guardada', () => {
    const auth = useAuthStore()
    expect(auth.autenticado).toBe(false)
    expect(auth.token).toBeNull()
    expect(auth.usuario).toBeNull()
  })

  it('login guarda token y usuario en el store y en sessionStorage por defecto', async () => {
    const mockData = {
      token: 'jwt-token-123',
      usuario: { _id: 'u-1', nombre: 'Test', email: 'test@utal.cl' }
    }
    http.post.mockResolvedValueOnce({ data: mockData })

    const auth = useAuthStore()
    await auth.login('test@utal.cl', 'pass123', false)

    expect(auth.autenticado).toBe(true)
    expect(auth.token).toBe('jwt-token-123')
    expect(auth.usuario).toEqual(mockData.usuario)
    expect(sessionStorage.getItem('utal-kanban-sesion')).toContain('jwt-token-123')
    expect(localStorage.getItem('utal-kanban-sesion')).toBeNull()
  })

  it('login con recordar=true guarda en localStorage', async () => {
    const mockData = {
      token: 'jwt-token-recordado',
      usuario: { _id: 'u-2', nombre: 'Test Recordado', email: 'recordado@utal.cl' }
    }
    http.post.mockResolvedValueOnce({ data: mockData })

    const auth = useAuthStore()
    await auth.login('recordado@utal.cl', 'pass123', true)

    expect(auth.autenticado).toBe(true)
    expect(localStorage.getItem('utal-kanban-sesion')).toContain('jwt-token-recordado')
  })

  it('logout limpia token, usuario y storages', () => {
    const auth = useAuthStore()
    auth.token = 'algun-token'
    auth.usuario = { nombre: 'Test' }
    localStorage.setItem('utal-kanban-sesion', 'datos')

    auth.logout()

    expect(auth.autenticado).toBe(false)
    expect(auth.token).toBeNull()
    expect(auth.usuario).toBeNull()
    expect(localStorage.getItem('utal-kanban-sesion')).toBeNull()
  })
})
