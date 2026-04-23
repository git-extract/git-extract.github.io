<template>
  <q-page padding>
    <q-input
      v-model="store.search"
      placeholder="Filter repositories…"
      outlined
      dense
      clearable
      class="q-mb-md"
    >
      <template #prepend><q-icon name="search" /></template>
    </q-input>

    <q-infinite-scroll @load="onLoad" :offset="200">
      <div class="row q-gutter-md">
        <q-card
          v-for="repo in store.filtered"
          :key="repo.id"
          class="col-12 col-sm-5 col-md-3 cursor-pointer"
          @click="selectRepo(repo)"
        >
          <q-card-section>
            <div class="row items-center q-gutter-sm">
              <q-icon
                :name="repo.provider === 'github' ? 'fab fa-github' : 'fab fa-gitlab'"
                size="sm"
              />
              <div class="text-subtitle1 text-weight-medium">{{ repo.name }}</div>
            </div>
            <div class="text-caption text-grey">{{ repo.fullName }}</div>
            <div class="text-caption text-grey">Updated {{ formatDate(repo.updatedAt) }}</div>
          </q-card-section>
        </q-card>
      </div>

      <template #loading>
        <div class="row justify-center q-my-md">
          <q-spinner-dots size="40px" />
        </div>
      </template>
    </q-infinite-scroll>
  </q-page>
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
