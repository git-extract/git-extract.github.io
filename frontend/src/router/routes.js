const routes = [
  {
    path: '/',
    component: () => import('layouts/WizardLayout.vue'),
    children: [
      { path: '', redirect: '/repos' },
      { path: '/login', component: () => import('pages/LoginPage.vue') },
      { path: '/auth/github', component: () => import('pages/AuthCallback.vue') },
      { path: '/auth/gitlab', component: () => import('pages/AuthCallback.vue') },
      { path: '/repos', component: () => import('pages/ReposPage.vue'), meta: { requiresAuth: true } },
      { path: '/extract', component: () => import('pages/ExtractPage.vue'), meta: { requiresAuth: true } },
    ],
  },
  { path: '/:catchAll(.*)*', component: () => import('pages/ErrorNotFound.vue') },
]

export default routes
