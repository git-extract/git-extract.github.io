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
      <!-- Tool description -->
      <div class="tool-intro q-mb-xl">
        <div class="tool-intro__headline">What is git-extract?</div>
        <p class="tool-intro__text">
          <strong>git-extract</strong> splits a subdirectory out of any Git repository into a
          brand-new repository — keeping the <em>complete commit history</em> for that path.
          No manual rebasing, no lost commits.
        </p>
        <div class="tool-intro__steps">
          <div class="tool-intro__step">
            <div class="tool-intro__step-num">1</div>
            <div>
              <div class="tool-intro__step-title">Sign in</div>
              <div class="tool-intro__step-desc">Connect your GitHub or GitLab account.</div>
            </div>
          </div>
          <div class="tool-intro__step">
            <div class="tool-intro__step-num">2</div>
            <div>
              <div class="tool-intro__step-title">Select a source repository</div>
              <div class="tool-intro__step-desc">Pick the repo that contains the path you want to extract.</div>
            </div>
          </div>
          <div class="tool-intro__step">
            <div class="tool-intro__step-num">3</div>
            <div>
              <div class="tool-intro__step-title">Configure &amp; extract</div>
              <div class="tool-intro__step-desc">
                Choose the source folder, the target repository and branch, then click
                <strong>Extract &amp; Push</strong>. A GitHub Actions job rewrites history and
                pushes the result.
              </div>
            </div>
          </div>
        </div>
      </div>

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
.tool-intro {
  max-width: 560px;
  padding: 20px 24px;
  border: 1px solid #d8d8d8;
  border-left: 4px solid $secondary;
  border-radius: 3px;
  background: #f8fdf9;

  &__headline {
    font-size: 13px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: $primary;
    margin-bottom: 8px;
  }

  &__text {
    font-size: 13px;
    color: #444;
    margin: 0 0 16px;
    line-height: 1.6;
  }

  &__steps {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  &__step {
    display: flex;
    align-items: flex-start;
    gap: 12px;
  }

  &__step-num {
    flex-shrink: 0;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: $secondary;
    color: #fff;
    font-size: 12px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 1px;
  }

  &__step-title {
    font-size: 13px;
    font-weight: 600;
    color: $primary;
  }

  &__step-desc {
    font-size: 12px;
    color: #666;
    margin-top: 1px;
    line-height: 1.5;
  }
}

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
