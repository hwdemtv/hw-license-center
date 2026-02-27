import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Env } from './types';
import { loggerMiddleware } from './middleware/logger';
import { adminAuthMiddleware } from './middleware/auth';
import { rateLimiter } from './middleware/rate-limiter';
import publicRoutes from './routes/public';
import adminRoutes from './routes/admin';
import { adminHtml } from './static/adminHtml';
import { portalHtml } from './static/portalHtml';

const app = new Hono<{ Bindings: Env }>();

// 通用跨域处理：优先使用环境变量，不填则退化为仅拦截特殊情形
app.use('/api/*', async (c, next) => {
  const allowedOriginsStr = c.env.ALLOWED_ORIGINS;
  const whitelist = allowedOriginsStr ? allowedOriginsStr.split(',').map(s => s.trim()) : [];

  const corsMiddleware = cors({
    origin: (origin) => {
      if (!origin) return '*';
      // 内部协议始终放行
      if (origin.startsWith('obsidian://') || origin.startsWith('app://')) return origin;

      // 如果未配置白名单（开源默认态），放行任意来源以降低门槛
      if (whitelist.length === 0) return origin;

      // 如果配置了白名单，则严格匹配
      if (whitelist.includes(origin) || whitelist.includes('*')) return origin;

      return null;
    },
    allowMethods: ['POST', 'GET', 'DELETE', 'OPTIONS'],
  });

  return corsMiddleware(c, next);
});

// 简易请求耗时打印
app.use('*', loggerMiddleware);

// 健康检查入口
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: Date.now() });
});

// 对外验证接口：限流 60 秒 15 次，防刷
app.use('/api/v1/auth/verify', rateLimiter({ max: 15, window: 60 }));
// 对外解绑接口：限流 60 秒 5 次 (防恶意踢人)
app.use('/api/v1/auth/unbind', rateLimiter({ max: 5, window: 60 }));
// 门户查询接口：限流 60 秒 5 次 
app.use('/api/v1/auth/portal/*', rateLimiter({ max: 5, window: 60 }));

// 挂载对外公开的核心 API (verify / unbind / portal)
app.route('/api/v1/auth', publicRoutes);

// 挂载管理员接口全局拦截器
// 管理后台接口：限流 60 秒 100 次，防并发扫描
app.use('/api/v1/auth/admin/*', rateLimiter({ max: 100, window: 60 }));
app.use('/api/v1/auth/admin/*', adminAuthMiddleware);

// 挂载后台所有 CRUD 管理接口
app.route('/api/v1/auth/admin', adminRoutes);

// 挂载纯前端单页应用
app.get('/admin', (c) => c.html(adminHtml));
app.get('/portal', (c) => c.html(portalHtml));

export default app;
