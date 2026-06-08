import Koa from 'koa';
import cors from '@koa/cors';
import bodyParser from 'koa-bodyparser';
import Router from 'koa-router';
import { errorHandler } from './middleware/errorHandler.js';
import conceptsRouter from './routes/concepts.js';
import storiesRouter from './routes/stories.js';
import { authRouter, meRouter } from './routes/auth.js';
import adminRouter from './routes/admin.js';

const app = new Koa();
const rootRouter = new Router();

rootRouter.get('/health', (ctx) => {
  ctx.body = { ok: true, service: 'yujing-api' };
});

app.use(errorHandler);
app.use(cors());
app.use(bodyParser({ jsonLimit: '2mb' }));
app.use(rootRouter.routes());
app.use(conceptsRouter.routes());
app.use(storiesRouter.routes());
app.use(authRouter.routes());
app.use(meRouter.routes());
app.use(adminRouter.routes());

export default app;
