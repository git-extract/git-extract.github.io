<template>
  <div class="wiz-page">
    <div class="wiz-page__head">
      <div class="wiz-page__head-icon">🎉</div>
      <div class="wiz-page__head-text">
        <div class="wiz-page__step-label">Step 7 of 7</div>
        <h1 class="wiz-page__title">Extraction Complete</h1>
        <p class="wiz-page__desc">
          git-extract Setup has finished copying files to the target repository.
        </p>
      </div>
    </div>

    <div class="wiz-page__body">
      <div class="fin-content">

        <p class="fin-intro">
          The following operation completed successfully:
        </p>

        <!-- Summary panel -->
        <div class="w98-panel fin-panel">
          <div class="w98-panel__body">

            <div class="fin-row">
              <span class="fin-key">Source</span>
              <span class="fin-val">
                {{ source?.fullName }}
                <span class="fin-branch">{{ store.sourceBranch }}</span>
              </span>
            </div>

            <div class="fin-row">
              <span class="fin-key">Path</span>
              <span class="fin-val"><code>{{ store.sourcePath || '/' }}</code></span>
            </div>

            <div class="fin-sep" />

            <div class="fin-row">
              <span class="fin-key">Target</span>
              <span class="fin-val">
                <a
                  v-if="targetUrl"
                  :href="targetUrl"
                  target="_blank"
                  class="fin-link"
                >{{ target?.fullName }}</a>
                <span v-else>{{ target?.fullName }}</span>
                <span class="fin-branch">{{ store.targetBranch }}</span>
              </span>
            </div>

            <div class="fin-row">
              <span class="fin-key">Written to</span>
              <span class="fin-val"><code>{{ store.targetPath || 'root' }}</code></span>
            </div>

            <template v-if="store.generateProjectFile">
              <div class="fin-sep" />
              <div class="fin-row">
                <span class="fin-key">Project file</span>
                <span class="fin-val fin-val--ok">✔ .git-extract.json written</span>
              </div>
            </template>

          </div>
        </div>

        <p class="fin-outro">
          Click <strong>Finish</strong> to close Setup, or
          <strong>Restart</strong> to start a new extraction.
        </p>

      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useReposStore } from '../stores/repos.js'
import { useAuthStore } from '../stores/auth.js'
import { useWizardNav } from '../composables/useWizardNav.js'

const store  = useReposStore()
const auth   = useAuthStore()
const router = useRouter()
const nav    = useWizardNav()

const source = computed(() => store.selectedSource)
const target = computed(() => store.selectedTarget)

const targetUrl = computed(() => {
  if (!target.value) return ''
  const base = auth.provider === 'github'
    ? 'https://github.com'
    : `https://${auth.gitlabHost}`
  return `${base}/${target.value.fullName}`
})

onMounted(() => {
  nav.value = {
    backLabel: '< Back', backDisabled: true,  onBack: null,
    nextLabel: 'Next >', nextDisabled: true,  onNext: null,
    finishLabel: 'Finish', finishDisabled: false,
    onFinish: () => {
      // Clear extraction state and return to welcome
      store.extractRunId  = ''
      store.extractRunUrl = ''
      store.extractStatus = null
      store.extractResult = null
      router.push('/welcome')
    },
  }
})
</script>

<style lang="scss" scoped>
.fin-content { max-width: 440px; }

.fin-intro {
  font-size: 12px;
  color: #000;
  margin: 0 0 10px;
}

.fin-panel { margin-bottom: 14px; }

.fin-row {
  display: flex;
  gap: 10px;
  font-size: 11px;
  padding: 3px 0;
  align-items: baseline;
}

.fin-key {
  width: 76px;
  flex-shrink: 0;
  font-weight: 700;
  color: #555;
  text-align: right;
}

.fin-val {
  flex: 1;
  color: #000;

  code {
    font-family: 'Courier New', monospace;
    font-size: 10px;
    background: #e8e8e8;
    padding: 0 3px;
  }

  &--ok { color: $secondary; font-weight: 700; }
}

.fin-branch {
  margin-left: 6px;
  font-size: 10px;
  font-weight: 700;
  color: $secondary;
  background: rgba($secondary, 0.1);
  padding: 0 4px;
  border-radius: 2px;
}

.fin-link {
  color: $primary;
  text-decoration: underline;
  &:hover { color: $secondary; }
}

.fin-sep {
  margin: 5px 0;
  border: none;
  border-top: 1px solid #e0e0e0;
}

.fin-outro {
  font-size: 11px;
  color: #444;
  margin: 0;
  line-height: 1.6;
}
</style>
