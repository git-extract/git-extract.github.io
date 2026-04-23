<template>
  <q-page padding>
    <div v-if="!source" class="text-center q-mt-xl">
      <q-btn label="Pick a repository" color="primary" to="/repos" />
    </div>

    <template v-else>
      <!-- Source header -->
      <div class="row items-center q-gutter-sm q-mb-md">
        <div class="text-h6">{{ source.fullName }}</div>
        <q-select
          v-model="sourceBranch"
          :options="sourceBranches"
          dense outlined
          style="min-width: 160px"
          @update:model-value="loadTree"
        />
      </div>

      <div v-if="!submitted" class="row q-col-gutter-md">
        <!-- Source folder tree -->
        <div class="col-12 col-md-5">
          <q-card flat bordered>
            <q-card-section class="text-subtitle2">Source folder</q-card-section>
            <q-card-section>
              <q-spinner v-if="treeLoading" />
              <FolderTree v-else v-model="store.sourcePath" :items="store.sourceTree" />
            </q-card-section>
          </q-card>
        </div>

        <!-- Target options -->
        <div class="col-12 col-md-7">
          <q-card flat bordered>
            <q-card-section class="q-gutter-md">
              <q-select
                v-model="store.selectedTarget"
                :options="store.list"
                option-label="fullName"
                option-value="id"
                label="Target repo"
                outlined
                use-input
                input-debounce="300"
                @filter="filterRepos"
                @update:model-value="loadTargetBranches"
              />
              <q-select
                v-model="targetBranch"
                :options="targetBranches"
                label="Branch"
                outlined
                dense
              />
              <q-input v-model="store.targetPath" label="Target path" outlined dense />
              <q-btn
                label="Extract → Push"
                color="primary"
                :disable="!canSubmit"
                :loading="submitting"
                @click="submit"
              />
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Post-submit status -->
      <div v-else class="q-mt-lg">
        <q-banner rounded class="bg-positive text-white">
          <template #avatar><q-icon name="check_circle" /></template>
          Extraction job submitted successfully.
        </q-banner>
      </div>
    </template>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useReposStore } from '../stores/repos.js'
import { useAuthStore } from '../stores/auth.js'
import {
  getBranches as getGhBranches,
  getTree as getGhTree,
} from '../services/github.js'
import {
  getBranches as getGlBranches,
  getTree as getGlTree,
} from '../services/gitlab.js'
import FolderTree from '../components/FolderTree.vue'

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

const canSubmit = computed(
  () => !!store.sourcePath && !!store.selectedTarget && !!targetBranch.value,
)

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
  update(() => { store.search = val })
}

async function submit() {
  submitting.value = true
  const ghBase = 'https://github.com'
  const glBase = `https://${auth.gitlabHost}`
  const base = auth.provider === 'github' ? ghBase : glBase
  await fetch(`${process.env.WORKER_URL}/extract`, {
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
  submitting.value = false
  submitted.value = true
}
</script>
