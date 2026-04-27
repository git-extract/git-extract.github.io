<template>
  <q-layout view="hHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-toolbar-title>
          <router-link to="/repos" class="text-white text-decoration-none">git-extract</router-link>
        </q-toolbar-title>

        <template v-if="auth.isLoggedIn">
          <q-chip outline color="white" class="q-mr-sm">
            <q-avatar>
              <img v-if="auth.user?.avatar_url" :src="auth.user.avatar_url" />
              <q-icon v-else name="person" />
            </q-avatar>
            {{ auth.user?.login || auth.user?.username }}
            <q-badge :label="auth.provider" color="grey-7" class="q-ml-xs" />
          </q-chip>

          <q-btn flat dense label="Logout" @click="logout" />
        </template>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { useAuthStore } from '../stores/auth.js'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const router = useRouter()

function logout() {
  auth.logout()
  router.push('/login')
}
</script>
