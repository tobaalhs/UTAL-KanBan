# Utal KanBan — Frontend

Vue 3 + Vite + Pinia + Vue Router + Axios.

```bash
npm install
npm run dev
```

En desarrollo, las peticiones a `/api` se redirigen al backend en `http://localhost:3000` (ver `vite.config.js`).
El login, registro, tableros, miembros y tareas usan la API Express. Los datos mock de tableros y tareas ya no se usan.

Para otro backend (ej. producción), definir `VITE_API_URL` con la URL base que termina en `/api` en un archivo `.env`, por ejemplo `VITE_API_URL=https://mi-api.example.com/api`.
