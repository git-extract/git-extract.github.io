<template>
  <div class="wiz-page">
    <div class="wiz-page__head">
      <div class="wiz-page__head-icon">⎇</div>
      <div class="wiz-page__head-text">
        <div class="wiz-page__step-label">Step 1 of 3</div>
        <h1 class="wiz-page__title">Welcome to git-extract Setup</h1>
        <p class="wiz-page__desc">Sign in to get started.</p>
      </div>
    </div>

    <div class="wiz-page__body">
      <!-- What is this tool? -->
      <div class="intro-box q-mb-md">
        <div class="intro-box__title">What does git-extract do?</div>
        <p class="intro-box__text">
          <strong>git-extract</strong> splits a subdirectory out of any Git repository into a
          brand-new repository — keeping the <em>complete commit history</em> for that path.
          No manual rebasing, no lost commits.
        </p>
        <table class="intro-steps">
          <tr>
            <td class="intro-steps__num">1.</td>
            <td><strong>Sign in</strong> — connect your GitHub or GitLab account.</td>
          </tr>
          <tr>
            <td class="intro-steps__num">2.</td>
            <td><strong>Select a source repository</strong> — pick the repo containing the path to extract.</td>
          </tr>
          <tr>
            <td class="intro-steps__num">3.</td>
            <td><strong>Configure &amp; extract</strong> — choose the source folder, target repo and branch, then click <strong>Extract &amp; Push</strong>. A GitHub Actions job rewrites history and pushes the result.</td>
          </tr>
        </table>
      </div>

      <q-banner v-if="errorMessage" class="w98-banner w98-banner--error q-mb-sm">
        {{ errorMessage }}
      </q-banner>

      <!-- Provider buttons -->
      <div class="w98-field-label">Sign in with:</div>

      <div class="w98-list" style="max-width: 400px">
        <div class="w98-list-row" @click="loginGithub">
          <q-icon name="fab fa-github" size="18px" />
          <span class="w98-list-row__name">GitHub</span>
          <span class="w98-list-row__meta">OAuth · public &amp; private repos</span>
        </div>
        <div class="w98-list-row" @click="loginGitlab">
          <q-icon name="fab fa-gitlab" size="18px" color="orange" />
          <span class="w98-list-row__name">GitLab</span>
          <span class="w98-list-row__meta">PKCE · gitlab.com or self-hosted</span>
        </div>
      </div>

      <div class="q-mt-sm" style="max-width: 400px">
        <div class="w98-field-label">GitLab host:</div>
        <input
          v-model="gitlabHost"
          class="w98-input"
          placeholder="gitlab.com"
        />
        <div style="font-size:10px;color:#808080;margin-top:2px">
          Change only for self-hosted GitLab instances.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { startGitlabLogin } from '../services/gitlab.js'
import { useWizardNav } from '../composables/useWizardNav.js'

const route = useRoute()
const nav = useWizardNav()
const gitlabHost = ref('gitlab.com')

// No Back/Next on welcome — user advances by authenticating
onMounted(() => {
  nav.value = { onBack: null, onNext: null, backLabel: '< Back', nextLabel: 'Next >', nextDisabled: false }
})

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
.intro-box {
  max-width: 500px;
  padding: 10px 12px;
  background: #fffff0;
  border: 2px solid;
  border-color: #808080 #fff #fff #808080;

  &__title {
    font-size: 12px;
    font-weight: 700;
    color: $primary;
    margin-bottom: 5px;
  }

  &__text {
    font-size: 11px;
    color: #333;
    margin: 0 0 8px;
    line-height: 1.5;
  }
}

.intro-steps {
  border-collapse: collapse;
  width: 100%;
  font-size: 11px;

  td { padding: 2px 4px; vertical-align: top; }

  &__num {
    font-weight: 700;
    color: $secondary;
    white-space: nowrap;
    padding-right: 6px;
  }
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
    inset -2px -2px #dfdfdf;
  background: #fff;
  box-sizing: border-box;
}

.w98-banner {
  font-size: 11px;
  padding: 6px 10px;
  border: 2px solid;

  &--error {
    background: #ffeeee;
    border-color: #c10015;
    color: #c10015;
  }
}
</style>
