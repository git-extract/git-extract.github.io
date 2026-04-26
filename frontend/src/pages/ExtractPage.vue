<template>
  <div class="wiz-page">

    <!-- ── No source ──────────────────────────────────────────── -->
    <template v-if="!source">
      <div class="wiz-page__head">
        <div class="wiz-page__head-icon">⚙</div>
        <div class="wiz-page__head-text">
          <div class="wiz-page__step-label">Step 3 of 3</div>
          <h1 class="wiz-page__title">Configure Extraction</h1>
          <p class="wiz-page__desc">No repository selected.</p>
        </div>
      </div>
      <div class="wiz-page__body">
        <p style="font-size:12px">Please go back and select a source repository first.</p>
      </div>
    </template>

    <!-- ── Extracting ────────────────────────────────────────── -->
    <template v-else-if="submitted">
      <div class="wiz-page__head">
        <div class="wiz-page__head-icon">🚀</div>
        <div class="wiz-page__head-text">
          <div class="wiz-page__step-label">Step 4 of 3</div>
          <h1 class="wiz-page__title">Extracting…</h1>
          <p class="wiz-page__desc">
            {{ source.fullName }} → {{ store.selectedTarget?.fullName }}
          </p>
        </div>
      </div>
      <div class="wiz-page__body">
        <StatusPoller
          v-if="runId"
          :run-id="runId"
          :run-url="runUrl"
          :target-repo-url="targetRepoUrl"
        />
        <div v-else class="w98-panel" style="max-width:400px">
          <div class="w98-panel__body" style="font-size:12px">
            ✔ Extraction job submitted.
          </div>
        </div>
      </div>
    </template>

    <!-- ── Configure ─────────────────────────────────────────── -->
    <template v-else>
      <div class="wiz-page__head">
        <div class="wiz-page__head-icon">⚙</div>
        <div class="wiz-page__head-text">
          <div class="wiz-page__step-label">Step 3 of 3</div>
          <h1 class="wiz-page__title">Configure Extraction</h1>
          <p class="wiz-page__desc">
            Select a source folder, choose the destination, then click
            <strong>Extract &amp; Push</strong>.
          </p>
        </div>
      </div>

      <div class="wiz-page__body">
        <!-- Source repo + branch -->
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
          <span class="w98-field-label" style="margin:0">Source:</span>
          <span style="font-size:12px;font-weight:700;color:#1e2e4a">{{ source.fullName }}</span>
          <select v-model="sourceBranch" class="w98-select" @change="loadTree">
            <option v-for="b in sourceBranches" :key="b" :value="b">{{ b }}</option>
          </select>
        </div>

        <!-- Two-panel grid -->
        <div class="cfg-grid">
          <!-- Folder tree -->
          <div class="w98-panel">
            <div class="w98-panel__head">📁 Source Folder</div>
            <div class="w98-panel__body" style="min-height:180px;overflow-y:auto">
              <div v-if="treeLoading" style="font-size:11px;color:#808080;padding:4px">Loading…</div>
              <FolderTree v-else v-model="store.sourcePath" :items="store.sourceTree" />
              <div v-if="!treeLoading && !store.sourceTree.length" style="font-size:11px;color:#808080">
                No directories found.
              </div>
            </div>
          </div>

          <!-- Destination -->
          <div class="w98-panel">
            <div class="w98-panel__head">📂 Destination</div>
            <div class="w98-panel__body">
              <div class="cfg-field">
                <label class="w98-field-label">Target repository:</label>
                <q-select
                  v-model="store.selectedTarget"
                  :options="store.list"
                  option-label="fullName"
                  option-value="id"
                  outlined
                  dense
                  use-input
                  input-debounce="300"
                  @filter="filterRepos"
                  @update:model-value="loadTargetBranches"
                />
              </div>
              <div class="cfg-field">
                <label class="w98-field-label">Target branch:</label>
                <select v-model="targetBranch" class="w98-select w98-select--full">
                  <option v-for="b in targetBranches" :key="b" :value="b">{{ b }}</option>
                </select>
              </div>
              <div class="cfg-field">
                <label class="w98-field-label">Destination path:</label>
                <input v-model="store.targetPath" class="w98-input-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useReposStore } from '../stores/repos.js'
import { useAuthStore } from '../stores/auth.js'
import { getBranches as getGhBranches, getTree as getGhTree } from '../services/github.js'
import { getBranches as getGlBranches, getTree as getGlTree } from '../services/gitlab.js'
import { useWizardNav } from '../composables/useWizardNav.js'
import FolderTree from '../components/FolderTree.vue'
import StatusPoller from '../components/StatusPoller.vue'

const store  = useReposStore()
const auth   = useAuthStore()
const router = useRouter()
const nav    = useWizardNav()

const source        = computed(() => store.selectedSource)
const sourceBranch  = ref(source.value?.defaultBranch || '')
const sourceBranches = ref([])
const targetBranch  = ref('')
const targetBranches = ref([])
const treeLoading   = ref(false)
const submitting    = ref(false)
const submitted     = ref(false)
const runId         = ref('')
const runUrl        = ref('')

