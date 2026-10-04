<script setup>
import LogoMarca from './LogoMarca.vue'
import EstadoIcono from './EstadoIcono.vue'
import PrioridadIndicador from './PrioridadIndicador.vue'

defineProps({
  titulo: { type: String, required: true },
  subtitulo: { type: String, default: '' },
})

// Mini tablero decorativo para el panel lateral
const demo = [
  { estado: 'Pendiente', tareas: [{ t: 'Diseñar base de datos', p: 'Media' }, { t: 'Definir endpoints', p: 'Baja' }] },
  { estado: 'En curso', tareas: [{ t: 'Login con JWT', p: 'Alta' }] },
  { estado: 'Terminado', tareas: [{ t: 'Wireframes', p: 'Baja' }, { t: 'Setup del proyecto', p: 'Media' }] },
]
</script>

<template>
  <main class="auth">
    <section class="panel-form">
      <LogoMarca :tamano="32" class="logo" />
      <div class="contenido">
        <header>
          <h1>{{ titulo }}</h1>
          <p v-if="subtitulo">{{ subtitulo }}</p>
        </header>
        <slot />
      </div>
      <small class="pie">Universidad de Talca · Tecnologías Web</small>
    </section>

    <aside class="panel-visual" aria-hidden="true">
      <div class="brillo"></div>
      <div class="vista">
        <div class="mini-tablero">
          <div v-for="col in demo" :key="col.estado" class="mini-columna">
            <div class="mini-encabezado">
              <EstadoIcono :estado="col.estado" :tamano="13" />
              {{ col.estado }}
            </div>
            <div v-for="tarea in col.tareas" :key="tarea.t" class="mini-tarea" :class="{ flotante: tarea.t === 'Login con JWT' }">
              <span>{{ tarea.t }}</span>
              <PrioridadIndicador :prioridad="tarea.p" :con-texto="false" />
            </div>
          </div>
        </div>
        <h2>Organiza el trabajo de tu equipo</h2>
        <p>Tableros colaborativos con columnas de estado y arrastrar y soltar, sin recargar la página.</p>
      </div>
    </aside>
  </main>
</template>

<style scoped>
.auth {
  display: grid;
  grid-template-columns: minmax(380px, 1fr) 1.15fr;
  min-height: 100vh;
}
.panel-form {
  display: flex;
  flex-direction: column;
  padding: 2rem 2.5rem;
}
.contenido {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 1.75rem;
  width: 100%;
  max-width: 380px;
  margin: 0 auto;
  padding: 2.5rem 0;
}
header h1 {
  margin: 0 0 0.35rem;
  font-size: 1.65rem;
  font-weight: 700;
}
header p {
  margin: 0;
  color: var(--color-texto-2);
  font-size: 0.925rem;
}
.pie {
  color: var(--color-texto-3);
  font-size: 0.75rem;
}

/* ---------- Panel ilustrado ---------- */
.panel-visual {
  position: relative;
  display: grid;
  place-items: center;
  margin: 0.75rem;
  border: 1px solid var(--color-borde);
  border-radius: 20px;
  background:
    linear-gradient(rgb(148 163 184 / 0.04) 1px, transparent 1px) 0 0 / 28px 28px,
    linear-gradient(90deg, rgb(148 163 184 / 0.04) 1px, transparent 1px) 0 0 / 28px 28px,
    var(--color-superficie);
  overflow: hidden;
}
.brillo {
  position: absolute;
  inset: -20% -10% auto auto;
  width: 70%;
  aspect-ratio: 1;
  background: radial-gradient(circle, rgb(99 102 241 / 0.28), transparent 65%);
  filter: blur(20px);
}
.vista {
  position: relative;
  max-width: 520px;
  padding: 2rem;
}
.vista h2 {
  margin: 2.25rem 0 0.5rem;
  font-size: 1.5rem;
  font-weight: 700;
}
.vista p {
  margin: 0;
  color: var(--color-texto-2);
  line-height: 1.6;
}
.mini-tablero {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.6rem;
  padding: 0.75rem;
  border: 1px solid var(--color-borde-fuerte);
  border-radius: 14px;
  background: rgb(13 15 24 / 0.7);
  box-shadow: var(--sombra-elevada);
  transform: perspective(900px) rotateX(8deg) rotateY(-10deg);
}
.mini-columna {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  min-height: 150px;
  padding: 0.55rem;
  border-radius: 10px;
  background: var(--color-superficie);
}
.mini-encabezado {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.15rem;
  color: var(--color-texto-2);
  font-size: 0.7rem;
  font-weight: 600;
}
.mini-tarea {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: 0.5rem 0.55rem;
  border: 1px solid var(--color-borde);
  border-radius: 7px;
  background: var(--color-superficie-2);
  font-size: 0.7rem;
  font-weight: 500;
}
.flotante {
  border-color: rgb(99 102 241 / 0.6);
  box-shadow: 0 10px 24px -8px rgb(99 102 241 / 0.5);
  transform: translate(6px, -4px) rotate(-3deg);
}

@media (max-width: 900px) {
  .auth {
    grid-template-columns: 1fr;
  }
  .panel-visual {
    display: none;
  }
  .panel-form {
    padding: 1.5rem 1.25rem;
  }
}
</style>
