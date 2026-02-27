# Security Policy

## Supported Versions

We are committed to resolving critical security issues in the active versions of this project.

| Version | Supported          |
| ------- | ------------------ |
| v1.x.x  | :white_check_mark: |

## Reporting a Vulnerability

We take the security of this project very seriously. If you discover a security vulnerability within `hw-license-center`, please do not publicly disclose it via GitHub Issues or public forums. 

Instead, please send an e-mail directly to the project maintainers or use GitHub's private vulnerability reporting feature.

**Please include the following information in your report:**
- Type of issue (e.g. buffer overflow, SQL injection, cross-site scripting, etc.)
- Full paths of source file(s) related to the manifestation of the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit the issue

We will endeavor to respond to your report within 48 hours and will keep you informed of our progress towards a resolution. Once the issue is resolved, we will publish a security advisory and notify users to update.

### Security Best Practices for Deployment
- **Always modify the `ADMIN_SECRET`** before deploying to a production environment.
- Use a strong, long, and unpredictable string for your `JWT_SECRET`.
- Restrict `ALLOWED_ORIGINS` to your truly trusted frontend domains.
- Ensure HTTPS is enforced on your Worker route/VPS domain.
