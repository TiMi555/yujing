export async function errorHandler(ctx, next) {
  try {
    await next();
  } catch (err) {
    const status = err.status || 500;
    ctx.status = status;
    ctx.body = {
      error: err.code || 'INTERNAL_ERROR',
      message: err.message || 'Internal server error',
    };
    if (status >= 500) {
      console.error(err);
    }
  }
}
