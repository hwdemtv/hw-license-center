# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

hw-license-center is a license key management and verification service for Obsidian plugins. It provides:
- License key generation, verification, and device binding
- Multi-product subscription management (one key can subscribe to multiple products)
- Offline activation with pre-bound device IDs
- Admin dashboard for license management
- AI proxy gateway for per-user quota management
- Payment webhook integration

## Commands

```bash
# Development (Cloudflare Workers local)
npm run dev

# Development (Node.js/VPS mode)
npm run dev:node

# Deploy to Cloudflare Workers
npm run deploy

# Run tests
npm test

# Run tests with UI
npm run test:ui

# Build for Node.js/VPS deployment
npm run build:node

# Generate Cloudflare types
npm run cf-typegen
```

## Architecture

### Dual Runtime Support

This project runs on both Cloudflare Workers and Node.js using an isomorphic database adapter (`src/db/adapter.ts`):
- **Cloudflare Workers**: Uses native D1 database binding
- **Node.js/VPS**: Uses better-sqlite3 with D1 API compatibility layer

The `DBAdapter` class wraps both runtimes, providing a unified `prepare()`, `bind()`, `first()`, `all()`, `run()`, `batch()`, and `exec()` interface.

### Entry Points

- `src/index.ts` - Cloudflare Workers entry (exports Hono app)
- `src/server.node.ts` - Node.js/VPS entry (starts HTTP server with dotenv)

### Core Application Structure

```
src/
├── app.ts              # Main Hono app, middleware chain, route mounting
├── index.ts            # CF Workers export
├── server.node.ts      # Node.js server
├── types.ts            # TypeScript interfaces (License, Device, Subscription, etc.)
├── db/
│   ├── adapter.ts      # D1/better-sqlite3 isomorphic adapter
│   └── seeds/          # SQL migration/seed files
├── middleware/
│   ├── auth.ts         # Admin password verification (DB first, fallback to env)
│   ├── rate-limiter.ts # KV-based request rate limiting
│   ├── logger.ts       # Request logging
│   └── error-reporter.ts
├── routes/
│   ├── public.ts       # /api/v1/auth/verify, /unbind, /portal (client-facing)
│   ├── admin.ts        # /api/v1/auth/admin/* (CRUD operations)
│   ├── webhook.ts      # Payment callback handlers
│   └── ai_proxy.ts     # AI API proxy with per-user quotas
├── static/
│   ├── adminHtml.ts    # Admin dashboard SPA (embedded HTML/CSS/JS)
│   └── portalHtml.ts   # User self-service portal
└── utils/
    ├── crypto-helper.ts      # Password hashing/verification
    └── offline-activation.ts # Offline token generation/signing
```

### Database Schema

Four main tables (see `schema.sql`):
- **Licenses**: Core activation codes with product_id, status, max_devices, AI quota overrides
- **Subscriptions**: Multi-product support (one license can have multiple product subscriptions with expiry dates)
- **Devices**: Device bindings with license_key as foreign key
- **SystemConfig**: Key-value config store for admin password, AI settings, portal customization
- **Notifications**: Broadcast messages for users

### Authentication Flow

1. **Admin API**: Uses `adminAuthMiddleware` - password verified against DB `SystemConfig.admin_password` or env `ADMIN_SECRET`
2. **Client Verify API**: Returns JWT token signed with `JWT_SECRET` containing license_key and products

### Rate Limiting

Rate limits are enforced via Cloudflare KV (`RATE_LIMITER` binding):
- `/api/v1/auth/verify`: 15 req/60s
- `/api/v1/auth/unbind`: 5 req/60s
- `/api/v1/auth/admin/*`: 100 req/60s
- `/api/v1/ai/*`: 10 req/60s

### Admin Dashboard

The admin UI (`/admin`) is a single-page app embedded in `adminHtml.ts` with:
- Left sidebar navigation
- Dashboard with charts (status distribution, device usage, product distribution)
- License generation (standard and offline)
- License management with filtering, pagination, batch operations
- System settings for global configuration
- Notification broadcasting

### Testing

Tests use Vitest with in-memory SQLite. Test files are in `test/` directory. Each test creates a mock D1 interface using `createD1Mock()` helper and injects it into the Hono app's env bindings.

## Deployment

### Cloudflare Workers (Production)

1. Set secrets: `wrangler secret put ADMIN_SECRET`, `wrangler secret put JWT_SECRET`
2. Run `npm run deploy`
3. Access at custom domain configured in `wrangler.toml`

### Node.js/VPS

1. Set environment variables: `JWT_SECRET`, `ADMIN_SECRET`, `DATABASE_PATH`
2. Run `npm run build:node`
3. Run `node dist/server.js` or use `npm start` with dotenv

## Key Implementation Details

- **One Key, Multiple Products**: The `Subscriptions` table allows a single license to have multiple product entitlements. The `/verify` API returns all subscribed products.
- **Offline Activation**: Licenses with `prebound_device_id` are offline activation codes that only work on that specific device. They generate signed tokens for offline validation.
- **AI Quota Per User**: `Licenses.ai_daily_quota` and related fields allow per-user AI API quotas, reset daily via `ai_last_reset_date`.
- **Risk Control**: `risk_level` and `risk_threshold` fields support device binding abuse detection.
