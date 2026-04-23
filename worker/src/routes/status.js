const GH_API = 'https://api.github.com'

function corsHeaders(env) {
  return {
    'Access-Control-Allow-Origin': env.SPA_URL,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

export async function handleStatus(request, env) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(env) })
  }

  const url = new URL(request.url)
  const runId = url.searchParams.get('runId')

  if (!runId) {
    return Response.json({ error: 'Missing runId query parameter' }, { status: 400, headers: corsHeaders(env) })
  }

  const res = await fetch(
    `${GH_API}/repos/${env.GH_RUNNER_OWNER}/${env.GH_RUNNER_REPO}/actions/runs/${runId}`,
    {
      headers: {
        Authorization: `Bearer ${env.GH_SERVICE_PAT}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    },
  )

  if (!res.ok) {
    return Response.json({ error: 'Run not found' }, { status: res.status, headers: corsHeaders(env) })
  }

  const run = await res.json()
  return Response.json(
    { status: run.status, conclusion: run.conclusion, runUrl: run.html_url },
    { headers: corsHeaders(env) },
  )
}
