import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from './auth.js'
import { listRepos } from '../services/github.js'
import { listProjects } from '../services/gitlab.js'

export const useReposStore = defineStore('repos', () => {
  const list = ref([])
  const page = ref(1)
  const hasMore = ref(true)
  const loading = ref(false)
  const search = ref('')
  const selectedSource = ref(null)
  const selectedTarget = ref(null)
  const sourceTree = ref([])
  const sourcePath = ref('')
  const targetPath = ref('src')

  const filtered = computed(() =>
    search.value
      ? list.value.filter((r) => r.name.toLowerCase().includes(search.value.toLowerCase()))
      : list.value,
  )

  async function loadRepos() {
    const auth = useAuthStore()
    loading.value = true
    page.value = 1
    list.value = []
    hasMore.value = true
    const items = await fetchPage(auth, 1)
    list.value = items
    hasMore.value = items.length === 50
    loading.value = false
  }

  async function loadMore() {
    if (!hasMore.value || loading.value) return
    const auth = useAuthStore()
    loading.value = true
    page.value++
    const items = await fetchPage(auth, page.value)
    list.value.push(...items)
    hasMore.value = items.length === 50
    loading.value = false
  }

  async function fetchPage(auth, p) {
    if (auth.provider === 'github') {
      const data = await listRepos(auth.token, p)
      if (data.error) return []
      return data.map((r) => ({
        id: r.id,
        name: r.name,
        fullName: r.full_name,
        owner: r.owner.login,
        defaultBranch: r.default_branch,
        updatedAt: r.updated_at,
        provider: 'github',
      }))
    } else {
      const data = await listProjects(auth.token, auth.gitlabHost, p)
      if (data.error) return []
      return data.map((p) => ({
        id: p.id,
        name: p.name,
        fullName: p.path_with_namespace,
        owner: p.namespace.path,
        defaultBranch: p.default_branch,
        updatedAt: p.last_activity_at,
        provider: 'gitlab',
      }))
    }
  }

  function selectSource(repo) {
    selectedSource.value = repo
  }

  function selectTarget(repo) {
    selectedTarget.value = repo
  }

  return {
    list,
    page,
    hasMore,
    loading,
    search,
    selectedSource,
    selectedTarget,
    sourceTree,
    sourcePath,
    targetPath,
    filtered,
    loadRepos,
    loadMore,
    selectSource,
    selectTarget,
  }
})
