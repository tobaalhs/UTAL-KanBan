<script setup>
defineProps({
  titulo: { type: String, required: true },
  subtitulo: { type: String, default: '' },
})
</script>

<template>
  <main class="auth">
    <section class="auth-card">
      <header class="auth-header">
        <div class="logo">
          <span class="logo-icono" aria-hidden="true">
            <i></i><i></i><i></i>
          </span>
          <span class="logo-texto">Utal <strong>KanBan</strong></span>
        </div>
        <h1>{{ titulo }}</h1>
        <p v-if="subtitulo">{{ subtitulo }}</p>
      </header>
      <slot />
    </section>
  </main>
</template>

<style scoped>
.auth {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 1rem;
  background: radial-gradient(circle at 20% 0%, rgb(99 102 241 / 0.18), transparent 50%), var(--color-fondo);
}
.auth-card {
  width: 100%;
  max-width: 400px;
  padding: 2rem;
  background: var(--color-superficie);
  border: 1px solid var(--color-borde);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
.auth-header {
  text-align: center;
}
.auth-header h1 {
  margin: 1.25rem 0 0.25rem;
  font-size: 1.4rem;
}
.auth-header p {
  margin: 0;
  color: var(--color-texto-2);
  font-size: 0.9rem;
}
.logo {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 1.25rem;
}
.logo strong {
  color: var(--color-primario-claro);
}
.logo-icono {
  display: inline-flex;
  gap: 3px;
  padding: 6px;
  border-radius: 8px;
  background: var(--color-primario);
}
.logo-icono i {
  width: 5px;
  border-radius: 2px;
  background: #fff;
}
.logo-icono i:nth-child(1) { height: 16px; }
.logo-icono i:nth-child(2) { height: 10px; }
.logo-icono i:nth-child(3) { height: 13px; }

@media (max-width: 480px) {
  .auth-card {
    padding: 1.5rem 1.25rem;
  }
}
</style>
