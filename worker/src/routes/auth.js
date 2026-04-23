export async function githubCallback(request, env) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');

  if (!code) {
    return Response.redirect(`${env.SPA_URL}/#/login?error=missing_code`, 302);
  }

  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });

  const data = await tokenRes.json();

  if (data.error || !data.access_token) {
    const msg = data.error_description || data.error || 'token_exchange_failed';
    return Response.redirect(`${env.SPA_URL}/#/login?error=${encodeURIComponent(msg)}`, 302);
  }

  return Response.redirect(`${env.SPA_URL}/#/auth/github?token=${data.access_token}`, 302);
}
