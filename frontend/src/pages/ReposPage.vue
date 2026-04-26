<template>
  <div class="wiz-page">
    <div class="wiz-page__head">
      <div class="wiz-page__step-label">Step 2 of 3</div>
      <h1 class="wiz-page__title">Select Source Repository</h1>
      <p class="wiz-page__desc">
        Choose the repository that contains the path you want to extract.
        Click a row to proceed.
      </p>
    </div>

    <div class="wiz-page__body">
      <!-- Filter -->
      <q-input
        v-model="store.search"
        placeholder="Filter repositories…"
        outlined
        dense
        clearable
        class="q-mb-md"
        style="max-width: 420px"
      >
        <template #prepend><q-icon name="search" /></template>
      </q-input>

      <!-- Repo list -->
      <q-infinite-scroll @load="onLoad" :offset="200">
        <div class="repo-list">
          <div
            v-for="repo in store.filtered"
            :key="repo.id"
            class="repo-row"
            @click="selectRepo(repo)"
          >
            <q-icon
              :name="repo.provider === 'github' ? 'fab fa-github' : 'fab fa-gitlab'"
              :color="repo.provider === 'github' ? 'grey-8' : 'orange'"
              size="20px"
              class="repo-row__icon"
            />
            <div class="repo-row__body">
              <div class="repo-row__name">{{ repo.fullName }}</div>
              <div class="repo-row__meta">Updated {{ formatDate(repo.updatedAt) }}</div>
            </div>
            <q-icon name="chevron_right" size="18px" color="grey-4" />
          </div>
        </div>

        <template #loading>
          <div class="row justify-center q-my-md">
            <q-spinner-dots size="36px" color="primary" />
          </div>
        </template>
      </q-infinite-scroll>

      <div v-if="store.loading && !store.list.length" class="row justify-center q-mt-xl">
        <q-spinner-dots size="48px" color="primary" />
      </div>

      <div v-if="!store.loading && !store.filtered.length" class="text-center text-grey q-mt-xl">
        No repositories found.
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useReposStore } from '../stores/repos.js'

const store = useReposStore()
const router = useRouter()

onMounted(() => store.loadRepos())

async function onLoad(index, done) {
  await store.loadMore()
  done(!store.hasMore)
}

function selectRepo(repo) {
  store.selectSource(repo)
  router.push('/extract')
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString()
}
</script>

<style lang="scss" scoped>
.repo-list {
  max-width: 640px;
  border: 1px solid #d8d8d8;
  border-radius: 3px;
  overflow: hidden;
}

.repo-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px 16px;
  border-bottom: 1px solid #ebebeb;
  cursor: pointer;
  background: #fff;
  transition: background 0.1s;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: #f0f4fa;
  }

  &__icon {
    flex-shrink: 0;
  }

  &__body {
    flex: 1;
    min-width: 0;
  }

  &__name {
    font-size: 14px;
    font-weight: 500;
    color: $primary;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__meta {
    font-size: 11px;
    color: #999;
    margin-top: 1px;
  }
}
</style>
