import Router from 'koa-router';
import { wechatLogin, mergeDeviceUnlocks, getLibrary } from '../services/authService.js';
import { requireAuth } from '../middleware/auth.js';

const router = new Router({ prefix: '/api/auth' });

router.post('/wechat', async (ctx) => {
  const { code } = ctx.request.body || {};
  const result = await wechatLogin(code);
  ctx.body = result;
});

router.post('/merge-device', requireAuth, async (ctx) => {
  const { device_id } = ctx.request.body || {};
  await mergeDeviceUnlocks(ctx.state.user.sub, device_id);
  ctx.body = { ok: true };
});

const meRouter = new Router({ prefix: '/api/me' });

meRouter.get('/library', requireAuth, async (ctx) => {
  const grouped = await getLibrary(ctx.state.user.sub);
  const result = {};
  for (const [category, rows] of Object.entries(grouped)) {
    result[category] = rows.map((row) => ({
      id: row.id,
      title: row.title,
      category: row.category,
      reading_minutes: row.reading_minutes,
      unlock_count: row.unlock_count,
      unlocked_at: row.unlocked_at,
      concept_name: row.concept_name,
      story_content: row.story_content,
      academic_definition: row.academic_definition,
      metaphor_mappings:
        typeof row.metaphor_mappings === 'string'
          ? JSON.parse(row.metaphor_mappings)
          : row.metaphor_mappings,
    }));
  }
  ctx.body = { library: result };
});

export { router as authRouter, meRouter };
