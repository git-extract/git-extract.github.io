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
      <div v-if="errorMessage || oauthError" class="login-error">⚠ {{ errorMessage || oauthError }}</div>

      <!-- ── Provider section ─────────────────────────────────────── -->
      <div class="provider-section">

        <!-- toolbar -->
        <div class="provider-toolbar">
          <div class="signin-dropdown" ref="dropdownRef">
            <button
              class="w98-btn"
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

        <!-- Win98 Details-view listview -->
        <div class="provider-listview">
          <table>
            <thead>
              <tr>
                <th class="col-provider">Provider</th>
                <th class="col-identity">Identity</th>
                <th class="col-actions"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in signedInProviders" :key="p.id">
                <td class="col-provider">
                  <q-icon :name="p.icon" class="row-icon" :class="`row-icon--${p.id}`" />
                  {{ p.name }}
                </td>
                <td class="col-identity">{{ p.identity }}</td>
                <td class="col-actions">
                  <button class="w98-link-btn" @click="auth.logout()">Sign out</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- GitLab host input -->
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
const dropdownOpen  = ref(false)
const dropdownRef   = ref(null)
const pendingGitlab = ref(false)
const oauthError    = ref(null)
const popupCleanup  = ref(null)

const providers = [
  { id: 'github', name: 'GitHub', icon: 'fab fa-github' },
  { id: 'gitlab', name: 'GitLab', icon: 'fab fa-gitlab' },
]

const signedInProviders = computed(() => {
  if (!auth.isLoggedIn || !auth.provider) return []
  const meta = providers.find(p => p.id === auth.provider)
  if (!meta) return []
  const identity = auth.provider === 'github'
    ? auth.user?.login
    : auth.user?.username
  return [{ ...meta, identity }]
})

const showHostBox = computed(() => pendingGitlab.value || auth.provider === 'gitlab')

onMounted(() => {
  // If the worker redirected an OAuth popup back here with an error,
  // forward it to the parent window and close the popup.
  if (window.opener && route.query.error) {
    window.opener.postMessage(
      { type: 'github-oauth-callback', error: route.query.error },
      '*',
    )
    window.close()
    return
  }

  updateNav()
  document.addEventListener('click', onDocClick)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick)
  popupCleanup.value?.()
})
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
    no_token:      'Authentication failed: no token received.',
    no_code:       'Authentication failed: no code received.',
    invalid_state: 'Authentication failed: state mismatch — possible CSRF attack.',
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
  oauthError.value = null
  const state = crypto.randomUUID()
  sessionStorage.setItem('github_oauth_state', state)

  const workerUrl   = process.env.WORKER_URL
  const clientId    = process.env.GITHUB_CLIENT_ID
  const redirectUri = `${workerUrl}/callback/github`
  const params = new URLSearchParams({ client_id: clientId, scope: 'repo user', redirect_uri: redirectUri, state })
  const authUrl = `https://github.com/login/oauth/authorize?${params}`

  const popup = window.open(authUrl, 'github-oauth', 'width=600,height=700,popup=1')

  if (!popup) {
    // popup was blocked — fall back to full-page redirect
    window.location.href = authUrl
    return
  }

  function onMessage(event) {
    if (event.data?.type !== 'github-oauth-callback') return
    cleanup()

    const { token, state: returnedState, error } = event.data
    const storedState = sessionStorage.getItem('github_oauth_state')
    sessionStorage.removeItem('github_oauth_state')

    if (error) {
      oauthError.value = `Authentication failed: ${error.replaceAll('_', ' ')}.`
      return
    }

    if (!token || returnedState !== storedState) {
      oauthError.value = 'Authentication failed: invalid response from GitHub.'
      return
    }

    auth.loginWithToken('github', token)
  }

  const timer = setInterval(() => { if (popup.closed) cleanup() }, 500)

  function cleanup() {
    clearInterval(timer)
    window.removeEventListener('message', onMessage)
    popupCleanup.value = null
  }

  popupCleanup.value = cleanup
  window.addEventListener('message', onMessage)
}

async function loginGitlab() {
  await startGitlabLogin(gitlabHost.value, process.env.GITLAB_CLIENT_ID)
}
</script>

<style lang="scss" scoped>
// ── Make body a flex column so children can fill remaining height ──
.wiz-page__body {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

// ── Error banner ───────────────────────────────────────────────────
.login-error {
  flex-shrink: 0;
  font-size: 11px;
  padding: 5px 10px;
  margin-bottom: 8px;
  border: 2px solid #c10015;
  background: #ffeeee;
  color: #c10015;
}

// ── Provider section — fills remaining body height ─────────────────
.provider-section {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

// ── Toolbar ────────────────────────────────────────────────────────
.provider-toolbar {
  flex-shrink: 0;
  display: flex;
  justify-content: flex-end;
  margin-bottom: 3px;
}

// ── Sign In dropdown ──────────────────────────────────────────────
.signin-dropdown {
  position: relative;

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
      .signin-dropdown__icon { color: #fff !important; }
    }

    &:disabled { color: #808080; cursor: default; }
  }

  &__icon {
    font-size: 13px !important;
    color: #333;
    &--gitlab { color: #e24329; }
  }
}

// ── Win98 Details-view listview ────────────────────────────────────
.provider-listview {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  // Sunken inset border — classic Win98 ListBox / ListView
  border: 2px solid;
  border-color: #808080 #ffffff #ffffff #808080;
  box-shadow:
    inset 1px 1px 0 #0a0a0a,
    inset -1px -1px 0 #e8e8e8;
  background: #fff;

  table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
  }

  thead tr {
    position: sticky;
    top: 0;
    z-index: 1;
  }

  th {
    background: #d4d0c8;
    // Raised Win98 column-header 3D look
    box-shadow: inset -1px -1px #808080, inset 1px 1px #ffffff;
    padding: 2px 6px;
    font-size: 11px;
    font-weight: 700;
    text-align: left;
    white-space: nowrap;
    cursor: default;
    user-select: none;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  td {
    padding: 2px 6px;
    font-size: 12px;
    vertical-align: middle;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    border-bottom: 1px solid #f0f0f0;
  }

  tbody tr:hover td {
    background: #000080;
    color: #fff;

    .row-icon { color: #fff !important; }
    .w98-link-btn { color: #fff; }
  }
}

// ── Column widths ──────────────────────────────────────────────────
.col-provider  { width: 140px; }
.col-identity  { width: auto; }
.col-actions   { width: 70px; text-align: right; }

// ── Row icon ──────────────────────────────────────────────────────
.row-icon {
  font-size: 13px !important;
  margin-right: 5px;
  vertical-align: middle;
  color: #333;
  &--gitlab { color: #e24329; }
}

// ── GitLab host group box ──────────────────────────────────────────
.gitlab-host-box {
  flex-shrink: 0;
  margin-top: 8px;
}

.w98-group-box {
  border: 1px solid #808080;
  box-shadow: 1px 1px 0 #fff;
  padding: 0 10px 10px;
  position: relative;

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
