import { Router } from 'itty-router';

const router = Router();

router.get('/', () => {
  return Response.json({ status: 'ok' });
});

router.all('*', () => new Response('Not Found', { status: 404 }));

export default {
  fetch: (request, env, ctx) => router.fetch(request, env, ctx),
};
