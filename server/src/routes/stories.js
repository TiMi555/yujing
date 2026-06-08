import Router from 'koa-router';
import { generateStoryStream } from '../services/generateService.js';
import {
  getFeed,
  getStoryById,
  getGenerationStatus,
  unlockStory,
  isStoryUnlockedByUser,
} from '../services/storyService.js';
import { feedRowToCard, rowToStory } from '../utils/helpers.js';
import { optionalAuth } from '../middleware/auth.js';

const router = new Router({ prefix: '/api/stories' });

function parseMappings(row) {
  if (!row) return row;
  if (typeof row.metaphor_mappings === 'string') {
    row.metaphor_mappings = JSON.parse(row.metaphor_mappings);
  }
  return row;
}

router.get('/feed', async (ctx) => {
  const { sort = 'hot', category, page = 1, limit = 20 } = ctx.query;
  const feed = await getFeed({
    sort,
    category: category || undefined,
    page: Number(page),
    limit: Number(limit),
  });
  ctx.body = {
    items: feed.items.map(feedRowToCard),
    meta: {
      total: feed.total,
      categories: feed.categories,
      show_tags: feed.show_tags,
      show_sort_tabs: feed.show_sort_tabs,
    },
  };
});

router.get('/generate/status', async (ctx) => {
  const { concept_key } = ctx.query;
  if (!concept_key) {
    ctx.status = 400;
    ctx.body = { error: 'BAD_REQUEST', message: 'concept_key required' };
    return;
  }
  ctx.body = await getGenerationStatus(concept_key);
});

router.post('/generate', async (ctx) => {
  const { concept_key, canonical_name, category } = ctx.request.body || {};
  if (!concept_key || !canonical_name || !category) {
    ctx.status = 400;
    ctx.body = { error: 'BAD_REQUEST', message: 'concept_key, canonical_name, category required' };
    return;
  }

  ctx.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  ctx.status = 200;
  ctx.respond = false;

  const res = ctx.res;
  const send = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  await generateStoryStream({ concept_key, canonical_name, category }, send);
  res.write('data: [DONE]\n\n');
  res.end();
});

router.get('/:id', optionalAuth, async (ctx) => {
  const id = Number(ctx.params.id);
  const mode = ctx.query.mode || 'blind';
  const deviceId = ctx.query.device_id;
  const userId = ctx.state.user?.sub;

  let row = parseMappings(await getStoryById(id));
  if (!row) {
    ctx.status = 404;
    ctx.body = { error: 'NOT_FOUND', message: 'Story not found' };
    return;
  }

  const unlocked = await isStoryUnlockedByUser({ storyId: id, userId, deviceId });
  const showFull = mode === 'full' || unlocked;

  ctx.body = rowToStory(row, { includeConcept: showFull });
  if (showFull) {
    ctx.body.unlocked = true;
  }
});

router.post('/:id/unlock', optionalAuth, async (ctx) => {
  const storyId = Number(ctx.params.id);
  const { device_id } = ctx.request.body || {};
  const userId = ctx.state.user?.sub;

  const row = parseMappings(
    await unlockStory({ storyId, userId, deviceId: device_id }),
  );
  if (!row) {
    ctx.status = 404;
    ctx.body = { error: 'NOT_FOUND', message: 'Story not found' };
    return;
  }
  ctx.body = rowToStory(row, { includeConcept: true });
});

export default router;
