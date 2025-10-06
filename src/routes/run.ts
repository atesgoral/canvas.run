import { Hono } from 'hono';
import { sessionMiddleware } from '../lib/session';
import { generateUniqueShortId } from '../lib/shortid';
import { nanoid } from 'nanoid';

export const runRoutes = new Hono();

runRoutes.use('*', sessionMiddleware);

// Get default run source
const DEFAULT_RUN_SOURCE = `// Here, you're writing the contents of a function with the following signature:
// function render(canvas, state, t)

// Get the context you want from the "canvas" argument
var ctx = canvas.getContext('2d');

ctx.fillStyle = '#000';
ctx.globalAlpha = 0.05;
ctx.fillRect(0, 0, canvas.width, canvas.height);
ctx.globalAlpha = 1;

// You can store state in "state"
if (isNaN(state.x)) {
  state.x = canvas.width / 2;
  state.y = canvas.height / 5;
  state.vx = 2;
  state.vy = 0;
}

// The "t" argument gives you the milliseconds since the animation started
var radius = (Math.sin(t / 500) + 1) * 5 + 5;
var hue = (t / 100) % 360;

ctx.fillStyle = 'hsl(' + hue + ', 100%, 50%)';
ctx.beginPath();
ctx.arc(state.x, state.y, radius, 0, 2 * Math.PI, false);
ctx.fill();

state.x += state.vx;
state.y += state.vy;

if (state.x < radius || state.x >= canvas.width - radius) {
  state.vx = -state.vx;
  state.x += state.vx;
}

if (state.y < radius || state.y >= canvas.height - radius) {
  state.vy = -state.vy;
  state.y += state.vy;
}

var gravity = 0.2;

state.vy += gravity;
`;

