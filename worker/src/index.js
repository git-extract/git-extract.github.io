import { Router } from 'itty-router';
import { githubCallback } from './routes/auth.js';

const router = Router();

router.get('/', () => {
  return Response.json({ status: 'ok' });
});

router.get('/auth/github/callback', githubCallback);

router.all('*', () => new Response('Not Found', { status: 404 }));

export default {
  fetch: (request, env, ctx) => router.fetch(request, env, ctx),
};
