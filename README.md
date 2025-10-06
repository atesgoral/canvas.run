# Canvas.run

A creative coding platform for writing and sharing animated canvas sketches. Runs on Cloudflare Workers.

## Prerequisites

- Node.js 18+ installed
- A Cloudflare account
- Wrangler CLI (included as dev dependency)

## Local Development

### 1. Install dependencies

```bash
npm install
```

### 2. Create a D1 database

```bash
npm run db:create
```

This will output a database ID. Copy it and update the `database_id` in `wrangler.toml` under the main `[[d1_databases]]` section.

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

This will build the client assets and deploy the worker to Cloudflare.

## Project Structure

```
.
├── src/
│   ├── index.ts           # Main worker entry point
│   ├── routes/            # API route handlers
│   │   ├── auth.ts        # Auth routes (placeholder)
│   │   ├── profile.ts     # User profile routes
│   │   ├── run.ts         # Canvas run CRUD operations
│   │   └── session.ts     # Session management
│   ├── lib/
│   │   ├── session.ts     # Session middleware and helpers
│   │   └── shortid.ts     # Short ID generation
│   └── db/
│       └── schema.sql     # D1 database schema
├── client/                # Vue.js frontend
├── wrangler.toml          # Cloudflare Workers configuration
└── package.json
```

## Database Schema

The D1 database (SQLite) includes:

- **users** - User profiles
- **runs** - Canvas code runs with versioning
- **run_likes** - Like relationships between users and runs
- **sessions** - Session storage

## API Endpoints

- `GET /api/session` - Get current session info
- `GET /api/runs/:shortId` - Get a run by short ID
- `POST /api/runs` - Create a new run
- `PUT /api/runs/:shortId` - Update a run
- `POST /api/runs/:shortId/fork` - Fork a run
- `GET /api/runs/:shortId/likes` - Get like count
- `POST /api/runs/:shortId/like` - Like a run
- `POST /api/runs/:shortId/unlike` - Unlike a run
- `PUT /api/profile` - Update user profile

## Tech Stack

- **Framework**: Hono (optimized for Cloudflare Workers)
- **Database**: Cloudflare D1 (SQLite)
- **Frontend**: Vue.js
- **Hosting**: Cloudflare Workers
- **Static Assets**: Cloudflare Assets

## Troubleshooting

### Database not found

Make sure you've:
1. Created the database with `npm run db:create`
2. Updated the `database_id` in `wrangler.toml`
3. Initialized the schema with `npm run db:init`

### Assets not loading

Build the client first:
```bash
npm run build:client
```

### Environment variables

To add secrets:
```bash
wrangler secret put SECRET_NAME
```

## License

UNLICENSED
