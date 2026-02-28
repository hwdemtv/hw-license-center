# Security Policy (v22+)

## Supported Versions

We are committed to resolving critical security issues in the active versions of this project.

| Version | Supported          |
| ------- | ------------------ |
| v22.x.x | :white_check_mark: |
| v1.x.x  | :warning: (Legacy) |

---

## 🛡️ Core Security Mechanisms (Phase 26 Update)

To protect the integrity of the license center, we have implemented multiple layers of defense:

### 1. Cross-Site Scripting (XSS) Prevention
We employ a **"Dual-Gate"** sanitization strategy for user-generated content (like device names):
- **Server Side**: The `/portal/devices` API masks sensitive strings and neutralizes potential payloads before they leave the server.
- **Client Side**: All dynamic DOM mounting in the admin and portal UI uses an `escapeHTML` utility to ensure data is rendered strictly as text, not as executable code.

### 2. Rate Limiting & Memory Safety
Our rate limiter middleware protects against brute-force attacks:
- **Active Garbage Collection (GC)**: In Node.js environments, an automated 60s cleanup task proactively evicts expired records from memory, preventing denial-of-service (DoS) via memory exhaustion.
- **Persistent Identification**: Rate limits are enforced based on connecting IPs (supporting Cloudflare headers).

### 3. JWT Integrity
- **HS256 Signing**: All tokens issued by the center are digitally signed.
- **Clock Drift Tolerance**: Integrated time synchronization prevents valid tokens from being rejected due to minor server-client clock mismatches.

---

## Reporting a Vulnerability

We take the security of this project very seriously. If you discover a security vulnerability within `hw-license-center`, please do not publicly disclose it via GitHub Issues or public forums. 

Instead, please use GitHub's **Private Vulnerability Reporting** feature or contact the maintainers.

### Security Best Practices for Deployment
- **Modify `ADMIN_SECRET`**: Never use the default `hwdemtv` in production.
- **Rotate `JWT_SECRET`**: We recommend rotating your signing key every 6-12 months.
- **CORS Lockdown**: In production, the system automatically blocks unauthorized cross-origin requests unless explicitly whitelisted in `ALLOWED_ORIGINS`.
- **Enforce HTTPS**: Cloudflare Workers enforce this by default; ensure your VPS Nginx config supports SSL.
