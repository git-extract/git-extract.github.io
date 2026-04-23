const VERIFIER_KEY = 'gitlab_verifier';
const HOST_KEY = 'gitlab_host';

async function generateCodeChallenge(verifier) {
  const encoded = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', encoded);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export async function startGitlabLogin(host, clientId) {
  const bytes = crypto.getRandomValues(new Uint8Array(48));
  const verifier = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  const challenge = await generateCodeChallenge(verifier);

  sessionStorage.setItem(VERIFIER_KEY, verifier);
  sessionStorage.setItem(HOST_KEY, host);

  const redirectUri = `${window.location.origin}/#/auth/gitlab`;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'read_api',
    code_challenge: challenge,
    code_challenge_method: 'S256',
  });

  window.location.href = `https://${host}/oauth/authorize?${params}`;
}

export async function exchangeGitlabCode(code) {
  const verifier = sessionStorage.getItem(VERIFIER_KEY);
  const host = sessionStorage.getItem(HOST_KEY);

  sessionStorage.removeItem(VERIFIER_KEY);
  sessionStorage.removeItem(HOST_KEY);

  const redirectUri = `${window.location.origin}/#/auth/gitlab`;
  const body = new URLSearchParams({
    client_id: process.env.GITLAB_CLIENT_ID,
    code,
    code_verifier: verifier,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri,
  });

  const response = await fetch(`https://${host}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  return response.json();
}