const canSubmit = computed(
  () => !!store.sourcePath && !!store.selectedTarget && !!targetBranch.value,
)

const targetRepoUrl = computed(() => {
  if (!store.selectedTarget) return ''
  const base = auth.provider === 'github' ? 'https://github.com' : `https://${auth.gitlabHost}`
  return `${base}/${store.selectedTarget.fullName}`
})

onMounted(async () => {
  updateNav()
  if (!source.value) return
  await loadSourceBranches()
  await loadTree()
})

watch([canSubmit, submitted, source], updateNav)

function updateNav() {
  if (!source.value) {
    nav.value = {
      backLabel: '< Back', nextLabel: 'Next >', nextDisabled: true,
      onBack: () => router.push('/repos'), onNext: null,
    }
    return
  }
  if (submitted.value) {
    nav.value = {
      backLabel: '← Start over', nextLabel: 'Finish', nextDisabled: false,
      onBack: () => reset(), onNext: () => router.push('/repos'),
    }
    return
  }
  nav.value = {
    backLabel: '< Back',
    nextLabel: submitting.value ? 'Extracting…' : 'Extract && Push',
    nextDisabled: !canSubmit.value || submitting.value,
    onBack: () => router.push('/repos'),
    onNext: () => submit(),
  }
}

async function loadSourceBranches() {
  const data = auth.provider === 'github'
    ? await getGhBranches(auth.token, source.value.owner, source.value.name)
    : await getGlBranches(auth.token, auth.gitlabHost, source.value.id)
  if (!data.error) {
    sourceBranches.value = data.map((b) => b.name)
    if (!sourceBranch.value) sourceBranch.value = sourceBranches.value[0] || ''
  }
}

async function loadTree() {
  if (!source.value || !sourceBranch.value) return
  treeLoading.value = true
  store.sourceTree = []
  if (auth.provider === 'github') {
    const branches = await getGhBranches(auth.token, source.value.owner, source.value.name)
    const branch = (branches || []).find((b) => b.name === sourceBranch.value)
    if (branch) {
      const data = await getGhTree(auth.token, source.value.owner, source.value.name, branch.commit.sha)
      store.sourceTree = data.tree || []
    }
  } else {
    const data = await getGlTree(auth.token, auth.gitlabHost, source.value.id, sourceBranch.value)
    store.sourceTree = Array.isArray(data)
      ? data.map((i) => ({ path: i.path, type: i.type === 'tree' ? 'tree' : 'blob' }))
      : []
  }
  treeLoading.value = false
}

async function loadTargetBranches() {
  if (!store.selectedTarget) return
  targetBranch.value = ''
  targetBranches.value = []
  const data = auth.provider === 'github'
    ? await getGhBranches(auth.token, store.selectedTarget.owner, store.selectedTarget.name)
    : await getGlBranches(auth.token, auth.gitlabHost, store.selectedTarget.id)
  if (!data.error) {
    targetBranches.value = data.map((b) => b.name)
    targetBranch.value = store.selectedTarget.defaultBranch || targetBranches.value[0] || 'main'
  }
}

function filterRepos(val, update) {
  update(() => { store.search = val })
}

async function submit() {
  submitting.value = true
  updateNav()
  const base = auth.provider === 'github' ? 'https://github.com' : `https://${auth.gitlabHost}`
  const res = await fetch(`${process.env.WORKER_URL}/extract`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sourceRepoUrl: `${base}/${source.value.fullName}`,
      sourceToken: auth.token,
      sourcePath: store.sourcePath,
      targetRepoUrl: `${base}/${store.selectedTarget.fullName}`,
      targetToken: auth.token,
      targetBranch: targetBranch.value,
      targetPath: store.targetPath,
    }),
  })
  const data = await res.json()
  runId.value = data.runId || ''
  runUrl.value = data.runUrl || ''
  submitting.value = false
  submitted.value = true
}

function reset() {
  submitted.value = false
  runId.value = ''
  runUrl.value = ''
  store.sourcePath = ''
  store.selectedTarget = null
  router.push('/repos')
}
</script>

<style lang="scss" scoped>
.cfg-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
}

.cfg-field {
  margin-bottom: 10px;
  &:last-child { margin-bottom: 0; }
}

.w98-select {
  height: 21px;
  padding: 0 4px;
  font-family: 'Tahoma', 'MS Sans Serif', Arial, sans-serif;
  font-size: 12px;
  border: none;
  box-shadow:
    inset  1px  1px #0a0a0a,
    inset -1px -1px #ffffff,
    inset  2px  2px #808080,
    inset -2px -2px #dfdfdf;
  background: #fff;
  cursor: pointer;

  &--full { width: 100%; }
}

.w98-input-full {
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
    inset -2px -2px #dfdfdf;
  background: #fff;
  box-sizing: border-box;
}
</style>
