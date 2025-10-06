# Canvas.run - Cloudflare Workers Deployment Guide

This is a step-by-step guide to deploy Canvas.run on Cloudflare Workers.

## Prerequisites

- Node.js 18+ installed
- A Cloudflare account
- Wrangler CLI (installed via npm in this project)

## Local Development

### 1. Install dependencies

```bash
npm install
```

### 2. Create a local D1 database

```bash
npm run db:create
```

This will create a database and output something like:

```
✅ Successfully created DB 'canvas-run-dev' in region WEUR
Created your database using D1's new storage backend.

[[d1_databases]]
binding = "DB"
database_name = "canvas-run-dev"
database_id = "xxxx-xxxx-xxxx-xxxx"
```

Copy the `database_id` and update it in `wrangler.toml` under the main `[[d1_databases]]` section.

### 3. Initialize the database schema

```bash
npm run db:init
```

### 4. Build the client

```bash
npm run build:client
```

### 5. Start the development server

```bash
npm run dev
```

The application will be available at `http://localhost:8787`

## Production Deployment

### 1. Create a production D1 database

```bash
wrangler d1 create canvas-run-prod
```

Copy the `database_id` and update it in `wrangler.toml` under `[env.production.d1_databases]`.

### 2. Initialize production database

```bash
npm run db:init:prod
```

### 3. Set up your domain

In the `wrangler.toml` file, update the route pattern:

```toml
[env.production]
routes = [
  { pattern = "yourdomain.com/*", zone_name = "yourdomain.com" }
]
```

Make sure your domain is added to your Cloudflare account.

### 4. Deploy

```bash
npm run deploy
```

This will:
1. Build the client assets
2. Deploy the worker to Cloudflare

### 5. Verify deployment

Visit your domain and verify the application is working.

## Project Structure

```
.
├── src/
│   ├── index.ts           # Main worker entry point
│   ├── routes/            # API route handlers
│   │   ├── auth.ts        # Auth routes (simplified, no OAuth)
│   │   ├── profile.ts     # User profile routes
│   │   ├── run.ts         # Canvas run CRUD operations
│   │   └── session.ts     # Session management
│   ├── lib/
│   │   ├── session.ts     # Session middleware and helpers
│   │   └── shortid.ts     # Short ID generation
│   └── db/
│       └── schema.sql     # D1 database schema
├── client/                # Vue.js frontend (unchanged)
├── wrangler.toml          # Cloudflare Workers configuration
└── package.json
```

## Database Schema

The D1 database uses SQLite with the following tables:

- **users** - User profiles (currently minimal usage without OAuth)
- **runs** - Canvas code runs with versioning
- **run_likes** - Like relationships between users and runs
- **sessions** - Session storage for anonymous users

## Environment Variables

Currently, no environment variables are required since OAuth has been removed. If you want to add secrets later:

```bash
wrangler secret put SECRET_NAME
```

## Troubleshooting

### Database not found

Make sure you've:
1. Created the database with `wrangler d1 create`
2. Updated the `database_id` in `wrangler.toml`
3. Initialized the schema with `npm run db:init`

### Assets not loading

Make sure you've built the client:
```bash
npm run build:client
```

### Routes not working

The Hono router is very similar to Express. Check the route definitions in `src/routes/`.

## Migrating Data

If you have existing data from the MongoDB/Glitch setup, you'll need to:

1. Export data from MongoDB
2. Transform it to match the D1 schema
3. Import using `wrangler d1 execute` with INSERT statements

## Differences from Original

- **No OAuth** - All authentication providers (Facebook, Twitter, GitHub, Google) have been removed
- **D1 instead of MongoDB** - Using Cloudflare's D1 (SQLite) instead of MongoDB
- **Hono instead of Express** - Lightweight framework optimized for Workers
- **No Passport.js** - Simplified authentication (currently none)
- **Cloudflare Assets** - Static files served via Cloudflare's asset handling

## Next Steps

- Add authentication if needed (consider simple email/password or social login via OAuth)
- Set up analytics with Cloudflare Analytics Engine
- Add rate limiting with Cloudflare Rate Limiting
- Configure caching for better performance
