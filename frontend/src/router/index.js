import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import AppLayout from '../components/AppLayout.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { soloInvitados: true },
    },
    {
      path: '/registro',
      name: 'registro',
      component: () => import('../views/RegistroView.vue'),
      meta: { soloInvitados: true },
    },
    {
      // Vistas protegidas: comparten la barra lateral
      path: '/',
      component: AppLayout,
      meta: { requiereAuth: true },
      children: [
        { path: '', redirect: { name: 'tableros' } },
        { path: 'tableros', name: 'tableros', component: () => import('../views/TablerosView.vue') },
        { path: 'tableros/:id', name: 'tablero', component: () => import('../views/TableroView.vue'), props: true },
      ],
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

// RF21: usuarios no autenticados no pueden entrar a las vistas protegidas
router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.matched.some((r) => r.meta.requiereAuth) && !auth.autenticado) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.meta.soloInvitados && auth.autenticado) {
    return { name: 'tableros' }
  }
})

export default router
