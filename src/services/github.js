const BASE = 'https://api.github.com'

const headers = (token) => ({
  Authorization: `Bearer ${token}`,
  Accept: 'application/vnd.github+json',
})

async function apiFetch(url, token) {
  const res = await fetch(url, { headers: headers(token) })
  if (!res.ok) return { error: res.status, message: await res.text() }
  return res.json()
}

export const getUser = (token) => apiFetch(`${BASE}/user`, token)

export const listRepos = (token, page = 1) =>
  apiFetch(`${BASE}/user/repos?per_page=50&sort=updated&page=${page}`, token)

export const getBranches = (token, owner, repo) =>
  apiFetch(`${BASE}/repos/${owner}/${repo}/branches`, token)

export const getTree = (token, owner, repo, sha) =>
  apiFetch(`${BASE}/repos/${owner}/${repo}/git/trees/${sha}?recursive=1`, token)

// kept for backwards compatibility with auth store
export const fetchCurrentUser = (token) => getUser(token)
