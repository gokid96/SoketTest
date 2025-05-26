import { createRouter, createWebHistory } from 'vue-router'


const MatipTest = () => import('../views/SoketTest.vue')

// 라우트 정의
const routes = [
  {
    path: '/',
    name: 'matiptest',
    component: MatipTest
  },

]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
