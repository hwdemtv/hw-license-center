import { serve } from '@hono/node-server';
import app from './app';
// import { config } from 'dotenv';
// config(); // Load environment variables from .env if present

const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;

console.log(`🚀 Starting License Center on Node.js / VPS`);
console.log(`http://localhost:${port}`);

serve({
    fetch: app.fetch,
    port
});
