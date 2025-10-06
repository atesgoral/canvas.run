# Migration to Cloudflare Workers

This project has been migrated from Express/MongoDB on Glitch to Hono/D1 on Cloudflare Workers.

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Create D1 Database

```bash
npm run db:create
```

This will output a database ID. Copy it and update the `database_id` in `wrangler.toml`.

### 3. Initialize Database Schema

```bash
npm run db:init
```

### 4. Build Client Assets

```bash
npm run build:client
```

### 5. Run Development Server

```bash
npm run dev
```

## Deployment

### 1. Create Production Database

```bash
wrangler d1 create canvas-run-prod
```

Update the production `database_id` in `wrangler.toml` under `[env.production]`.

### 2. Initialize Production Schema

```bash
npm run db:init:prod
```

### 3. Deploy

```bash
npm run deploy
```

## What Changed

### Removed
- Express.js → Replaced with Hono
- MongoDB/Mongoose → Replaced with Cloudflare D1 (SQLite)
- All OAuth authentication (Facebook, Twitter, GitHub, Google) → Removed for simplicity
- Passport.js → Removed (no longer needed without OAuth)
- Sessions stored in MongoDB → Now stored in D1

### Added
- Hono framework for routing
- Cloudflare D1 for database
- TypeScript for type safety
- Simple session management without OAuth

### Architecture Changes

**Before:**
- Express server with MongoDB
- OAuth authentication via Passport
- Session storage in MongoDB via connect-mongo

**After:**
- Cloudflare Workers with Hono
- No authentication (simplified)
- Session storage in D1 database
- Static assets served via Cloudflare Assets

## Database Schema

The D1 schema mirrors the MongoDB structure:

- `users` - User profiles (currently unused without OAuth)
- `runs` - Canvas run code snippets
- `run_likes` - User likes on runs
- `sessions` - Session data

## API Endpoints

All API endpoints remain the same:

- `GET /api/session` - Get current session info
- `GET /api/runs/:shortId` - Get a run by short ID
- `POST /api/runs` - Create a new run
- `PUT /api/runs/:shortId` - Update a run
- `POST /api/runs/:shortId/fork` - Fork a run
- `GET /api/runs/:shortId/likes` - Get like count for a run
- `POST /api/runs/:shortId/like` - Like a run (requires user)
- `POST /api/runs/:shortId/unlike` - Unlike a run (requires user)
- `PUT /api/profile` - Update user profile (requires user)

## Notes

- User authentication has been removed for simplicity
- Sessions are still tracked to associate runs with anonymous users
- Like/unlike and profile endpoints will return 401 since there's no auth
- The client application should work as-is, minus authentication features
