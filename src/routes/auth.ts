import { Hono } from 'hono';

// Simplified auth routes - OAuth removed
export const authRoutes = new Hono();

// No authentication routes needed since OAuth is removed
authRoutes.get('*', (c) => {
  return c.text('Authentication not configured', 404);
});
