import { orchestrate } from '../services/actionsOrchestrator.js'

const REQUIRED = ['sourceRepoUrl', 'sourceToken', 'sourcePath', 'targetRepoUrl', 'targetToken', 'targetBranch', 'targetPath']

function corsHeaders(env) {
  return {
    'Access-Control-Allow-Origin': env.SPA_URL,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

export async function handleExtract(request, env, ctx) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(env) })
  }

  let body
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400, headers: corsHeaders(env) })
  }

  const missing = REQUIRED.filter((k) => !body[k])
  if (missing.length) {
    return Response.json(
      { error: `Missing required fields: ${missing.join(', ')}` },
      { status: 400, headers: corsHeaders(env) },
    )
  }

  const runId = crypto.randomUUID().replace(/-/g, '').slice(0, 16)
  const runUrl = `https://github.com/${env.GH_RUNNER_OWNER}/${env.GH_RUNNER_REPO}/actions`

  ctx.waitUntil(orchestrate({ ...body, runId }, env).catch(() => {}))

  return Response.json({ runId, runUrl }, { headers: corsHeaders(env) })
}
