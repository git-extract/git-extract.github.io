import { encryptForGitHub } from './crypto.js'

const GH_API = 'https://api.github.com'

function ghHeaders(pat) {
  return {
    Authorization: `Bearer ${pat}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
}

function repoBase(owner, repo) {
  return `${GH_API}/repos/${owner}/${repo}`
}

async function getPublicKey(owner, repo, pat) {
  const res = await fetch(`${repoBase(owner, repo)}/actions/secrets/public-key`, {
    headers: ghHeaders(pat),
  })
  return res.json()
}

async function putSecret(owner, repo, pat, name, encryptedValue, keyId) {
  await fetch(`${repoBase(owner, repo)}/actions/secrets/${name}`, {
    method: 'PUT',
    headers: { ...ghHeaders(pat), 'Content-Type': 'application/json' },
    body: JSON.stringify({ encrypted_value: encryptedValue, key_id: keyId }),
  })
}

async function deleteSecret(owner, repo, pat, name) {
  await fetch(`${repoBase(owner, repo)}/actions/secrets/${name}`, {
    method: 'DELETE',
    headers: ghHeaders(pat),
  })
}

async function dispatchWorkflow(owner, repo, pat, workflowId, inputs) {
  await fetch(`${repoBase(owner, repo)}/actions/workflows/${workflowId}/dispatches`, {
    method: 'POST',
    headers: { ...ghHeaders(pat), 'Content-Type': 'application/json' },
    body: JSON.stringify({ ref: 'main', inputs }),
  })
}

async function findRun(owner, repo, pat, runId, maxAttempts = 10) {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, 3000))
    const res = await fetch(
      `${repoBase(owner, repo)}/actions/runs?event=workflow_dispatch&per_page=10`,
      { headers: ghHeaders(pat) },
    )
    const data = await res.json()
    const run = (data.workflow_runs || []).find((r) =>
      r.name === 'git-extract' && r.inputs?.run_id === runId,
    )
    if (run) return run
  }
  return null
}

async function pollRun(owner, repo, pat, runId) {
  let run
  do {
    await new Promise((r) => setTimeout(r, 5000))
    const res = await fetch(`${repoBase(owner, repo)}/actions/runs/${runId}`, {
      headers: ghHeaders(pat),
    })
    run = await res.json()
  } while (!run.conclusion && run.status !== 'completed')
  return run
}

export async function orchestrate(
  { runId, sourceRepoUrl, sourceToken, sourcePath, targetRepoUrl, targetToken, targetBranch, targetPath },
  env,
) {
  const owner = env.GH_RUNNER_OWNER
  const repo = env.GH_RUNNER_REPO
  const pat = env.GH_SERVICE_PAT

  const srcSecret = `GE_SRC_${runId}`
  const tgtSecret = `GE_TGT_${runId}`

  try {
    const { key, key_id } = await getPublicKey(owner, repo, pat)

    const [encSrc, encTgt] = await Promise.all([
      encryptForGitHub(key, sourceToken),
      encryptForGitHub(key, targetToken),
    ])

    await Promise.all([
      putSecret(owner, repo, pat, srcSecret, encSrc, key_id),
      putSecret(owner, repo, pat, tgtSecret, encTgt, key_id),
    ])

    await dispatchWorkflow(owner, repo, pat, 'extract.yml', {
      run_id: runId,
      source_repo: sourceRepoUrl,
      source_path: sourcePath,
      target_repo: targetRepoUrl,
      target_branch: targetBranch,
      target_path: targetPath,
    })

    const run = await findRun(owner, repo, pat, runId)
    if (!run) {
      return { success: false, runId, runUrl: null, conclusion: 'not_found' }
    }

    const completed = await pollRun(owner, repo, pat, run.id)
    return {
      success: completed.conclusion === 'success',
      runId,
      runUrl: completed.html_url,
      conclusion: completed.conclusion,
    }
  } finally {
    await Promise.allSettled([
      deleteSecret(owner, repo, pat, srcSecret),
      deleteSecret(owner, repo, pat, tgtSecret),
    ])
  }
}
