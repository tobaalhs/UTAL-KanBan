import { describe, it, expect } from 'vitest'
import { fechaRelativa, fechaCorta } from './fechas'

describe('fechas utils', () => {
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
})
