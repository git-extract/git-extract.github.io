<template>
  <div class="wiz-page">
    <div class="wiz-page__head">
      <div class="wiz-page__head-icon">🔑</div>
      <div class="wiz-page__head-text">
        <div class="wiz-page__step-label">Step 2 of 4</div>
        <h1 class="wiz-page__title">Sign In</h1>
        <p class="wiz-page__desc">
          Select a Git provider, then click <strong>Sign In &gt;</strong> to connect your account.
        </p>
      </div>
    </div>

    <div class="wiz-page__body">

      <!-- Error banner -->
      <div v-if="errorMessage" class="login-error">⚠ {{ errorMessage }}</div>

      <div class="w98-field-label" style="margin-bottom:10px">
        Which provider would you like to use?
      </div>

      <!-- ── Provider tiles ──────────────────────────────────────── -->
      <div class="provider-tiles">

        <button
          class="provider-tile"
          :class="{ 'provider-tile--selected': selected === 'github' }"
          @click="selected = 'github'"
          @dblclick="proceed"
        >
          <q-icon name="fab fa-github" class="provider-tile__icon" />
          <div class="provider-tile__name">GitHub</div>
          <div class="provider-tile__meta">OAuth&nbsp;·&nbsp;public &amp; private repos</div>
        </button>

        <button
          class="provider-tile"
          :class="{ 'provider-tile--selected': selected === 'gitlab' }"
          @click="selected = 'gitlab'"
          @dblclick="proceed"
        >
          <q-icon name="fab fa-gitlab" class="provider-tile__icon provider-tile__icon--gitlab" />
          <div class="provider-tile__name">GitLab</div>
          <div class="provider-tile__meta">PKCE&nbsp;·&nbsp;gitlab.com or self-hosted</div>
        </button>

      </div>

      <!-- ── GitLab host (only when GitLab selected) ─────────────── -->
      <transition name="fade">
        <div v-if="selected === 'gitlab'" class="gitlab-host-box">
          <div class="w98-group-box">
            <div class="w98-group-box__label">GitLab Instance</div>
            <div class="w98-group-box__body">
              <label class="w98-field-label" for="gl-host">Host:</label>
              <input
                id="gl-host"
                v-model="gitlabHost"
                class="w98-input-host"
                placeholder="gitlab.com"
                spellcheck="false"
              />
              <div class="host-hint">
                Use <code>gitlab.com</code> for the public instance.
                Change for a self-hosted GitLab server.
              </div>
            </div>
          </div>
        </div>
      </transition>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { startGitlabLogin } from '../services/gitlab.js'
import { useWizardNav } from '../composables/useWizardNav.js'

const route      = useRoute()
const router     = useRouter()
const nav        = useWizardNav()
const selected   = ref(null)          // 'github' | 'gitlab' | null
const gitlabHost = ref('gitlab.com')

onMounted(updateNav)
watch(selected, updateNav)

function updateNav() {
  nav.value = {
    backLabel: '< Back',
    backDisabled: false,
    onBack: () => router.push('/welcome'),
    nextLabel: selected.value ? 'Sign In >' : 'Next >',
    nextDisabled: !selected.value,
    onNext: selected.value ? () => proceed() : null,
    finishLabel: 'Finish',
    finishDisabled: true,
    onFinish: null,
  }
}

const errorMessage = computed(() => {
  if (!route.query.error) return null
  const map = {
    no_token: 'Authentication failed: no token received.',
    no_code:  'Authentication failed: no code received.',
  }
  return map[route.query.error] ?? `Authentication error: ${route.query.error}`
})

async function proceed() {
  if (selected.value === 'github') loginGithub()
  else if (selected.value === 'gitlab') await loginGitlab()
}

function loginGithub() {
  const workerUrl   = process.env.WORKER_URL
  const clientId    = process.env.GITHUB_CLIENT_ID
  const redirectUri = `${workerUrl}/auth/github/callback`
  const params = new URLSearchParams({ client_id: clientId, scope: 'repo user', redirect_uri: redirectUri })
  window.location.href = `https://github.com/login/oauth/authorize?${params}`
}

async function loginGitlab() {
  await startGitlabLogin(gitlabHost.value, process.env.GITLAB_CLIENT_ID)
}
</script>

<style lang="scss" scoped>
// ── Error banner ───────────────────────────────────────────────────
.login-error {
  font-size: 11px;
  padding: 5px 10px;
  margin-bottom: 12px;
  border: 2px solid #c10015;
  background: #ffeeee;
  color: #c10015;
  max-width: 420px;
}

// ── Provider tiles ─────────────────────────────────────────────────
.provider-tiles {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
}

.provider-tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  width: 120px;
  padding: 14px 10px 10px;
  background: #F2F2F2;
  border: none;
  cursor: pointer;
  text-align: center;
  color: #000;
  font-family: 'Tahoma', 'MS Sans Serif', Arial, sans-serif;

  // Win98 raised button look
  box-shadow:
    inset -1px -1px #0a0a0a,
    inset  1px  1px #ffffff,
    inset -2px -2px #808080,
    inset  2px  2px #e8e8e8;

  &:hover:not(.provider-tile--selected) {
    background: #e4e4e4;
  }

  &:active:not(.provider-tile--selected) {
    box-shadow:
      inset -1px -1px #ffffff,
      inset  1px  1px #0a0a0a,
      inset -2px -2px #e8e8e8,
      inset  2px  2px #808080;
    padding-top: 15px;
    padding-left: 11px;
  }

  // Selected: sunken + navy fill
  &--selected {
    background: $primary;
    color: #fff;
    box-shadow:
      inset -1px -1px #ffffff,
      inset  1px  1px #0a0a0a,
      inset -2px -2px #e8e8e8,
      inset  2px  2px #808080;

    .provider-tile__icon      { color: #fff; }
    .provider-tile__icon--gitlab { color: #fff; }
    .provider-tile__meta      { color: rgba(255,255,255,0.65); }
  }

  &__icon {
    font-size: 36px !important;
    color: #333;

    &--gitlab { color: #e24329; }
  }

  &__name {
    font-size: 12px;
    font-weight: 700;
    line-height: 1;
  }

  &__meta {
    font-size: 10px;
    color: #666;
    line-height: 1.3;
  }
}

// ── GitLab host group box ──────────────────────────────────────────
.gitlab-host-box { max-width: 340px; }

.w98-group-box {
  border: 1px solid #808080;
  box-shadow: 1px 1px 0 #fff;
  padding: 0 10px 10px;
  position: relative;
  margin-top: 6px;

  &__label {
    position: absolute;
    top: -8px;
    left: 8px;
    background: #fff;
    padding: 0 3px;
    font-size: 11px;
    font-weight: 700;
    color: #000;
  }

  &__body { padding-top: 8px; }
}

.w98-input-host {
  width: 100%;
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
  margin-bottom: 4px;
}

.host-hint {
  font-size: 10px;
  color: #808080;
  line-height: 1.4;

  code {
    font-family: 'Courier New', monospace;
    font-size: 10px;
    background: #e8e8e8;
    padding: 0 2px;
  }
}

// ── Fade transition ────────────────────────────────────────────────
.fade-enter-active,
.fade-leave-active { transition: opacity 0.15s; }
.fade-enter-from,
.fade-leave-to     { opacity: 0; }
</style>
