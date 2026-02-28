import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Env } from './types';
import { loggerMiddleware } from './middleware/logger';
import { adminAuthMiddleware } from './middleware/auth';
import { rateLimiter } from './middleware/rate-limiter';
import publicRoutes from './routes/public';
import adminRoutes from './routes/admin';
import webhookRoutes from './routes/webhook';
import { adminHtml } from './static/adminHtml';
import { portalHtml } from './static/portalHtml';

import { DBAdapter } from './db/adapter';
import { trimTrailingSlash } from 'hono/trailing-slash';
import { errorReporter } from './middleware/error-reporter';

export const app = new Hono<{ Bindings: Env }>({ strict: false });

// 1. 全局兜底错误拦截（最外层，捕获后续所有异常）
app.use('*', errorReporter);

// 2. 简易日志记录
app.use('*', loggerMiddleware);

// 移除末尾多余斜杠
app.use('*', trimTrailingSlash());

// 核心同构钩子：拦截并在下文执行前将原生 DB 对象使用 DBAdapter 包裹包装。
// 若环境为 Cloudflare Workers，则代理调用；若为原生 Node.js，则在此注入本地 SQLite 实例，平层替换 c.env.DB。
app.use('*', async (c, next) => {
  if (!c.env) (c as any).env = {};

  // 在 Node.js 环境下，补充 process.env 到 c.env
  if (typeof process !== 'undefined' && process.env) {
    Object.assign(c.env, process.env);
  }

  // 核心同构钩子：拦截并在下文执行前将原生 DB 对象使用 DBAdapter 包裹包装。
  // 若环境为 Cloudflare Workers，则代理调用；若为原生 Node.js，则在此注入本地 SQLite 实例，平层替换 c.env.DB。
  if (c.env.DB && (c.env.DB as any).__isAdapter) {
    return await next();
  }

  c.env.DB = new DBAdapter(c.env.DB) as any;
  (c.env.DB as any).__isAdapter = true;
  await next();
});

// 通用跨域处理：优先使用环境变量，不填则退化为仅拦截特殊情形
app.use('/api/*', async (c, next) => {
  const allowedOriginsStr = c.env.ALLOWED_ORIGINS;
  const whitelist = allowedOriginsStr ? allowedOriginsStr.split(',').map(s => s.trim()) : [];

  const corsMiddleware = cors({
    origin: (origin) => {
      if (!origin) return '*';
      // 内部协议始终放行
      if (origin.startsWith('obsidian://') || origin.startsWith('app://')) return origin;

      // 如果未配置白名单（开源默认态），则根据环境决定是放行还是阻断
      if (whitelist.length === 0) {
        // 兼容 Cloudflare Workers 与本地 Node 环境的生产模式判定
        const isProduction = c.env.NODE_ENV === 'production' ||
          (!c.env.NODE_ENV && typeof process !== 'undefined' && (process as any).env.NODE_ENV === 'production');

        if (isProduction) {
          console.warn(`[CORS] 生产环境拦截未授权来源: ${origin}`);
          return null; // 生产环境默认阻断所有跨域
        }
        return origin; // 开发环境保持极简放通
      }

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
// Webhook 支付回调接口：限流 60 秒 20 次
app.use('/api/v1/auth/webhook/*', rateLimiter({ max: 20, window: 60 }));

// 核心路由挂载
// 先挂载更具体的 Webhook 路径，防止被通用的 /api/v1/auth 遮蔽
app.route('/api/v1/auth/webhook', webhookRoutes);
app.route('/api/v1/auth', publicRoutes);

// 挂载管理员接口全局拦截器
// 管理后台接口：限流 60 秒 100 次，防并发扫描
app.use('/api/v1/auth/admin/*', rateLimiter({ max: 100, window: 60 }));
app.use('/api/v1/auth/admin/*', adminAuthMiddleware);

// 挂载后台所有 CRUD 管理接口
app.route('/api/v1/auth/admin', adminRoutes);

// 挂载纯前端单页应用
app.get('/admin', (c) => c.html(adminHtml));
app.get('/portal', async (c) => {
  let html = portalHtml;
  try {
    const configs = await c.env.DB.prepare("SELECT key, value FROM SystemConfig WHERE category = 'portal'").all();
    const configMap = (configs.results || []).reduce((acc: any, cur: any) => {
      acc[cur.key] = cur.value;
      return acc;
    }, {});

    html = html.replace(/\{\{portal_title\}\}/g, configMap.portal_title || '设备解绑查询门户');
    html = html.replace(/\{\{portal_subtitle\}\}/g, configMap.portal_subtitle || '在线强制释出与卡密关联的失效或闲置物理设置');
    html = html.replace(/\{\{portal_tips\}\}/g, (configMap.portal_tips || '').replace(/\n/g, '<br/>'));
    html = html.replace(/\{\{admin_contact\}\}/g, configMap.admin_contact || '请联系您的发卡方处理');
  } catch (e) {
    console.error('Portal dynamic render error:', e);
  }
  return c.html(html);
});

export default app;
