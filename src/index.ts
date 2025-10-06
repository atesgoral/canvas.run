import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { sessionRoutes } from './routes/session';
import { runRoutes } from './routes/run';
import { profileRoutes } from './routes/profile';
import { authRoutes } from './routes/auth';

type Bindings = {
  DB: D1Database;
  ASSETS: Fetcher;
  SESSION_SECRET?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// Middleware
app.use('*', logger());
app.use('/api/*', cors());

app.route('/api/session', sessionRoutes);
app.route('/api/runs', runRoutes);
app.route('/api/profile', profileRoutes);
app.route('/auth', authRoutes);

// Serve static assets from client/dist
app.get('*', async (c) => {
  const url = new URL(c.req.url);

  // Try to fetch from ASSETS binding (static files)
  try {
    const assetResponse = await c.env.ASSETS.fetch(c.req.raw);
    if (assetResponse.status !== 404) {
      return assetResponse;
    }
  } catch (e) {
    // Fall through to serve index.html
  }

  // Serve index.html for client-side routing
  try {
    const indexResponse = await c.env.ASSETS.fetch(new Request(`${url.origin}/index.html`));
    return indexResponse;
  } catch (e) {
    return c.text('Not Found', 404);
  }
});

export default app;
