import { Router } from 'itty-router';
import { githubCallback } from './routes/auth.js';
import { handleExtract } from './routes/extract.js';
import { handleStatus } from './routes/status.js';

const router = Router();

router.get('/', () => Response.json({ status: 'ok' }));
router.get('/auth/github/callback', githubCallback);
router.post('/extract', handleExtract);
router.options('/extract', handleExtract);
router.get('/status', handleStatus);
router.options('/status', handleStatus);
router.all('*', () => new Response('Not Found', { status: 404 }));

export default {
  fetch: (request, env, ctx) => router.fetch(request, env, ctx),
};
