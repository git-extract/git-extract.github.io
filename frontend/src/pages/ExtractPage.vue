<template>
  <div class="wiz-page">
    <!-- ── No source selected ──────────────────────────────────── -->
    <template v-if="!source">
      <div class="wiz-page__head">
        <div class="wiz-page__step-label">Step 3 of 3</div>
        <h1 class="wiz-page__title">Configure Extraction</h1>
        <p class="wiz-page__desc">No repository selected yet.</p>
      </div>
      <div class="wiz-page__body">
        <q-btn flat icon="arrow_back" label="Go back and pick a repository" color="primary" to="/repos" />
      </div>
    </template>

    <!-- ── Post-submit: Extraction running ───────────────────────── -->
    <template v-else-if="submitted">
      <div class="wiz-page__head">
        <div class="wiz-page__step-label">Step 3 of 3</div>
        <h1 class="wiz-page__title">Extracting…</h1>
        <p class="wiz-page__desc">
          <strong>{{ source.fullName }}</strong> &rarr;
          <strong>{{ store.selectedTarget?.fullName }}</strong>
        </p>
      </div>
      <div class="wiz-page__body">
        <StatusPoller
          v-if="runId"
          :run-id="runId"
          :run-url="runUrl"
          :target-repo-url="targetRepoUrl"
        />
        <q-banner v-else rounded class="bg-positive text-white">
          <template #avatar><q-icon name="check_circle" /></template>
          Extraction job submitted.
        </q-banner>

        <div class="q-mt-lg">
          <q-btn flat icon="arrow_back" label="Start a new extraction" color="primary" @click="reset" />
        </div>
      </div>
    </template>

    <!-- ── Configure ──────────────────────────────────────────────── -->
    <template v-else>
      <div class="wiz-page__head">
        <div class="wiz-page__step-label">Step 3 of 3</div>
        <h1 class="wiz-page__title">Configure Extraction</h1>
        <p class="wiz-page__desc">
          Pick a source folder, choose the target repository and branch, then click
          <strong>Extract &amp; Push</strong>.
        </p>
      </div>

      <div class="wiz-page__body">
        <!-- Source repo + branch row -->
        <div class="cfg-group q-mb-lg">
          <div class="cfg-group__label">Source</div>
          <div class="row items-center q-gutter-sm">
            <div class="text-weight-medium text-primary">{{ source.fullName }}</div>
            <q-select
              v-model="sourceBranch"
              :options="sourceBranches"
              dense
              outlined
              style="min-width: 160px"
              @update:model-value="loadTree"
            />
          </div>
        </div>

        <div class="cfg-columns">
          <!-- Left: folder tree -->
          <div class="cfg-panel">
            <div class="cfg-panel__head">
              <q-icon name="folder_open" size="16px" class="q-mr-xs" />
              Source folder
            </div>
            <div class="cfg-panel__body">
              <div v-if="treeLoading" class="flex flex-center q-py-md">
                <q-spinner color="primary" size="32px" />
              </div>
              <FolderTree
                v-else
                v-model="store.sourcePath"
                :items="store.sourceTree"
              />
              <div v-if="!treeLoading && !store.sourceTree.length" class="text-caption text-grey q-pa-sm">
                No directories found in this branch.
              </div>
            </div>
          </div>

          <!-- Right: target options -->
          <div class="cfg-panel">
            <div class="cfg-panel__head">
              <q-icon name="drive_file_move" size="16px" class="q-mr-xs" />
              Destination
            </div>
            <div class="cfg-panel__body q-gutter-md column">
              <q-select
                v-model="store.selectedTarget"
                :options="store.list"
                option-label="fullName"
                option-value="id"
                label="Target repository"
                outlined
                use-input
                input-debounce="300"
                @filter="filterRepos"
                @update:model-value="loadTargetBranches"
              />
              <q-select
                v-model="targetBranch"
                :options="targetBranches"
                label="Target branch"
                outlined
                dense
              />
              <q-input
                v-model="store.targetPath"
                label="Destination path inside target repo"
                outlined
                dense
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Nav bar -->
      <div class="wiz-page__nav">
        <q-btn flat label="‹ Back" @click="$router.push('/repos')" />
        <q-btn
          color="primary"
          icon-right="send"
          label="Extract & Push"
          :disable="!canSubmit"
          :loading="submitting"
          @click="submit"
        />
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useReposStore } from '../stores/repos.js'
import { useAuthStore } from '../stores/auth.js'
import { getBranches as getGhBranches, getTree as getGhTree } from '../services/github.js'
import { getBranches as getGlBranches, getTree as getGlTree } from '../services/gitlab.js'
import FolderTree from '../components/FolderTree.vue'
import StatusPoller from '../components/StatusPoller.vue'

const store = useReposStore()
const auth = useAuthStore()

const source = computed(() => store.selectedSource)
const sourceBranch = ref(source.value?.defaultBranch || '')
const sourceBranches = ref([])
const targetBranch = ref('')
const targetBranches = ref([])
const treeLoading = ref(false)
const submitting = ref(false)
const submitted = ref(false)
const runId = ref('')
const runUrl = ref('')

const canSubmit = computed(
  () => !!store.sourcePath && !!store.selectedTarget && !!targetBranch.value,
)

const targetRepoUrl = computed(() => {
  if (!store.selectedTarget) return ''
  const base = auth.provider === 'github' ? 'https://github.com' : `https://${auth.gitlabHost}`
  return `${base}/${store.selectedTarget.fullName}`
})

onMounted(async () => {
  if (!source.value) return
  await loadSourceBranches()
  await loadTree()
})

async function loadSourceBranches() {
  const data =
    auth.provider === 'github'
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
  const data =
    auth.provider === 'github'
      ? await getGhBranches(auth.token, store.selectedTarget.owner, store.selectedTarget.name)
      : await getGlBranches(auth.token, auth.gitlabHost, store.selectedTarget.id)
  if (!data.error) {
    targetBranches.value = data.map((b) => b.name)
    targetBranch.value = store.selectedTarget.defaultBranch || targetBranches.value[0] || 'main'
  }
}

function filterRepos(val, update) {
  update(() => {
    store.search = val
  })
}

async function submit() {
  submitting.value = true
  const base =
    auth.provider === 'github' ? 'https://github.com' : `https://${auth.gitlabHost}`
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
}
</script>

<style lang="scss" scoped>
.cfg-group {
  &__label {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.8px;
    text-transform: uppercase;
    color: #888;
    margin-bottom: 6px;
  }
}

.cfg-columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;

  @media (max-width: 680px) {
    grid-template-columns: 1fr;
  }
}

.cfg-panel {
  border: 1px solid #d8d8d8;
  border-radius: 3px;
  overflow: hidden;

  &__head {
    display: flex;
    align-items: center;
    padding: 8px 14px;
    background: #f0f0f0;
    border-bottom: 1px solid #d8d8d8;
    font-size: 12px;
    font-weight: 600;
    color: $primary;
    text-transform: uppercase;
    letter-spacing: 0.6px;
  }

  &__body {
    padding: 12px 14px;
    min-height: 120px;
  }
}
</style>
