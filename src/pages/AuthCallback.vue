<template>
  <q-page class="flex flex-center">
    <q-spinner size="50px" />
  </q-page>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import { exchangeGitlabCode } from '../services/gitlab.js'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

onMounted(async () => {
  if (route.path.includes('github')) {
    const token = route.query.token
    if (token) {
      await auth.loginWithToken('github', token)
      router.push('/repos')
    } else {
      router.push('/login?error=no_token')
    }
  } else if (route.path.includes('gitlab')) {
    const code = route.query.code
    if (code) {
      const gitlabHost = sessionStorage.getItem('gitlab_host') || 'gitlab.com'
      const { access_token } = await exchangeGitlabCode(code)
      await auth.loginWithToken('gitlab', access_token, gitlabHost)
      router.push('/repos')
    } else {
      router.push('/login?error=no_code')
    }
  }
})
</script>
