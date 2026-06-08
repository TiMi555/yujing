import { config } from '../config.js';

export async function adminAuth(ctx, next) {
  const key = ctx.get('X-Admin-Key');
  if (key !== config.adminApiKey) {
    ctx.status = 401;
    ctx.body = { error: 'UNAUTHORIZED', message: 'Invalid admin key' };
    return;
  }
  await next();
}
