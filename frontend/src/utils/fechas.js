const DIA_MS = 86400000

const inicioDelDia = (fecha) => new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate())

// "Hoy", "Ayer", "Hace 3 días" o la fecha corta
export const fechaRelativa = (iso) => {
  const dias = Math.round((inicioDelDia(new Date()) - inicioDelDia(new Date(iso))) / DIA_MS)
  if (dias <= 0) return 'Hoy'
  if (dias === 1) return 'Ayer'
  if (dias < 7) return `Hace ${dias} días`
  return fechaCorta(iso)
}

// "10 sep"
export const fechaCorta = (iso) =>
  new Date(iso).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' }).replace('.', '')
