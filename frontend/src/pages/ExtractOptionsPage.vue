<template>
  <div class="wiz-page">
    <div class="wiz-page__head">
      <div class="wiz-page__head-icon">⚙</div>
      <div class="wiz-page__head-text">
        <div class="wiz-page__step-label">Step 5 of 7</div>
        <h1 class="wiz-page__title">Output Options</h1>
        <p class="wiz-page__desc">
          Choose where extracted files are written and configure output settings.
        </p>
      </div>
    </div>

    <div class="wiz-page__body">
      <div class="opts-form">

        <!-- Target repository -->
        <div class="opts-field">
          <label class="w98-field-label">Target repository:</label>
          <q-select
            v-model="store.selectedTarget"
            :options="store.filtered"
            option-label="fullName"
            option-value="id"
            outlined dense use-input input-debounce="300"
            placeholder="Search repositories…"
            @filter="filterRepos"
            @update:model-value="loadTargetBranches"
          />
        </div>

        <!-- Target branch -->
        <div class="opts-field">
          <label class="w98-field-label">Target branch:</label>
          <select
            v-model="store.targetBranch"
            class="w98-select w98-select--full"
            :disabled="!store.targetBranches.length"
          >
            <option
              v-for="b in store.targetBranches"
              :key="b"
              :value="b"
            >{{ b }}</option>
          </select>
        </div>

        <!-- Destination path -->
        <div class="opts-field">
          <label class="w98-field-label" for="dest-path">Destination path:</label>
          <input
            id="dest-path"
            v-model="store.targetPath"
            class="w98-input-full"
            placeholder="src"
            spellcheck="false"
          />
          <div class="opts-hint">
            Relative path inside the target repo where files will be written.
          </div>
        </div>

        <div class="opts-divider" />

        <!-- Generate project file checkbox -->
        <div class="opts-check-row">
          <input
            id="gen-proj"
            v-model="store.generateProjectFile"
            type="checkbox"
          />
          <label for="gen-proj" class="opts-check-label">
            <span class="opts-check-name">Generate project file (.git-extract.json)</span>
            <span class="opts-check-desc">
              Records source repo, branch, and paths so this extraction can
              be reproduced or updated later.
            </span>
          </label>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useReposStore } from '../stores/repos.js'
import { useAuthStore } from '../stores/auth.js'
import { getBranches as getGhBranches } from '../services/github.js'
import { getBranches as getGlBranches } from '../services/gitlab.js'
import { useWizardNav } from '../composables/useWizardNav.js'

const store  = useReposStore()
const auth   = useAuthStore()
const router = useRouter()
const nav    = useWizardNav()

const canProceed = () => !!store.selectedTarget && !!store.targetBranch

onMounted(() => {
  updateNav()
  // Re-load target branches if a target is already chosen (came back from next step)
  if (store.selectedTarget && !store.targetBranches.length) loadTargetBranches()
})

watch([() => store.selectedTarget, () => store.targetBranch], updateNav)

function updateNav() {
  nav.value = {
    backLabel: '< Back', backDisabled: false,
    onBack: () => router.push('/extract/paths'),
    nextLabel: 'Next >', nextDisabled: !canProceed(),
    onNext: canProceed() ? () => router.push('/extract/progress') : null,
    finishLabel: 'Finish', finishDisabled: true, onFinish: null,
  }
}

async function loadTargetBranches() {
  if (!store.selectedTarget) return
  store.targetBranch   = ''
  store.targetBranches = []
  const data = auth.provider === 'github'
    ? await getGhBranches(auth.token, store.selectedTarget.owner, store.selectedTarget.name)
    : await getGlBranches(auth.token, auth.gitlabHost, store.selectedTarget.id)
  if (!data.error) {
    store.targetBranches = data.map(b => b.name)
    store.targetBranch   =
      store.selectedTarget.defaultBranch || store.targetBranches[0] || 'main'
  }
}

function filterRepos(val, update) {
  update(() => { store.search = val })
}
</script>

<style lang="scss" scoped>
.opts-form { max-width: 400px; }

.opts-field { margin-bottom: 12px; }

.opts-hint {
  margin-top: 4px;
  font-size: 10px;
  color: #808080;
  line-height: 1.4;
}

.opts-divider {
  margin: 14px 0;
  border: none;
  border-top: 1px solid #808080;
  border-bottom: 1px solid #fff;
}

.opts-check-row {
  display: flex;
  align-items: flex-start;
  gap: 7px;
  cursor: pointer;

  input[type='checkbox'] {
    flex-shrink: 0;
    margin-top: 2px;
    cursor: pointer;
    accent-color: $secondary;
  }
}

.opts-check-label {
  display: flex;
  flex-direction: column;
  gap: 3px;
  cursor: pointer;
  user-select: none;
}

.opts-check-name {
  font-size: 12px;
  font-weight: 700;
  color: #000;
}

.opts-check-desc {
  font-size: 11px;
  color: #444;
  line-height: 1.45;
}
</style>
