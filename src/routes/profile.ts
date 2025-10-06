import { Hono } from 'hono';
import { sessionMiddleware } from '../lib/session';

export const profileRoutes = new Hono();

profileRoutes.use('*', sessionMiddleware);

profileRoutes.put('/', async (c) => {
  const user = c.get('user');

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const body = await c.req.json();
  const { displayName, profileUrl, photoUrl } = body;

  await c.env.DB
    .prepare('UPDATE users SET display_name = ?, profile_url = ?, photo_url = ? WHERE id = ?')
    .bind(displayName, profileUrl, photoUrl, user.id)
    .run();

  return c.json({
    id: user.id,
    displayName,
    profileUrl,
    photoUrl,
  });
});
