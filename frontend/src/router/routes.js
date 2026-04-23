const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/IndexPage.vue') },
      { path: '/login', component: () => import('pages/LoginPage.vue') },
      { path: '/auth/github', component: () => import('pages/AuthCallback.vue') },
      { path: '/auth/gitlab', component: () => import('pages/AuthCallback.vue') },
      { path: '/repos', component: () => import('pages/ReposPage.vue') },
    ],
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
]

export default routes
