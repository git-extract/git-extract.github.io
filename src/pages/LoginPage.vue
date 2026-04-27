<template>
  <div class="wiz-page">
    <div class="wiz-page__head">
      <div class="wiz-page__head-icon">🔑</div>
      <div class="wiz-page__head-text">
        <div class="wiz-page__step-label">Step 2 of 4</div>
        <h1 class="wiz-page__title">Sign In</h1>
        <p class="wiz-page__desc">
          Sign in to at least one Git provider to continue.
        </p>
      </div>
    </div>

    <div class="wiz-page__body">

      <!-- Error banner -->
      <div v-if="errorMessage" class="login-error">⚠ {{ errorMessage }}</div>

      <!-- ── Provider table ──────────────────────────────────────── -->
      <div class="provider-table-wrap">
        <div class="provider-table-toolbar">
          <!-- top-right Sign In dropdown -->
          <div class="signin-dropdown" ref="dropdownRef">
            <button
              class="w98-btn signin-dropdown__btn"
              @click="toggleDropdown"
              aria-haspopup="listbox"
              :aria-expanded="dropdownOpen"
            >
              Sign In ▾
            </button>
            <div v-if="dropdownOpen" class="signin-dropdown__menu" role="listbox">
              <button
                v-for="p in providers"
                :key="p.id"
                class="signin-dropdown__item"
                :disabled="auth.provider === p.id"
                @click="signIn(p.id)"
              >
                <q-icon :name="p.icon" class="signin-dropdown__icon" :class="`signin-dropdown__icon--${p.id}`" />
                Sign in with {{ p.name }}
              </button>
            </div>
          </div>
        </div>

        <table v-if="auth.isLoggedIn" class="provider-table">
          <thead>
            <tr>
              <th>Provider</th>
              <th>Identity</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="auth.provider === 'github'">
              <td class="provider-table__name">
                <q-icon name="fab fa-github" class="provider-table__icon" />
                GitHub
              </td>
              <td class="provider-table__identity">
                {{ auth.user?.login }}
              </td>
              <td class="provider-table__actions">
                <button class="w98-link-btn" @click="auth.logout()">Sign out</button>
              </td>
            </tr>
            <tr v-if="auth.provider === 'gitlab'">
              <td class="provider-table__name">
                <q-icon name="fab fa-gitlab" class="provider-table__icon provider-table__icon--gitlab" />
                GitLab
              </td>
              <td class="provider-table__identity">
                {{ auth.user?.username }}
              </td>
              <td class="provider-table__actions">
                <button class="w98-link-btn" @click="auth.logout()">Sign out</button>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- GitLab host input — shown below the table when gitlab is the active provider
             or when a gitlab sign-in is pending -->
        <transition name="slide">
          <div v-if="showHostBox" class="gitlab-host-box">
            <div class="w98-group-box">
              <div class="w98-group-box__label">GitLab Instance</div>
              <div class="w98-group-box__body">
                <label class="w98-field-label" for="gl-host" style="display:block;margin-bottom:4px">Host:</label>
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
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { startGitlabLogin } from '../services/gitlab.js'
import { useWizardNav } from '../composables/useWizardNav.js'
import { useAuthStore } from '../stores/auth.js'

const route      = useRoute()
const router     = useRouter()
const nav        = useWizardNav()
const auth       = useAuthStore()
const gitlabHost = ref('gitlab.com')
const dropdownOpen = ref(false)
const dropdownRef  = ref(null)
const pendingGitlab = ref(false)

const providers = [
  { id: 'github', name: 'GitHub', icon: 'fab fa-github' },
  { id: 'gitlab', name: 'GitLab', icon: 'fab fa-gitlab' },
]

const showHostBox = computed(() => pendingGitlab.value || auth.provider === 'gitlab')

onMounted(() => {
  updateNav()
  document.addEventListener('click', onDocClick)
})
onBeforeUnmount(() => document.removeEventListener('click', onDocClick))
watch(() => auth.isLoggedIn, updateNav)

function updateNav() {
  nav.value = {
    backLabel:    '< Back',
    backDisabled: false,
    onBack:       () => router.push('/welcome'),
    nextLabel:    'Next >',
    nextDisabled: !auth.isLoggedIn,
    onNext:       auth.isLoggedIn ? () => router.push('/repos') : null,
    finishLabel:  'Finish',
    finishDisabled: true,
    onFinish:     null,
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

function toggleDropdown() {
  dropdownOpen.value = !dropdownOpen.value
}

function onDocClick(e) {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target)) {
    dropdownOpen.value = false
  }
}

async function signIn(providerId) {
  dropdownOpen.value = false
  if (providerId === 'github') {
    loginGithub()
  } else if (providerId === 'gitlab') {
    pendingGitlab.value = true
    await loginGitlab()
  }
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
  max-width: 460px;
}

// ── Provider table wrapper ─────────────────────────────────────────
.provider-table-wrap {
  width: 100%;
}

// ── Toolbar (holds the Sign In dropdown) ──────────────────────────
.provider-table-toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 4px;
}

// ── Sign In dropdown ──────────────────────────────────────────────
.signin-dropdown {
  position: relative;

  &__btn {
    min-width: 80px;
  }

  &__menu {
    position: absolute;
    top: calc(100% + 2px);
    right: 0;
    z-index: 100;
    background: #c0c0c0;
    border: 2px solid;
    border-color: #ffffff #808080 #808080 #ffffff;
    box-shadow: 1px 1px 0 #000;
    min-width: 200px;
    padding: 2px 0;
  }

  &__item {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    padding: 3px 14px;
    background: none;
    border: none;
    font-family: 'Tahoma', 'MS Sans Serif', Arial, sans-serif;
    font-size: 12px;
    color: #000;
    cursor: pointer;
    text-align: left;

    &:hover:not(:disabled) {
      background: #000080;
      color: #fff;

      .signin-dropdown__icon { color: #fff; }
    }

    &:disabled {
      color: #808080;
      cursor: default;
    }
  }

  &__icon {
    font-size: 13px !important;
    color: #333;

    &--gitlab { color: #e24329; }
  }
}

// ── Provider table ─────────────────────────────────────────────────
.provider-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  border: 2px solid;
  border-color: #808080 #ffffff #ffffff #808080;
  box-shadow: inset 1px 1px 0 #000;
  background: #fff;
  margin-bottom: 12px;

  thead tr {
    background: #000080;
    color: #fff;
  }

  th {
    padding: 3px 8px;
    font-weight: 700;
    text-align: left;
    font-size: 11px;
    letter-spacing: 0.02em;
  }

  td {
    padding: 5px 8px;
    border-top: 1px solid #e0e0e0;
    color: #000;
    vertical-align: middle;
  }

  tbody tr:hover { background: #f0f0f0; }

  &__row--active td { background: #ddeeff; }
  &__row--active:hover td { background: #cce0ff; }

  &__name {
    display: flex;
    align-items: center;
    gap: 6px;
    font-weight: 700;
    white-space: nowrap;
  }

  &__icon {
    font-size: 14px !important;
    color: #333;

    &--gitlab { color: #e24329; }
  }

  &__identity { color: #000; font-weight: 700; }

  &__actions {
    text-align: right;
    white-space: nowrap;
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