async function computeHash(source: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(source);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// GET /api/runs/:shortId/likes
runRoutes.get('/:shortId/likes', async (c) => {
  const shortId = c.req.param('shortId');
  const user = c.get('user');
  const userId = user?.id;

  if (shortId === 'default') {
    return c.json({
      isLikedByUser: false,
      likeCount: 0,
    });
  }

  const run = await c.env.DB
    .prepare('SELECT id FROM runs WHERE short_id = ?')
    .bind(shortId)
    .first();

  if (!run) {
    return c.json({ error: 'Run not found' }, 404);
  }

  const likeCount = await c.env.DB
    .prepare('SELECT COUNT(*) as count FROM run_likes WHERE run_id = ?')
    .bind(run.id)
    .first();

  let isLikedByUser = false;
  if (userId) {
    const userLike = await c.env.DB
      .prepare('SELECT 1 FROM run_likes WHERE run_id = ? AND user_id = ?')
      .bind(run.id, userId)
      .first();
    isLikedByUser = !!userLike;
  }

  return c.json({
    isLikedByUser,
    likeCount: likeCount?.count || 0,
  });
});

// GET /api/runs/:shortId
runRoutes.get('/:shortId', async (c) => {
  const shortId = c.req.param('shortId');

  // Handle default run
  if (shortId === 'default') {
    return c.json({
      owner: null,
      shortId: 'default',
      createdAt: null,
      parent: null,
      source: DEFAULT_RUN_SOURCE,
      owningSessionId: null,
    });
  }

  const run = await c.env.DB
    .prepare(`
      SELECT
        r.id, r.short_id, r.source, r.owning_session_id, r.created_at,
        r.owner_id, r.parent_id,
        o.id as owner_user_id, o.display_name as owner_display_name,
        o.profile_url as owner_profile_url, o.photo_url as owner_photo_url,
        p.short_id as parent_short_id,
        po.id as parent_owner_id, po.display_name as parent_owner_display_name,
        po.profile_url as parent_owner_profile_url, po.photo_url as parent_owner_photo_url
      FROM runs r
      LEFT JOIN users o ON r.owner_id = o.id
      LEFT JOIN runs p ON r.parent_id = p.id
      LEFT JOIN users po ON p.owner_id = po.id
      WHERE r.short_id = ?
    `)
    .bind(shortId)
    .first();

  if (!run) {
    return c.json({ error: 'Run not found' }, 404);
  }

  return c.json({
    owner: run.owner_id ? {
      id: run.owner_user_id,
      displayName: run.owner_display_name,
      profileUrl: run.owner_profile_url,
      photoUrl: run.owner_photo_url,
    } : null,
    shortId: run.short_id,
    createdAt: run.created_at,
    parent: run.parent_id ? {
      owner: run.parent_owner_id ? {
        id: run.parent_owner_id,
        displayName: run.parent_owner_display_name,
        profileUrl: run.parent_owner_profile_url,
        photoUrl: run.parent_owner_photo_url,
      } : null,
      shortId: run.parent_short_id,
    } : null,
    source: run.source,
    owningSessionId: run.owning_session_id,
  });
});

// POST /api/runs
runRoutes.post('/', async (c) => {
  const body = await c.req.parseBody();
  const source = body.source as string;
  const session = c.get('session');
  const user = c.get('user');
  const userId = user?.id;

  if (!source) {
    return c.json({ error: 'Source is required' }, 400);
  }

  const runId = nanoid();
  const shortId = await generateUniqueShortId(c.env.DB);
  const hash = await computeHash(source);

  await c.env.DB
    .prepare('INSERT INTO runs (id, short_id, owner_id, owning_session_id, source, hash, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .bind(runId, shortId, userId || null, session.id, source, hash, Date.now())
    .run();

  return c.json({
    owner: userId ? {
      id: user.id,
      displayName: user.display_name,
      profileUrl: user.profile_url,
      photoUrl: user.photo_url,
    } : null,
    shortId,
    createdAt: Date.now(),
    parent: null,
    source,
    owningSessionId: session.id,
  });
});

// PUT /api/runs/:shortId
runRoutes.put('/:shortId', async (c) => {
  const shortId = c.req.param('shortId');
  const body = await c.req.parseBody();
  const source = body.source as string;
  const user = c.get('user');

  if (!source) {
    return c.json({ error: 'Source is required' }, 400);
  }

  const run = await c.env.DB
    .prepare('SELECT id, owner_id FROM runs WHERE short_id = ?')
    .bind(shortId)
    .first();

  if (!run) {
    return c.json({ error: 'Run not found' }, 404);
  }

  // TODO: Check ownership
  const hash = await computeHash(source);

  await c.env.DB
    .prepare('UPDATE runs SET source = ?, hash = ? WHERE id = ?')
    .bind(source, hash, run.id)
    .run();

  // Fetch updated run with owner info
  const updatedRun = await c.env.DB
    .prepare(`
      SELECT
        r.id, r.short_id, r.source, r.owning_session_id, r.created_at,
        r.owner_id, r.parent_id,
        o.id as owner_user_id, o.display_name as owner_display_name,
        o.profile_url as owner_profile_url, o.photo_url as owner_photo_url
      FROM runs r
      LEFT JOIN users o ON r.owner_id = o.id
      WHERE r.id = ?
    `)
    .bind(run.id)
    .first();

  return c.json({
    owner: updatedRun?.owner_id ? {
      id: updatedRun.owner_user_id,
      displayName: updatedRun.owner_display_name,
      profileUrl: updatedRun.owner_profile_url,
      photoUrl: updatedRun.owner_photo_url,
    } : null,
    shortId: updatedRun?.short_id,
    createdAt: updatedRun?.created_at,
    parent: null,
    source: updatedRun?.source,
    owningSessionId: updatedRun?.owning_session_id,
  });
});

// POST /api/runs/:shortId/fork
runRoutes.post('/:shortId/fork', async (c) => {
  const shortId = c.req.param('shortId');
  const session = c.get('session');
  const user = c.get('user');
  const userId = user?.id;

  const parentRun = await c.env.DB
    .prepare('SELECT id, source FROM runs WHERE short_id = ?')
    .bind(shortId)
    .first();

  if (!parentRun) {
    return c.json({ error: 'Run not found' }, 404);
  }

  const runId = nanoid();
  const newShortId = await generateUniqueShortId(c.env.DB);
  const hash = await computeHash(parentRun.source as string);

  await c.env.DB
    .prepare('INSERT INTO runs (id, short_id, owner_id, parent_id, owning_session_id, source, hash, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(runId, newShortId, userId || null, parentRun.id, session.id, parentRun.source, hash, Date.now())
    .run();

  // Fetch the created run with owner and parent info
  const newRun = await c.env.DB
    .prepare(`
      SELECT
        r.id, r.short_id, r.source, r.owning_session_id, r.created_at,
        r.owner_id, r.parent_id,
        o.id as owner_user_id, o.display_name as owner_display_name,
        o.profile_url as owner_profile_url, o.photo_url as owner_photo_url,
        p.short_id as parent_short_id,
        po.id as parent_owner_id, po.display_name as parent_owner_display_name,
        po.profile_url as parent_owner_profile_url, po.photo_url as parent_owner_photo_url
      FROM runs r
      LEFT JOIN users o ON r.owner_id = o.id
      LEFT JOIN runs p ON r.parent_id = p.id
      LEFT JOIN users po ON p.owner_id = po.id
      WHERE r.id = ?
    `)
    .bind(runId)
    .first();

  return c.json({
    owner: newRun?.owner_id ? {
      id: newRun.owner_user_id,
      displayName: newRun.owner_display_name,
      profileUrl: newRun.owner_profile_url,
      photoUrl: newRun.owner_photo_url,
    } : null,
    shortId: newRun?.short_id,
    createdAt: newRun?.created_at,
    parent: newRun?.parent_id ? {
      owner: newRun.parent_owner_id ? {
        id: newRun.parent_owner_id,
        displayName: newRun.parent_owner_display_name,
        profileUrl: newRun.parent_owner_profile_url,
        photoUrl: newRun.parent_owner_photo_url,
      } : null,
      shortId: newRun.parent_short_id,
    } : null,
    source: newRun?.source,
    owningSessionId: newRun?.owning_session_id,
  });
});

// POST /api/runs/:shortId/like
runRoutes.post('/:shortId/like', async (c) => {
  const shortId = c.req.param('shortId');
  const user = c.get('user');

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const run = await c.env.DB
    .prepare('SELECT id FROM runs WHERE short_id = ?')
    .bind(shortId)
    .first();

  if (!run) {
    return c.json({ error: 'Run not found' }, 404);
  }

  // Insert or ignore if already liked
  await c.env.DB
    .prepare('INSERT OR IGNORE INTO run_likes (run_id, user_id, created_at) VALUES (?, ?, ?)')
    .bind(run.id, user.id, Date.now())
    .run();

  return c.json({ success: true });
});

// POST /api/runs/:shortId/unlike
runRoutes.post('/:shortId/unlike', async (c) => {
  const shortId = c.req.param('shortId');
  const user = c.get('user');

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const run = await c.env.DB
    .prepare('SELECT id FROM runs WHERE short_id = ?')
    .bind(shortId)
    .first();

  if (!run) {
    return c.json({ error: 'Run not found' }, 404);
  }

  await c.env.DB
    .prepare('DELETE FROM run_likes WHERE run_id = ? AND user_id = ?')
    .bind(run.id, user.id)
    .run();

  return c.json({ success: true });
});
