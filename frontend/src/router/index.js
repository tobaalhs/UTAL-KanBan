import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/tableros' },
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
      path: '/tableros',
      name: 'tableros',
      component: () => import('../views/TablerosView.vue'),
      meta: { requiereAuth: true },
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

// RF21: usuarios no autenticados no pueden entrar a las vistas protegidas
router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.requiereAuth && !auth.autenticado) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.meta.soloInvitados && auth.autenticado) {
    return { name: 'tableros' }
  }
})

export default router
