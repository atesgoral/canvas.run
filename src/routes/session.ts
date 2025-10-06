import { Hono } from 'hono';
import { sessionMiddleware } from '../lib/session';

export const sessionRoutes = new Hono();

sessionRoutes.use('*', sessionMiddleware);

sessionRoutes.get('/', (c) => {
  const session = c.get('session');
  const user = c.get('user');

  return c.json({
    id: session.id,
    user: user ? {
      id: user.id,
      displayName: user.display_name,
      profileUrl: user.profile_url,
      photoUrl: user.photo_url,
    } : null,
  });
});
