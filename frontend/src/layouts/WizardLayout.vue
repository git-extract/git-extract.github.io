<template>
  <div class="wiz-shell">
    <!-- ── Header ─────────────────────────────────────────────────── -->
    <header class="wiz-header">
      <div class="wiz-header__brand">
        <q-icon name="merge_type" size="28px" class="q-mr-sm" />
        <div>
          <div class="wiz-header__title">git-extract</div>
          <div class="wiz-header__sub">Extract any path. Keep all history.</div>
        </div>
      </div>

      <div v-if="auth.isLoggedIn" class="wiz-header__user">
        <img
          v-if="auth.user?.avatar_url"
          :src="auth.user.avatar_url"
          class="wiz-header__avatar"
        />
        <q-icon v-else name="person" color="white" size="20px" />
        <span class="q-mx-sm">{{ auth.user?.login || auth.user?.username }}</span>
        <q-badge :label="auth.provider" color="secondary" class="q-mr-sm" />
        <q-btn
          flat
          dense
          size="sm"
          color="white"
          label="Sign out"
          @click="logout"
        />
      </div>
    </header>

    <!-- ── Body ──────────────────────────────────────────────────── -->
    <div class="wiz-body">
      <!-- Left step panel -->
      <nav class="wiz-nav">
        <div class="wiz-nav__label">Steps</div>

        <div
          v-for="step in steps"
          :key="step.id"
          class="wiz-step"
          :class="{
            'wiz-step--active': currentStep === step.id,
            'wiz-step--done': currentStep > step.id,
          }"
        >
          <div class="wiz-step__icon">
            <q-icon
              v-if="currentStep > step.id"
              name="check_circle"
              size="18px"
              color="secondary"
            />
            <div v-else-if="currentStep === step.id" class="wiz-dot wiz-dot--active" />
            <div v-else class="wiz-dot wiz-dot--idle" />
          </div>
          <div class="wiz-step__text">{{ step.label }}</div>
        </div>
      </nav>

      <!-- Content pane -->
      <main class="wiz-content">
        <router-view />
      </main>
    </div>

    <!-- ── Footer ─────────────────────────────────────────────────── -->
    <footer class="wiz-footer">
      git-extract &copy; {{ year }}
    </footer>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const year = new Date().getFullYear()

const steps = [
  { id: 1, label: 'Sign In' },
  { id: 2, label: 'Select Repository' },
  { id: 3, label: 'Configure' },
  { id: 4, label: 'Extract' },
]

const currentStep = computed(() => {
  const p = route.path
  if (p === '/login' || p.startsWith('/auth')) return 1
  if (p === '/repos') return 2
  if (p === '/extract') return route.query.done ? 4 : 3
  return 1
})

function logout() {
  auth.logout()
  router.push('/login')
}
</script>

<style lang="scss">
/* ── Shell ─────────────────────────────────────────────────────── */
.wiz-shell {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  font-family: 'Segoe UI', Roboto, sans-serif;
}

/* ── Header ────────────────────────────────────────────────────── */
.wiz-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: 64px;
  background: $primary;
  color: #fff;
  flex-shrink: 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
  z-index: 10;

  &__brand {
    display: flex;
    align-items: center;
  }

  &__title {
    font-size: 18px;
    font-weight: 700;
    letter-spacing: 0.3px;
  }

  &__sub {
    font-size: 11px;
    opacity: 0.65;
    margin-top: 1px;
  }

  &__user {
    display: flex;
    align-items: center;
    font-size: 13px;
    color: #fff;
  }

  &__avatar {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    object-fit: cover;
  }
}

/* ── Body ──────────────────────────────────────────────────────── */
.wiz-body {
  display: flex;
  flex: 1;
  min-height: 0;
}

/* ── Step nav ──────────────────────────────────────────────────── */
.wiz-nav {
  width: 200px;
  flex-shrink: 0;
  background: $dark;
  padding: 24px 0;
  border-right: 1px solid rgba(255, 255, 255, 0.06);

  &__label {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 1.2px;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.35);
    padding: 0 20px 12px;
  }
}

.wiz-step {
  display: flex;
  align-items: center;
  padding: 10px 20px;
  gap: 12px;
  transition: background 0.15s;

  &--active {
    background: rgba(255, 255, 255, 0.07);
  }

  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    flex-shrink: 0;
  }

  &__text {
    font-size: 13px;
    font-weight: 400;
    color: rgba(255, 255, 255, 0.45);
    white-space: nowrap;

    .wiz-step--active & {
      color: #fff;
      font-weight: 600;
    }

    .wiz-step--done & {
      color: rgba(255, 255, 255, 0.6);
    }
  }
}

.wiz-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;

  &--active {
    background: $secondary;
    box-shadow: 0 0 0 3px rgba(46, 168, 78, 0.25);
  }

  &--idle {
    border: 2px solid rgba(255, 255, 255, 0.2);
  }
}

/* ── Content ───────────────────────────────────────────────────── */
.wiz-content {
  flex: 1;
  overflow-y: auto;
  background: #fff;
}

/* ── Footer ────────────────────────────────────────────────────── */
.wiz-footer {
  flex-shrink: 0;
  height: 32px;
  line-height: 32px;
  padding: 0 24px;
  background: #e4e4e4;
  border-top: 1px solid #c0c0c0;
  font-size: 11px;
  color: #666;
}
</style>
