import { serve } from '@hono/node-server';
import app from './app';
import * as dotenv from 'dotenv';
dotenv.config();

const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;

console.log(`🚀 Starting License Center on Node.js / VPS`);
console.log(`http://localhost:${port}`);

serve({
    fetch: app.fetch,
    port
});
