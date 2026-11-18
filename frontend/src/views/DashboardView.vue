<script setup>
import { computed, onMounted } from 'vue'
import EstadoIcono from '../components/EstadoIcono.vue'
import Icono from '../components/Icono.vue'
import PrioridadIndicador from '../components/PrioridadIndicador.vue'
import { useAuthStore } from '../stores/auth'
import { useResumenStore } from '../stores/resumen'
import { ESTADOS, PRIORIDADES } from '../services/tareas'
import { saludo } from '../utils/fechas'

const auth = useAuthStore()
const resumen = useResumenStore()

onMounted(resumen.cargar)

const kpis = computed(() => [
  { icono: 'tableros', titulo: 'Tableros', valor: resumen.tableros.length, detalle: `${resumen.tablerosCreados} creados por ti` },
  { icono: 'tareas', titulo: 'Tareas', valor: resumen.total, detalle: `${resumen.porEstado.Pendiente} pendientes` },
  { icono: 'usuario', titulo: 'Asignadas a ti', valor: resumen.misTareas.length, detalle: `${sinTerminar.value.length} sin terminar` },
  { icono: 'exito', titulo: 'Avance', valor: `${resumen.porcentaje}%`, detalle: `${resumen.terminadas} de ${resumen.total} terminadas` },
])

// Tareas del usuario que siguen abiertas, las de mayor prioridad primero
const sinTerminar = computed(() =>
  resumen.misTareas
    .filter((t) => t.estado !== 'Terminado')
    .sort((a, b) => PRIORIDADES.indexOf(a.prioridad) - PRIORIDADES.indexOf(b.prioridad)),
)

const maxPrioridad = computed(() => Math.max(1, ...PRIORIDADES.map((p) => resumen.porPrioridad[p])))

const porcentaje = (t) => (t.cantidadTareas ? Math.round((t.cantidadTerminadas / t.cantidadTareas) * 100) : 0)

// Dona de estados: cada segmento es un arco de circunferencia
const RADIO = 42
const CIRCUNFERENCIA = 2 * Math.PI * RADIO
const segmentos = computed(() => {
  let acumulado = 0
  return ESTADOS.map((estado) => {
    const largo = resumen.total ? (resumen.porEstado[estado] / resumen.total) * CIRCUNFERENCIA : 0
    const segmento = { estado, largo, desfase: -acumulado }
    acumulado += largo
    return segmento
  })
})
const colorEstado = { Pendiente: 'var(--estado-pendiente)', 'En curso': 'var(--estado-en-curso)', Terminado: 'var(--estado-terminado)' }
</script>

