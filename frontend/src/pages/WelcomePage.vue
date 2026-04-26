<template>
  <div class="wiz-page">
    <div class="wiz-page__head">
      <div class="wiz-page__head-icon">⎇</div>
      <div class="wiz-page__head-text">
        <div class="wiz-page__step-label">Step 1 of 4</div>
        <h1 class="wiz-page__title">Welcome to git-extract Setup</h1>
        <p class="wiz-page__desc">
          This wizard will guide you through extracting a subdirectory from any Git repository
          while preserving its full commit history.
        </p>
      </div>
    </div>

    <div class="wiz-page__body">
      <!-- What is this tool -->
      <div class="welcome-box q-mb-md">
        <div class="welcome-box__title">What does git-extract do?</div>
        <p class="welcome-box__text">
          <strong>git-extract</strong> splits a subdirectory out of a Git repository into a
          brand-new repository — keeping the <em>complete commit history</em> for every file
          in that path. No manual rebasing, no lost commits, no need to install anything locally.
        </p>
      </div>

      <!-- Steps overview -->
      <div class="welcome-steps">
        <div class="welcome-step">
          <div class="welcome-step__num">1</div>
          <div class="welcome-step__body">
            <div class="welcome-step__title">Welcome</div>
            <div class="welcome-step__desc">You are here. Read this overview, then click <strong>Next&nbsp;&gt;</strong>.</div>
          </div>
        </div>
        <div class="welcome-step">
          <div class="welcome-step__num">2</div>
          <div class="welcome-step__body">
            <div class="welcome-step__title">Sign In</div>
            <div class="welcome-step__desc">Connect your GitHub or GitLab account.</div>
          </div>
        </div>
        <div class="welcome-step">
          <div class="welcome-step__num">3</div>
          <div class="welcome-step__body">
            <div class="welcome-step__title">Select Repository</div>
            <div class="welcome-step__desc">Pick the repository that contains the path you want to extract.</div>
          </div>
        </div>
        <div class="welcome-step">
          <div class="welcome-step__num">4</div>
          <div class="welcome-step__body">
            <div class="welcome-step__title">Configure &amp; Extract</div>
            <div class="welcome-step__desc">
              Choose the source folder, target repository and branch, then click
              <strong>Extract &amp; Push</strong>. A GitHub Actions job rewrites history and
              pushes the result automatically.
            </div>
          </div>
        </div>
      </div>

      <p class="welcome-note">
        To continue, click <strong>Next &gt;</strong> below.
      </p>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import { useWizardNav } from '../composables/useWizardNav.js'

const router = useRouter()
const auth   = useAuthStore()
const nav    = useWizardNav()

onMounted(() => {
  nav.value = {
    backLabel: '< Back',
    backDisabled: true,
    onBack: null,
    nextLabel: 'Next >',
    nextDisabled: false,
    onNext: () => router.push(auth.isLoggedIn ? '/repos' : '/login'),
    finishLabel: 'Finish',
    finishDisabled: true,
    onFinish: null,
  }
})
</script>

<style lang="scss" scoped>
.welcome-box {
  max-width: 520px;
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
    margin: 0;
    line-height: 1.55;
  }
}

.welcome-steps {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-width: 520px;
  margin-bottom: 14px;
}

.welcome-step {
  display: flex;
  align-items: flex-start;
  gap: 10px;

  &__num {
    flex-shrink: 0;
    width: 20px;
    height: 20px;
    background: $secondary;
    color: #fff;
    font-size: 11px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 1px;
  }

  &__title {
    font-size: 12px;
    font-weight: 700;
    color: $primary;
  }

  &__desc {
    font-size: 11px;
    color: #444;
    margin-top: 1px;
    line-height: 1.4;
  }
}

.welcome-note {
  font-size: 11px;
  color: #666;
  margin: 0;
}
</style>
