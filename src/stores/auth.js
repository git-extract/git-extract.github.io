import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { fetchCurrentUser } from '../services/github.js'

const STORAGE_KEY = 'auth'

export const useAuthStore = defineStore('auth', () => {
  const provider = ref(null)
  const token = ref(null)
  const gitlabHost = ref(null)
  const user = ref(null)

  const isLoggedIn = computed(() => !!token.value)

  // Hydrate from localStorage on store creation
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) {
    try {
      const parsed = JSON.parse(stored)
      provider.value = parsed.provider
      token.value = parsed.token
      gitlabHost.value = parsed.gitlabHost
      user.value = parsed.user
    } catch {
      /* ignore */
    }
  }

  async function loginWithToken(providerName, accessToken, host = 'gitlab.com') {
    let fetchedUser = null

    if (providerName === 'github') {
      fetchedUser = await fetchCurrentUser(accessToken)
    } else if (providerName === 'gitlab') {
      const res = await fetch(`https://${host}/api/v4/user`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      fetchedUser = await res.json()
    }

    provider.value = providerName
    token.value = accessToken
    gitlabHost.value = host
    user.value = fetchedUser

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ provider: providerName, token: accessToken, gitlabHost: host, user: fetchedUser }),
    )
  }

  function logout() {
    provider.value = null
    token.value = null
    gitlabHost.value = null
    user.value = null
    localStorage.removeItem(STORAGE_KEY)
  }

  return { provider, token, gitlabHost, user, isLoggedIn, loginWithToken, logout }
})