<template>
  <div class="pagina">
    <header class="encabezado">
      <p class="saludo">{{ saludo() }}, {{ auth.usuario?.nombre }}</p>
      <h1>Dashboard</h1>
    </header>

    <p v-if="resumen.error" class="alerta alerta-error">
      <Icono nombre="alerta" :tamano="16" />{{ resumen.error }}
    </p>

    <div v-else-if="!resumen.cargado" class="cargando"><span class="spinner" aria-hidden="true"></span> Cargando resumen...</div>

    <div v-else-if="!resumen.tableros.length" class="vacio">
      <h2>Aún no hay nada que resumir</h2>
      <p>Crea tu primer tablero y aquí verás el avance de tus tareas.</p>
      <RouterLink :to="{ name: 'tableros' }" class="btn btn-primario">Ir a mis tableros</RouterLink>
    </div>

    <template v-else>
      <section class="kpis" aria-label="Resumen">
        <article v-for="kpi in kpis" :key="kpi.titulo" class="kpi">
          <span class="kpi-icono"><Icono :nombre="kpi.icono" :tamano="18" /></span>
          <div>
            <p class="kpi-titulo">{{ kpi.titulo }}</p>
            <p class="kpi-valor">{{ kpi.valor }}</p>
            <p class="kpi-detalle">{{ kpi.detalle }}</p>
          </div>
        </article>
      </section>

      <div class="rejilla">
        <section class="tarjeta">
          <h2>Estado de las tareas</h2>
          <div class="dona-fila">
            <div class="dona">
              <svg viewBox="0 0 100 100" role="img" :aria-label="`${resumen.porcentaje}% de las tareas terminadas`">
                <circle cx="50" cy="50" :r="RADIO" fill="none" stroke="var(--color-superficie-3)" stroke-width="10" />
                <g transform="rotate(-90 50 50)">
                  <template v-for="s in segmentos" :key="s.estado">
                    <circle
                      v-if="s.largo > 0"
                      cx="50"
                      cy="50"
                      :r="RADIO"
                      fill="none"
                      :stroke="colorEstado[s.estado]"
                      stroke-width="10"
                      :stroke-dasharray="`${s.largo} ${CIRCUNFERENCIA - s.largo}`"
                      :stroke-dashoffset="s.desfase"
                    />
                  </template>
                </g>
              </svg>
              <div class="dona-centro">
                <strong>{{ resumen.porcentaje }}%</strong>
                <span>terminado</span>
              </div>
            </div>
            <ul class="leyenda">
              <li v-for="estado in ESTADOS" :key="estado">
                <EstadoIcono :estado="estado" :tamano="14" />
                <span>{{ estado }}</span>
                <strong>{{ resumen.porEstado[estado] }}</strong>
              </li>
            </ul>
          </div>
        </section>

        <section class="tarjeta">
          <h2>Tareas por prioridad</h2>
          <ul class="barras">
            <li v-for="p in PRIORIDADES" :key="p">
              <PrioridadIndicador :prioridad="p" class="barras-etiqueta" />
              <div class="pista">
                <div class="relleno" :class="`relleno-${p.toLowerCase()}`" :style="{ width: `${(resumen.porPrioridad[p] / maxPrioridad) * 100}%` }"></div>
              </div>
              <strong>{{ resumen.porPrioridad[p] }}</strong>
            </li>
          </ul>
        </section>

        <section class="tarjeta">
          <h2>Tus tareas abiertas</h2>
          <p v-if="!sinTerminar.length" class="nota">No tienes tareas pendientes asignadas. ¡Buen trabajo!</p>
          <ul v-else class="lista">
            <li v-for="t in sinTerminar.slice(0, 6)" :key="t._id">
              <RouterLink :to="{ name: 'tablero', params: { id: t.tablero } }" class="fila">
                <EstadoIcono :estado="t.estado" :tamano="14" />
                <span class="fila-texto">
                  <strong>{{ t.titulo }}</strong>
                  <small>{{ t.tableroNombre }}</small>
                </span>
                <PrioridadIndicador :prioridad="t.prioridad" :con-texto="false" />
              </RouterLink>
            </li>
          </ul>
          <p v-if="sinTerminar.length > 6" class="nota">y {{ sinTerminar.length - 6 }} más</p>
        </section>

        <section class="tarjeta">
          <h2>Avance por tablero</h2>
          <ul class="lista">
            <li v-for="t in resumen.tableros" :key="t._id">
              <RouterLink :to="{ name: 'tablero', params: { id: t._id } }" class="fila vertical">
                <span class="fila-encabezado">
                  <strong>{{ t.nombre }}</strong>
                  <small>{{ t.cantidadTerminadas }}/{{ t.cantidadTareas }} · {{ porcentaje(t) }}%</small>
                </span>
                <span class="pista"><span class="relleno acento" :style="{ width: `${porcentaje(t)}%` }"></span></span>
              </RouterLink>
            </li>
          </ul>
        </section>
      </div>
    </template>
  </div>
</template>

<style scoped>
.pagina {
  max-width: 1200px;
  padding: 2rem 2.25rem;
}
.encabezado {
  margin-bottom: 1.5rem;
}
.saludo {
  margin: 0 0 0.2rem;
  color: var(--color-texto-2);
  font-size: 0.875rem;
}
h1 {
  margin: 0;
  font-size: 1.6rem;
  font-weight: 700;
}
h2 {
  margin: 0 0 1rem;
  font-size: 0.95rem;
  font-weight: 600;
}
.cargando {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  color: var(--color-texto-2);
}
.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid var(--color-superficie-3);
  border-top-color: var(--color-primario);
  border-radius: 50%;
  animation: girar 0.7s linear infinite;
}
@keyframes girar {
  to {
    transform: rotate(360deg);
  }
}
.vacio {
  max-width: 380px;
  margin: 3rem auto;
  text-align: center;
  color: var(--color-texto-2);
}
.vacio h2 {
  color: var(--color-texto);
  font-size: 1.1rem;
}

