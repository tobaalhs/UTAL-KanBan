import { describe, it, expect, vi, afterEach } from 'vitest'
import { fechaRelativa, fechaCorta, saludo } from './fechas'

describe('fechas utils', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('debe retornar "Hoy" para una fecha del día actual', () => {
    const hoy = new Date().toISOString()
    expect(fechaRelativa(hoy)).toBe('Hoy')
  })

  it('debe retornar "Ayer" para una fecha de hace 24 horas', () => {
    const ayer = new Date(Date.now() - 86400000).toISOString()
    expect(fechaRelativa(ayer)).toBe('Ayer')
  })

  it('debe formatear fechaCorta correctamente', () => {
    const fecha = new Date('2026-05-15T12:00:00Z').toISOString()
    const resultado = fechaCorta(fecha)
    expect(resultado).toContain('15')
    expect(resultado).toContain('may')
  })

  describe('saludo()', () => {
    it('debe retornar "Buenos días" antes de las 12:00', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date(2026, 4, 15, 9, 30))
      expect(saludo()).toBe('Buenos días')
    })

    it('debe retornar "Buenas tardes" entre las 12:00 y las 19:59', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date(2026, 4, 15, 15, 0))
      expect(saludo()).toBe('Buenas tardes')
    })

    it('debe retornar "Buenas noches" a partir de las 20:00', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date(2026, 4, 15, 21, 30))
      expect(saludo()).toBe('Buenas noches')
    })
  })
})
