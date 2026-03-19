import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Env } from './types';
import { loggerMiddleware } from './middleware/logger';
import { adminAuthMiddleware } from './middleware/auth';
import { rateLimiter } from './middleware/rate-limiter';
import publicRoutes from './routes/public';
import adminRoutes from './routes/admin';
import webhookRoutes from './routes/webhook';
import aiProxyRoutes from './routes/ai_proxy';
import { adminHtml } from './static/adminHtml';
import { portalHtml } from './static/portalHtml';

import { DBAdapter } from './db/adapter';
import { trimTrailingSlash } from 'hono/trailing-slash';
import { errorReporter } from './middleware/error-reporter';

export const app = new Hono<{ Bindings: Env }>({ strict: false });

// 配置检查缓存（避免每次请求都检查）
let configChecked = false;

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
  // 检查 __isAdapter 标记避免重复包装（Cloudflare Workers 环境）
  // 注意：Node.js 环境下每次请求都会重新创建，因为 c.env 是请求级别的
  if (c.env.DB && (c.env.DB as any).__isAdapter) {
    return await next();
  }

  c.env.DB = new DBAdapter(c.env.DB) as any;
  (c.env.DB as any).__isAdapter = true;
  await next();
});

// 3. 必要配置检查（启动时检查一次）
app.use('*', async (c, next) => {
  if (!configChecked) {
    configChecked = true;
    const missingConfigs: string[] = [];

    // 检查 JWT_SECRET
    if (!c.env.JWT_SECRET) {
      missingConfigs.push('JWT_SECRET');
      console.error('[CONFIG_ERROR] 缺少必要配置: JWT_SECRET');
    }

    // 检查 ADMIN_SECRET（允许从数据库读取，这里只是警告）
    if (!c.env.ADMIN_SECRET) {
      console.warn('[CONFIG_WARN] 未配置 ADMIN_SECRET 环境变量，将依赖数据库中的 admin_password 配置');
    }

    if (missingConfigs.length > 0) {
      console.error(`[CONFIG_ERROR] 服务启动失败，缺少必要配置: ${missingConfigs.join(', ')}`);
    } else {
      console.log('[CONFIG_OK] 必要配置检查通过');
    }
  }
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
          // 生产环境未配置白名单时，发出警告但仍放行同源请求
          // 避免服务不可用，管理员应及时配置 ALLOWED_ORIGINS
          console.warn(`[CORS] 生产环境警告: 未配置 ALLOWED_ORIGINS，建议配置以提高安全性。当前放行请求: ${origin}`);
          return origin;
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

// 健康检查入口
app.get('/health', async (c) => {
  const startTime = Date.now();

  // 检查数据库连接
  let dbStatus = 'ok';
  let dbLatency = 0;
  try {
    const dbStart = Date.now();
    await c.env.DB.prepare('SELECT 1').first();
    dbLatency = Date.now() - dbStart;
  } catch (e) {
    dbStatus = 'error';
    console.error('[HealthCheck] 数据库连接失败:', e);
  }

  // 检查必要配置
  const configStatus = {
    jwt_secret: !!c.env.JWT_SECRET,
    admin_secret: !!c.env.ADMIN_SECRET,
    rate_limiter_kv: !!c.env.RATE_LIMITER
  };

  // 判断整体状态
  const overallStatus = dbStatus === 'ok' && configStatus.jwt_secret ? 'ok' : 'degraded';

  return c.json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: process?.uptime?.() || null,
    response_time_ms: Date.now() - startTime,
    checks: {
      database: {
        status: dbStatus,
        latency_ms: dbLatency
      },
      config: configStatus
    }
  }, overallStatus === 'ok' ? 200 : 503);
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

// AI 代理网关：限流 60 秒 10 次（防刷 AI 额度）
app.use('/api/v1/ai/*', rateLimiter({ max: 10, window: 60 }));
app.route('/api/v1/ai', aiProxyRoutes);

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