/* ---------- Indicadores ---------- */
.kpis {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}
.kpi {
  display: flex;
  gap: 0.9rem;
  padding: 1.1rem 1.2rem;
  border: 1px solid var(--color-borde);
  border-radius: var(--radio-grande);
  background: var(--color-superficie);
}
.kpi-icono {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: rgb(99 102 241 / 0.14);
  color: var(--color-primario-claro);
}
.kpi p {
  margin: 0;
}
.kpi-titulo {
  color: var(--color-texto-2);
  font-size: 0.8rem;
}
.kpi-valor {
  font-size: 1.6rem;
  font-weight: 700;
  line-height: 1.25;
  font-variant-numeric: tabular-nums;
}
.kpi-detalle {
  color: var(--color-texto-3);
  font-size: 0.75rem;
}

/* ---------- Tarjetas ---------- */
.rejilla {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}
.tarjeta {
  min-width: 0;
  padding: 1.2rem;
  border: 1px solid var(--color-borde);
  border-radius: var(--radio-grande);
  background: var(--color-superficie);
}
.nota {
  margin: 0.25rem 0 0;
  color: var(--color-texto-3);
  font-size: 0.85rem;
}

/* Dona */
.dona-fila {
  display: flex;
  align-items: center;
  gap: 1.75rem;
  flex-wrap: wrap;
}
.dona {
  position: relative;
  width: 150px;
  height: 150px;
  flex-shrink: 0;
}
.dona svg {
  width: 100%;
  height: 100%;
}
.dona-centro {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  line-height: 1.2;
}
.dona-centro strong {
  font-size: 1.5rem;
  font-variant-numeric: tabular-nums;
}
.dona-centro span {
  color: var(--color-texto-3);
  font-size: 0.72rem;
}
.leyenda {
  flex: 1;
  min-width: 150px;
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}
.leyenda li {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  font-size: 0.875rem;
  color: var(--color-texto-2);
}
.leyenda strong {
  margin-left: auto;
  color: var(--color-texto);
  font-variant-numeric: tabular-nums;
}

/* Barras de prioridad */
.barras {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.barras li {
  display: grid;
  grid-template-columns: 72px 1fr 28px;
  align-items: center;
  gap: 0.75rem;
}
.barras strong {
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.pista {
  display: block;
  height: 8px;
  border-radius: 8px;
  background: var(--color-superficie-3);
  overflow: hidden;
}
.relleno {
  display: block;
  height: 100%;
  border-radius: inherit;
  transition: width 0.4s ease;
}
.relleno-alta {
  background: #f87171;
}
.relleno-media {
  background: #facc15;
}
.relleno-baja {
  background: #4ade80;
}
.acento {
  background: linear-gradient(90deg, var(--color-primario), var(--estado-terminado));
}

/* Listas */
.lista {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.fila {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.55rem 0.6rem;
  margin: 0 -0.6rem;
  border-radius: 8px;
  color: var(--color-texto);
  transition: background var(--transicion);
}
.fila:hover {
  background: var(--color-superficie-2);
}
.fila.vertical {
  flex-direction: column;
  align-items: stretch;
  gap: 0.5rem;
}
.fila-texto {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}
.fila-texto strong,
.fila-encabezado strong {
  font-size: 0.875rem;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.fila-texto small,
.fila-encabezado small {
  color: var(--color-texto-3);
  font-size: 0.75rem;
  white-space: nowrap;
}
.fila-encabezado {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

@media (max-width: 1100px) {
  .kpis {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 900px) {
  .rejilla {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 768px) {
  .pagina {
    padding: 1.25rem 1rem;
  }
}
</style>
