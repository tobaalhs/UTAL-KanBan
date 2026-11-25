const COLORES = [
  '#f59e0b',
  '#ec4899',
  '#0ea5e9',
  '#8b5cf6',
  '#14b8a6',
  '#f97316',
  '#6366f1',
]

// El mismo usuario siempre obtiene el mismo color (avatar, cursor y marcas de arrastre)
export const colorUsuario = (id = '') => {
  const hash = [...id].reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return COLORES[hash % COLORES.length]
}
