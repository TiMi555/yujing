import Router from 'koa-router';
import path from 'path';
import { fileURLToPath } from 'url';
import { adminAuth } from '../middleware/adminAuth.js';
import {
  listAllStoriesAdmin,
  listFailuresAdmin,
  getActiveStory,
  regenerateStoryAdmin,
} from '../services/storyService.js';
import { generateStorySync } from '../services/generateService.js';
import { query } from '../db/pool.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = new Router({ prefix: '/admin' });

router.get('/stories', adminAuth, async (ctx) => {
  ctx.body = { items: await listAllStoriesAdmin(ctx.query) };
});

router.get('/failures', adminAuth, async (ctx) => {
  ctx.body = { items: await listFailuresAdmin() };
});

router.post('/stories/:conceptKey/regenerate', adminAuth, async (ctx) => {
  const { conceptKey } = ctx.params;
  const { rows } = await query(`SELECT * FROM concept_keys WHERE key = $1`, [conceptKey]);
  if (!rows[0]) {
    ctx.status = 404;
    ctx.body = { error: 'NOT_FOUND', message: 'Concept not found' };
    return;
  }
  const concept = rows[0];
  const active = await getActiveStory(conceptKey);
  const inheritedUnlockCount = active?.unlock_count || 0;

  const storyJson = await generateStorySync({
    concept_key: conceptKey,
    canonical_name: concept.canonical_name,
    category: concept.category,
  });

  const story = await regenerateStoryAdmin(conceptKey, storyJson, inheritedUnlockCount);
  ctx.body = { story };
});

router.get('/', async (ctx) => {
  ctx.type = 'html';
  const { readFileSync } = await import('fs');
  ctx.body = readFileSync(path.join(__dirname, '../../admin/index.html'), 'utf8');
});

export default router;
