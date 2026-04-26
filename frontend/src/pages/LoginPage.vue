<template>
  <div class="wiz-page">
    <div class="wiz-page__head">
      <div class="wiz-page__step-label">Step 1 of 3</div>
      <h1 class="wiz-page__title">Sign In</h1>
      <p class="wiz-page__desc">
        Connect your account to browse repositories and run extractions.
      </p>
    </div>

    <div class="wiz-page__body">
      <q-banner v-if="errorMessage" rounded class="bg-negative text-white q-mb-lg">
        {{ errorMessage }}
      </q-banner>

      <div class="login-providers">
        <!-- GitHub -->
        <div class="provider-row" @click="loginGithub">
          <q-icon name="fab fa-github" size="32px" class="provider-row__icon" />
          <div class="provider-row__body">
            <div class="provider-row__name">Sign in with GitHub</div>
            <div class="provider-row__hint">OAuth — public &amp; private repos</div>
          </div>
          <q-icon name="chevron_right" size="20px" color="grey-5" />
        </div>

        <div class="provider-sep">or</div>

        <!-- GitLab host input -->
        <div class="q-mb-sm">
          <q-input
            v-model="gitlabHost"
            outlined
            dense
            label="GitLab host"
            prefix="https://"
            hint="Change only for self-hosted GitLab instances"
          />
        </div>

        <!-- GitLab -->
        <div class="provider-row" @click="loginGitlab">
          <q-icon name="fab fa-gitlab" size="32px" color="orange" class="provider-row__icon" />
          <div class="provider-row__body">
            <div class="provider-row__name">Sign in with GitLab</div>
            <div class="provider-row__hint">PKCE — gitlab.com or self-hosted</div>
          </div>
          <q-icon name="chevron_right" size="20px" color="grey-5" />
        </div>
      </div>
    </div>
    <!-- no footer nav: user advances by authenticating -->
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { startGitlabLogin } from '../services/gitlab.js'

const route = useRoute()
const gitlabHost = ref('gitlab.com')

const errorMessage = computed(() => {
  if (!route.query.error) return null
  const map = {
    no_token: 'Authentication failed: no token received.',
    no_code: 'Authentication failed: no code received.',
  }
  return map[route.query.error] ?? `Authentication error: ${route.query.error}`
})

function loginGithub() {
  const workerUrl = process.env.WORKER_URL
  const clientId = process.env.GITHUB_CLIENT_ID
  const redirectUri = `${workerUrl}/auth/github/callback`
  const params = new URLSearchParams({ client_id: clientId, scope: 'repo user', redirect_uri: redirectUri })
  window.location.href = `https://github.com/login/oauth/authorize?${params}`
}

async function loginGitlab() {
  await startGitlabLogin(gitlabHost.value, process.env.GITLAB_CLIENT_ID)
}
</script>

<style lang="scss" scoped>
.login-providers {
  max-width: 460px;
}

.provider-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 18px;
  border: 1px solid #d4d4d4;
  border-radius: 3px;
  cursor: pointer;
  background: #fff;
  transition: border-color 0.12s, background 0.12s, box-shadow 0.12s;

  &:hover {
    border-color: $primary;
    background: #f0f4fa;
    box-shadow: 0 1px 4px rgba(30, 46, 74, 0.12);
  }

  &__icon {
    flex-shrink: 0;
  }

  &__body {
    flex: 1;
  }

  &__name {
    font-size: 14px;
    font-weight: 600;
    color: $primary;
  }

  &__hint {
    font-size: 12px;
    color: #777;
    margin-top: 2px;
  }
}

.provider-sep {
  text-align: center;
  color: #bbb;
  font-size: 12px;
  margin: 10px 0;
}
</style>
