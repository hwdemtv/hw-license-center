import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Env } from './types';
import { loggerMiddleware } from './middleware/logger';
import { adminAuthMiddleware } from './middleware/auth';
import { rateLimiter } from './middleware/rate-limiter';
import publicRoutes from './routes/public';
import adminRoutes from './routes/admin';
import { adminHtml } from './static/adminHtml';

const app = new Hono<{ Bindings: Env }>();

// 仅允许 Obsidian 插件和自有域名的跨域请求
app.use('/api/*', cors({
  origin: ['obsidian://', 'app://', 'https://km.hwdemtv.com', 'https://kami.hwdemtv.com', 'https://hw-license-center.hwdemtv.workers.dev'],
  allowMethods: ['POST', 'GET', 'DELETE', 'OPTIONS'],
}));

// 简易请求耗时打印
app.use('*', loggerMiddleware);

// 健康检查入口
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: Date.now() });
});

// 挂载对外公开的核心 API (verify / unbind)
// 对外验证接口：限流 60 秒 15 次，防刷
app.use('/api/v1/auth/verify', rateLimiter({ max: 15, window: 60 }));
app.route('/api/v1/auth', publicRoutes);

// 挂载管理员接口全局拦截器
// 管理后台接口：限流 60 秒 100 次，防并发扫描
app.use('/api/v1/auth/admin/*', rateLimiter({ max: 100, window: 60 }));
app.use('/api/v1/auth/admin/*', adminAuthMiddleware);

// 挂载后台所有 CRUD 管理接口
app.route('/api/v1/auth/admin', adminRoutes);

// 挂载纯前端单页应用
app.get('/admin', (c) => c.html(adminHtml));

export default app;
