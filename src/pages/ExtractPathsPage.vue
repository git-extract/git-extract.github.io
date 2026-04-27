<template>
  <div class="wiz-page">
    <div class="wiz-page__head">
      <div class="wiz-page__head-icon">📁</div>
      <div class="wiz-page__head-text">
        <div class="wiz-page__step-label">Step 4 of 7</div>
        <h1 class="wiz-page__title">Select Paths</h1>
        <p class="wiz-page__desc">
          Choose the source branch, then select the folder you want to extract.
        </p>
      </div>
    </div>

    <div class="wiz-page__body">

      <!-- Guard: no repo selected -->
      <template v-if="!source">
        <p style="font-size:12px;color:#808080">
          No repository selected. Please go back and choose a source repository.
        </p>
      </template>

      <template v-else>
        <!-- Source + branch row -->
        <div class="paths-source-row">
          <span class="w98-field-label" style="margin:0;flex-shrink:0">Source:</span>
          <span class="paths-source-name">{{ source.fullName }}</span>
          <select
            v-model="store.sourceBranch"
            class="w98-select"
            :disabled="!store.sourceBranches.length"
            @change="loadTree"
          >
            <option v-for="b in store.sourceBranches" :key="b" :value="b">{{ b }}</option>
          </select>
        </div>

        <!-- Folder tree panel -->
        <div class="w98-panel paths-tree-panel">
          <div class="w98-panel__head">📂 Source Folder</div>
          <div class="w98-panel__body paths-tree-body">
            <div v-if="treeLoading" class="paths-hint">Loading tree…</div>
            <FolderTree
              v-else
              v-model="store.sourcePath"
              :items="store.sourceTree"
            />
            <div
              v-if="!treeLoading && !store.sourceTree.length"
              class="paths-hint"
            >
              No directories found in this branch.
            </div>
          </div>
        </div>

        <!-- Selection feedback -->
        <div v-if="store.sourcePath" class="paths-selected">
          Selected: <strong>{{ store.sourcePath }}</strong>
        </div>
        <div v-else class="paths-hint paths-hint--idle">
          Click a folder above to select it.
        </div>

      </template>
    </div>
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

const store  = useReposStore()
const auth   = useAuthStore()
const router = useRouter()
const nav    = useWizardNav()

const source      = computed(() => store.selectedSource)
const treeLoading = ref(false)

onMounted(async () => {
  updateNav()
  if (!source.value) return
  if (!store.sourceBranches.length) await loadSourceBranches()
  if (!store.sourceTree.length)     await loadTree()
})

watch(() => store.sourcePath, updateNav)

function updateNav() {
  const ready = !!store.sourcePath && !!source.value
  nav.value = {
    backLabel: '< Back', backDisabled: false,
    onBack: () => router.push('/repos'),
    nextLabel: 'Next >', nextDisabled: !ready,
    onNext: ready ? () => router.push('/extract/options') : null,
    finishLabel: 'Finish', finishDisabled: true, onFinish: null,
  }
}

async function loadSourceBranches() {
  const data = auth.provider === 'github'
    ? await getGhBranches(auth.token, source.value.owner, source.value.name)
    : await getGlBranches(auth.token, auth.gitlabHost, source.value.id)
  if (!data.error) {
    store.sourceBranches = data.map(b => b.name)
    if (!store.sourceBranch)
      store.sourceBranch = source.value.defaultBranch || store.sourceBranches[0] || ''
  }
}

async function loadTree() {
  if (!source.value || !store.sourceBranch) return
  treeLoading.value = true
  store.sourceTree  = []
  store.sourcePath  = ''

  if (auth.provider === 'github') {
    const branches = await getGhBranches(auth.token, source.value.owner, source.value.name)
    const branch   = (branches || []).find(b => b.name === store.sourceBranch)
    if (branch) {
      const data = await getGhTree(auth.token, source.value.owner, source.value.name, branch.commit.sha)
      store.sourceTree = data.tree || []
    }
  } else {
    const data = await getGlTree(auth.token, auth.gitlabHost, source.value.id, store.sourceBranch)
    store.sourceTree = Array.isArray(data)
      ? data.map(i => ({ path: i.path, type: i.type === 'tree' ? 'tree' : 'blob' }))
      : []
  }

  treeLoading.value = false
  updateNav()
}
</script>

<style lang="scss" scoped>
.paths-source-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.paths-source-name {
  font-size: 12px;
  font-weight: 700;
  color: $primary;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.paths-tree-panel { flex: 1; }

.paths-tree-body {
  min-height: 180px;
  max-height: 280px;
  overflow-y: auto;
}

.paths-hint {
  font-size: 11px;
  color: #808080;
  padding: 4px 0;

  &--idle { margin-top: 6px; }
}

.paths-selected {
  margin-top: 8px;
  font-size: 11px;
  color: #222;

  strong { color: $primary; }
}
</style>
