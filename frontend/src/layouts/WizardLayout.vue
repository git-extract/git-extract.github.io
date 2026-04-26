<template>
  <Win98Window title="git-extract Setup" :width="860" :height="560" @close="onWindowClose">

    <!-- ── Body: sidebar + content ───────────────────────────── -->
    <div class="w98-body">

      <!-- Left step panel -->
      <div class="w98-sidebar">
        <div class="w98-sidebar__logo">⎇</div>
        <div class="w98-sidebar__product">git-extract</div>
        <div class="w98-sidebar__tagline">Setup Wizard</div>

        <div class="w98-sidebar__divider" />

        <div
          v-for="step in steps"
          :key="step.id"
          class="w98-sidebar__step"
          :class="{
            'w98-sidebar__step--active': currentStep === step.id,
            'w98-sidebar__step--done':   currentStep > step.id,
          }"
        >
          <span class="w98-sidebar__arrow">
            {{ currentStep > step.id ? '✔' : currentStep === step.id ? '►' : '○' }}
          </span>
          <span>{{ step.label }}</span>
        </div>

        <div v-if="auth.isLoggedIn" class="w98-sidebar__user">
          <img
            v-if="auth.user?.avatar_url"
            :src="auth.user.avatar_url"
            class="w98-sidebar__avatar"
          />
          <span class="w98-sidebar__username">
            {{ auth.user?.login || auth.user?.username }}
          </span>
        </div>
      </div>

      <!-- Right content pane -->
      <div class="w98-content">
        <router-view />
      </div>

    </div>

    <!-- ── Footer / button bar ───────────────────────────────── -->
    <div class="w98-footer">
      <div class="w98-sep" />
      <div class="w98-footer__inner">
        <div class="w98-footer__status">
          Step {{ currentStep }} of {{ steps.length }}
          <template v-if="auth.isLoggedIn">
            &nbsp;·&nbsp;
            <button class="w98-link-btn" @click="logout">Sign out</button>
          </template>
        </div>

        <div class="w98-footer__nav">
          <button
            class="w98-btn"
            :disabled="!nav.onBack || nav.backDisabled"
            @click="nav.onBack && nav.onBack()"
          >{{ nav.backLabel }}</button>

          <button
            class="w98-btn"
            :disabled="!nav.onNext || nav.nextDisabled"
            @click="nav.onNext && nav.onNext()"
          >{{ nav.nextLabel }}</button>

          <button
            class="w98-btn w98-btn--primary"
            :disabled="!nav.onFinish || nav.finishDisabled"
            @click="nav.onFinish && nav.onFinish()"
          >{{ nav.finishLabel }}</button>

          <div class="w98-btn-sep" />

          <button class="w98-btn" @click="logout">Cancel</button>
        </div>
      </div>
    </div>

  </Win98Window>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import { provideWizardNav } from '../composables/useWizardNav.js'
import Win98Window from '../components/Win98Window.vue'

const auth   = useAuthStore()
const route  = useRoute()
const router = useRouter()
const nav    = provideWizardNav()

const steps = [
  { id: 1, label: 'Welcome' },
  { id: 2, label: 'Sign In' },
  { id: 3, label: 'Select Repository' },
  { id: 4, label: 'Configure & Extract' },
]

const currentStep = computed(() => {
  const p = route.path
  if (p === '/' || p === '/welcome')           return 1
  if (p === '/login' || p.startsWith('/auth')) return 2
  if (p === '/repos')                          return 3
  if (p === '/extract')                        return 4
  return 1
})

function logout() {
  auth.logout()
  router.push('/welcome')
}

function onWindowClose() {
  // Window × button confirmed — reset auth and go to step 1
  auth.logout()
  router.push('/welcome')
}
</script>

<style lang="scss">
// ── Body ───────────────────────────────────────────────────────
.w98-body {
  display: flex;
  flex: 1;
  min-height: 0;
  margin: 3px;
  gap: 3px;
}

// ── Sidebar ────────────────────────────────────────────────────
.w98-sidebar {
  width: 176px;
  flex-shrink: 0;
  background: $primary;
  padding: 20px 0 12px;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  &__logo    { text-align: center; font-size: 32px; color: $secondary; margin-bottom: 6px; }
  &__product { text-align: center; font-size: 16px; font-weight: 700; color: #fff; letter-spacing: 0.5px; }
  &__tagline {
    text-align: center;
    font-size: 10px;
    color: rgba(255,255,255,0.45);
    margin-top: 2px;
    letter-spacing: 1px;
    text-transform: uppercase;
  }

  &__divider {
    margin: 14px 16px;
    border: none;
    border-top: 1px solid rgba(255,255,255,0.1);
    border-bottom: 1px solid rgba(0,0,0,0.4);
  }

  &__step {
    display: flex;
    align-items: flex-start;
    gap: 7px;
    padding: 5px 14px;
    font-size: 11px;
    color: rgba(255,255,255,0.35);
    line-height: 1.3;

    &--active {
      color: #fff;
      font-weight: 700;
      background: rgba(255,255,255,0.07);
    }
    &--done { color: $accent; }
  }

  &__arrow { flex-shrink: 0; font-size: 10px; margin-top: 1px; }

  &__user {
    margin-top: auto;
    padding: 10px 14px 0;
    display: flex;
    align-items: center;
    gap: 6px;
    border-top: 1px solid rgba(255,255,255,0.1);
  }

  &__avatar { width: 20px; height: 20px; border-radius: 2px; object-fit: cover; }

  &__username {
    font-size: 10px;
    color: rgba(255,255,255,0.5);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

// ── Content pane ───────────────────────────────────────────────
.w98-content {
  flex: 1;
  overflow-y: auto;
  background: #fff;
  box-shadow:
    inset  1px  1px #808080,
    inset -1px -1px #e8e8e8,
    inset  2px  2px #0a0a0a,
    inset -2px -2px #ffffff;
}

// ── Footer ─────────────────────────────────────────────────────
.w98-footer { flex-shrink: 0; padding: 0 4px 4px; }

.w98-sep {
  height: 0;
  margin: 0 0 4px;
  border-top: 1px solid #808080;
  border-bottom: 1px solid #fff;
}

.w98-footer__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.w98-footer__status {
  font-size: 11px;
  color: #444;
  padding-left: 4px;
}

.w98-footer__nav { display: flex; align-items: center; gap: 4px; }
</style>
