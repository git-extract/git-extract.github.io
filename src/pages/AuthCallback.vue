<template>
  <div class="wiz-page">
    <div class="auth-loading">
      <q-spinner size="32px" color="primary" />
      <span>Signing in…</span>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import { exchangeGitlabCode } from '../services/gitlab.js'

const STATE_KEY = 'github_oauth_state'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

onMounted(async () => {
  if (route.path.includes('github')) {
    const token = route.query.token
    const state = route.query.state

    // Popup mode: send result to opener and close
    if (window.opener) {
      window.opener.postMessage(
        token
          ? { type: 'github-oauth-callback', token, state }
          : { type: 'github-oauth-callback', error: 'no_token' },
        window.location.origin,
      )
      window.close()
      return
    }

    // Fallback: popup was blocked, running as a full-page redirect
    const storedState = sessionStorage.getItem(STATE_KEY)
    sessionStorage.removeItem(STATE_KEY)

    if (!token) {
      router.push('/login?error=no_token')
      return
    }

    if (!state || state !== storedState) {
      router.push('/login?error=invalid_state')
      return
    }

    await auth.loginWithToken('github', token)
    router.push('/repos')
  } else if (route.path.includes('gitlab')) {
    const code = route.query.code
    if (!code) {
      router.push('/login?error=no_code')
      return
    }
    try {
      const { access_token } = await exchangeGitlabCode(code)
      if (!access_token) throw new Error('no token')
      const gitlabHost = sessionStorage.getItem('gitlab_host') || 'gitlab.com'
      await auth.loginWithToken('gitlab', access_token, gitlabHost)
      router.push('/repos')
    } catch {
      router.push('/login?error=no_token')
    }
  }
})
</script>

<style lang="scss" scoped>
.auth-loading {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  font-size: 12px;
  color: #444;
}
</style>
