import { verifyToken } from '../services/authService.js';

export async function optionalAuth(ctx, next) {
  const header = ctx.get('Authorization');
  if (header?.startsWith('Bearer ')) {
    try {
      ctx.state.user = verifyToken(header.slice(7));
    } catch {
      ctx.state.user = null;
    }
  }
  await next();
}

export async function requireAuth(ctx, next) {
  const header = ctx.get('Authorization');
  if (!header?.startsWith('Bearer ')) {
    ctx.status = 401;
    ctx.body = { error: 'UNAUTHORIZED', message: 'Login required' };
    return;
  }
  try {
    ctx.state.user = verifyToken(header.slice(7));
  } catch {
    ctx.status = 401;
    ctx.body = { error: 'UNAUTHORIZED', message: 'Invalid token' };
    return;
  }
  await next();
}
