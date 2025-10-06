import { Context } from 'hono';
import { createMiddleware } from 'hono/factory';
import { nanoid } from 'nanoid';

export interface SessionData {
  id: string;
  userId?: string;
  data?: Record<string, any>;
}

const SESSION_COOKIE_NAME = 'canvas_run_session';
const SESSION_EXPIRY_DAYS = 30;

export async function getSession(c: Context, db: D1Database): Promise<SessionData> {
  const sessionId = c.req.cookie(SESSION_COOKIE_NAME);

  if (sessionId) {
    const result = await db
      .prepare('SELECT id, user_id, data FROM sessions WHERE id = ? AND (expires_at IS NULL OR expires_at > ?)')
      .bind(sessionId, Date.now())
      .first();

    if (result) {
      return {
        id: result.id as string,
        userId: result.user_id as string | undefined,
        data: result.data ? JSON.parse(result.data as string) : undefined,
      };
    }
  }

  // Create new session
  const newSessionId = nanoid();
  const expiresAt = Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

  await db
    .prepare('INSERT INTO sessions (id, expires_at) VALUES (?, ?)')
    .bind(newSessionId, expiresAt)
    .run();

  return { id: newSessionId };
}

export async function saveSession(db: D1Database, session: SessionData) {
  const expiresAt = Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

  await db
    .prepare('UPDATE sessions SET user_id = ?, data = ?, expires_at = ? WHERE id = ?')
    .bind(session.userId || null, session.data ? JSON.stringify(session.data) : null, expiresAt, session.id)
    .run();
}

export function setSessionCookie(c: Context, sessionId: string) {
  c.cookie(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
    maxAge: SESSION_EXPIRY_DAYS * 24 * 60 * 60,
  });
}

export const sessionMiddleware = createMiddleware(async (c, next) => {
  const session = await getSession(c, c.env.DB);
  setSessionCookie(c, session.id);

  // Load user if session has userId
  if (session.userId) {
    const user = await c.env.DB
      .prepare('SELECT * FROM users WHERE id = ?')
      .bind(session.userId)
      .first();

    if (user) {
      c.set('user', user);
    }
  }

  c.set('session', session);
  await next();
});
