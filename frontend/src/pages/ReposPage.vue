<template>
  <div class="wiz-page">
    <div class="wiz-page__head">
      <div class="wiz-page__head-icon">🗄</div>
      <div class="wiz-page__head-text">
        <div class="wiz-page__step-label">Step 2 of 3</div>
        <h1 class="wiz-page__title">Select Source Repository</h1>
        <p class="wiz-page__desc">
          Double-click (or click) a repository to select it and proceed to configuration.
        </p>
      </div>
    </div>

    <div class="wiz-page__body">
      <!-- Filter -->
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px">
        <label class="w98-field-label" style="margin:0;white-space:nowrap">Filter:</label>
        <input
          v-model="store.search"
          class="w98-filter-input"
          placeholder="type to filter…"
        />
        <button v-if="store.search" class="w98-btn" style="min-width:auto;padding:0 8px" @click="store.search = ''">✕</button>
      </div>

      <!-- List view -->
      <div class="repo-listview">
        <!-- Header -->
        <div class="repo-listview__header">
          <div class="repo-listview__col repo-listview__col--icon" />
          <div class="repo-listview__col repo-listview__col--name">Name</div>
          <div class="repo-listview__col repo-listview__col--provider">Provider</div>
          <div class="repo-listview__col repo-listview__col--updated">Last updated</div>
        </div>

        <!-- Rows -->
        <div class="repo-listview__body">
          <q-infinite-scroll @load="onLoad" :offset="100">
            <div
              v-for="repo in store.filtered"
              :key="repo.id"
              class="repo-row"
              :class="{ 'repo-row--selected': selected === repo.id }"
              @click="selected = repo.id"
              @dblclick="confirm(repo)"
            >
              <div class="repo-listview__col repo-listview__col--icon">
                <q-icon
                  :name="repo.provider === 'github' ? 'fab fa-github' : 'fab fa-gitlab'"
                  size="14px"
                />
              </div>
              <div class="repo-listview__col repo-listview__col--name">{{ repo.fullName }}</div>
              <div class="repo-listview__col repo-listview__col--provider">{{ repo.provider }}</div>
              <div class="repo-listview__col repo-listview__col--updated">{{ formatDate(repo.updatedAt) }}</div>
            </div>

            <template #loading>
              <div style="text-align:center;padding:8px;font-size:11px;color:#808080">
                Loading…
              </div>
            </template>
          </q-infinite-scroll>

          <div v-if="store.loading && !store.list.length" style="text-align:center;padding:16px;font-size:11px;color:#808080">
            Loading repositories…
          </div>

          <div v-if="!store.loading && !store.filtered.length" style="text-align:center;padding:16px;font-size:11px;color:#808080">
            No repositories found.
          </div>
        </div>
      </div>

      <div style="font-size:10px;color:#808080;margin-top:4px">
        {{ store.filtered.length }} item(s)
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useReposStore } from '../stores/repos.js'
import { useWizardNav } from '../composables/useWizardNav.js'

const store = useReposStore()
const router = useRouter()
const nav = useWizardNav()
const selected = ref(null)

onMounted(() => {
  store.loadRepos()
  updateNav()
})

watch(selected, updateNav)

function updateNav() {
  const repo = store.list.find((r) => r.id === selected.value) || null
  nav.value = {
    backLabel: '< Back',
    nextLabel: 'Next >',
    nextDisabled: !selected.value,
    onBack: () => router.push('/login'),
    onNext: selected.value
      ? () => confirm(repo)
      : null,
  }
}

async function onLoad(index, done) {
  await store.loadMore()
  done(!store.hasMore)
}

function confirm(repo) {
  if (!repo) return
  store.selectSource(repo)
  router.push('/extract')
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString()
}
</script>

<style lang="scss" scoped>
.w98-filter-input {
  flex: 1;
  max-width: 300px;
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
}

/* Win98 Explorer-style list view */
.repo-listview {
  border: 2px solid;
  border-color: #808080 #fff #fff #808080;
  height: 320px;
  display: flex;
  flex-direction: column;
  background: #fff;

  &__header {
    display: flex;
    background: #c0c0c0;
    border-bottom: 1px solid #808080;
    flex-shrink: 0;

    .repo-listview__col {
      padding: 2px 6px;
      font-size: 11px;
      font-weight: 700;
      border-right: 2px solid;
      border-color: #fff #808080 #808080 #fff;
      white-space: nowrap;
    }
  }

  &__body {
    flex: 1;
    overflow-y: auto;
  }

  &__col {
    padding: 3px 6px;
    font-size: 12px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    &--icon    { width: 24px; flex-shrink: 0; text-align: center; }
    &--name    { flex: 1; min-width: 0; }
    &--provider{ width: 72px; flex-shrink: 0; }
    &--updated { width: 100px; flex-shrink: 0; }
  }
}

.repo-row {
  display: flex;
  align-items: center;
  border-bottom: 1px solid #efefef;
  cursor: default;

  &:hover { background: #dde8f8; }

  &--selected {
    background: $primary !important;
    color: #fff;
  }

  &:last-child { border-bottom: none; }
}
</style>
