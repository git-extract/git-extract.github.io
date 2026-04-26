<template>
  <div class="wiz-page">
    <div class="wiz-page__head">
      <div class="wiz-page__head-icon">🔑</div>
      <div class="wiz-page__head-text">
        <div class="wiz-page__step-label">Step 2 of 4</div>
        <h1 class="wiz-page__title">Sign In</h1>
        <p class="wiz-page__desc">
          Connect your account to browse repositories and run extractions.
        </p>
      </div>
    </div>

    <div class="wiz-page__body">
      <q-banner v-if="errorMessage" class="login-error q-mb-sm">
        {{ errorMessage }}
      </q-banner>

      <div class="w98-field-label">Select a provider:</div>

      <div class="w98-list" style="max-width: 400px">
        <div class="w98-list-row" @click="loginGithub">
          <q-icon name="fab fa-github" size="16px" />
          <span class="w98-list-row__name">GitHub</span>
          <span class="w98-list-row__meta">OAuth · public &amp; private repos</span>
        </div>
        <div class="w98-list-row" @click="loginGitlab">
          <q-icon name="fab fa-gitlab" size="16px" color="orange" />
          <span class="w98-list-row__name">GitLab</span>
          <span class="w98-list-row__meta">PKCE · gitlab.com or self-hosted</span>
        </div>
      </div>

      <div class="q-mt-sm" style="max-width: 400px">
        <div class="w98-field-label">GitLab host:</div>
        <input v-model="gitlabHost" class="w98-input" placeholder="gitlab.com" />
        <div style="font-size:10px;color:#808080;margin-top:2px">
          Change only for self-hosted GitLab instances.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { startGitlabLogin } from '../services/gitlab.js'
import { useWizardNav } from '../composables/useWizardNav.js'

const route  = useRoute()
const router = useRouter()
const nav    = useWizardNav()
const gitlabHost = ref('gitlab.com')

onMounted(() => {
  nav.value = {
    backLabel: '< Back',
    backDisabled: false,
    onBack: () => router.push('/welcome'),
    nextLabel: 'Next >',
    nextDisabled: true,     // user advances by clicking a provider
    onNext: null,
    finishLabel: 'Finish',
    finishDisabled: true,
    onFinish: null,
  }
})

const errorMessage = computed(() => {
  if (!route.query.error) return null
  const map = {
    no_token: 'Authentication failed: no token received.',
    no_code:  'Authentication failed: no code received.',
  }
  return map[route.query.error] ?? `Authentication error: ${route.query.error}`
})

function loginGithub() {
  const workerUrl = process.env.WORKER_URL
  const clientId  = process.env.GITHUB_CLIENT_ID
  const redirectUri = `${workerUrl}/auth/github/callback`
  const params = new URLSearchParams({ client_id: clientId, scope: 'repo user', redirect_uri: redirectUri })
  window.location.href = `https://github.com/login/oauth/authorize?${params}`
}

async function loginGitlab() {
  await startGitlabLogin(gitlabHost.value, process.env.GITLAB_CLIENT_ID)
}
</script>

<style lang="scss" scoped>
.login-error {
  font-size: 11px;
  padding: 6px 10px;
  border: 2px solid #c10015;
  background: #ffeeee;
  color: #c10015;
}

.w98-input {
  width: 100%;
  max-width: 400px;
  height: 21px;
  padding: 2px 4px;
  font-family: 'Tahoma', 'MS Sans Serif', Arial, sans-serif;
  font-size: 12px;
  border: none;
  box-shadow:
    inset  1px  1px #0a0a0a,
    inset -1px -1px #ffffff,
    inset  2px  2px #808080,
    inset -2px -2px #e8e8e8;
  background: #fff;
  box-sizing: border-box;
}
</style>
