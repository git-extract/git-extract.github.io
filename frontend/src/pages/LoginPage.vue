<template>
  <div class="wiz-page">
    <div class="wiz-page__head">
      <div class="wiz-page__head-icon">🔑</div>
      <div class="wiz-page__head-text">
        <div class="wiz-page__step-label">Step 2 of 4</div>
        <h1 class="wiz-page__title">Sign In</h1>
        <p class="wiz-page__desc">
          Select a Git provider, then click <strong>Sign In &gt;</strong>.
        </p>
      </div>
    </div>

    <div class="wiz-page__body">

      <!-- Error banner -->
      <div v-if="errorMessage" class="login-error">⚠ {{ errorMessage }}</div>

      <p class="login-intro">How would you like to sign in?</p>

      <!-- ── Provider radio options ──────────────────────────────── -->
      <div class="provider-options">
        <label
          v-for="p in providers"
          :key="p.id"
          class="provider-option"
        >
          <input
            type="radio"
            name="provider"
            :value="p.id"
            v-model="selected"
          />
          <div class="provider-option__body">
            <span class="provider-option__name">
              <q-icon :name="p.icon" class="provider-option__icon" :class="`provider-option__icon--${p.id}`" />
              {{ p.name }}
            </span>
            <span class="provider-option__desc">{{ p.desc }}</span>
          </div>
        </label>
      </div>

      <!-- ── GitLab host (only when GitLab selected) ─────────────── -->
      <transition name="slide">
        <div v-if="selected === 'gitlab'" class="gitlab-host-box">
          <div class="w98-group-box">
            <div class="w98-group-box__label">GitLab Instance</div>
            <div class="w98-group-box__body">
              <label class="w98-field-label" for="gl-host" style="display:block;margin-bottom:4px">
                Host:
              </label>
              <input
                id="gl-host"
                v-model="gitlabHost"
                class="w98-input-host"
                placeholder="gitlab.com"
                spellcheck="false"
              />
              <div class="host-hint">
                Use <code>gitlab.com</code> for the public instance.
                Change only for self-hosted GitLab servers.
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
const selected   = ref(null)
const gitlabHost = ref('gitlab.com')

const providers = [
  {
    id:   'github',
    name: 'GitHub',
    icon: 'fab fa-github',
    desc: 'Sign in with GitHub via OAuth — grants access to public and private repositories.',
  },
  {
    id:   'gitlab',
    name: 'GitLab',
    icon: 'fab fa-gitlab',
    desc: 'Sign in with GitLab via PKCE — works with gitlab.com or a self-hosted instance.',
  },
]

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
  margin-bottom: 10px;
  border: 2px solid #c10015;
  background: #ffeeee;
  color: #c10015;
  max-width: 420px;
}

// ── Intro text ─────────────────────────────────────────────────────
.login-intro {
  font-size: 12px;
  color: #000;
  margin: 0 0 10px;
}

// ── Provider radio options ─────────────────────────────────────────
// Intentionally plain — no boxes, no raised borders.
// This matches real Win98 wizard radio-button pages
// (Internet Connection Wizard, Add Hardware Wizard, etc.)
.provider-options {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-width: 440px;
  margin-bottom: 18px;
}

.provider-option {
  display: flex;
  align-items: flex-start;
  gap: 7px;
  padding: 4px 2px;
  cursor: pointer;
  user-select: none;

  // No background, no box-shadow — just the native radio + text on white

  input[type='radio'] {
    flex-shrink: 0;
    margin: 3px 0 0;
    cursor: pointer;
    accent-color: $primary;
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: 2px;
    line-height: 1;
  }

  &__name {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 12px;
    font-weight: 700;
    color: #000;
  }

  &__icon {
    font-size: 14px !important;
    color: #333;

    &--gitlab { color: #e24329; }
  }

  &__desc {
    font-size: 11px;
    color: #444;
    line-height: 1.45;
    padding-left: 19px; // indent to align under the name text
  }
}

// ── GitLab host group box ──────────────────────────────────────────
.gitlab-host-box { max-width: 380px; }

.w98-group-box {
  border: 1px solid #808080;
  box-shadow: 1px 1px 0 #fff;
  padding: 0 10px 10px;
  position: relative;
  margin-top: 2px;

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

  &__body { padding-top: 10px; }
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
  margin-bottom: 5px;
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

// ── Slide-down transition ──────────────────────────────────────────
.slide-enter-active { transition: opacity 0.15s, transform 0.15s; }
.slide-leave-active { transition: opacity 0.1s,  transform 0.1s; }
.slide-enter-from   { opacity: 0; transform: translateY(-4px); }
.slide-leave-to     { opacity: 0; transform: translateY(-4px); }
</style>
