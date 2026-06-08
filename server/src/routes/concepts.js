import Router from 'koa-router';
import { normalizeConcept } from '../services/conceptService.js';

const router = new Router({ prefix: '/api/concepts' });

router.post('/normalize', async (ctx) => {
  const { query } = ctx.request.body || {};
  if (!query?.trim()) {
    ctx.status = 400;
    ctx.body = { error: 'BAD_REQUEST', message: 'query is required' };
    return;
  }
  const result = await normalizeConcept(query.trim());
  ctx.body = result;
});

export default router;
