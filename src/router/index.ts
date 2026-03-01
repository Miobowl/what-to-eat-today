import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/Home.vue')
    },
    {
      path: '/recipe/:id',
      name: 'recipe-detail',
      component: () => import('@/views/RecipeDetail.vue')
    }
  ]
})

export default router
