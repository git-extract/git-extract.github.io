const routes = [
  {
    path: '/',
    component: () => import('layouts/WizardLayout.vue'),
    children: [
      { path: '', redirect: '/welcome' },
      { path: '/welcome', component: () => import('pages/WelcomePage.vue') },
      { path: '/login',   component: () => import('pages/LoginPage.vue') },
      { path: '/auth/github', component: () => import('pages/AuthCallback.vue') },
      { path: '/auth/gitlab', component: () => import('pages/AuthCallback.vue') },
      { path: '/repos', component: () => import('pages/ReposPage.vue'), meta: { requiresAuth: true } },
      // /extract → always land on the first extract sub-step
      { path: '/extract', redirect: '/extract/paths' },
      { path: '/extract/paths',    component: () => import('pages/ExtractPathsPage.vue'),    meta: { requiresAuth: true } },
      { path: '/extract/options',  component: () => import('pages/ExtractOptionsPage.vue'),  meta: { requiresAuth: true } },
      { path: '/extract/progress', component: () => import('pages/ExtractProgressPage.vue'), meta: { requiresAuth: true } },
      { path: '/extract/finish',   component: () => import('pages/ExtractFinishPage.vue'),   meta: { requiresAuth: true } },
    ],
  },
  { path: '/:catchAll(.*)*', component: () => import('pages/ErrorNotFound.vue') },
]

export default routes
