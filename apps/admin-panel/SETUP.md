# Admin Panel Setup Guide

## What Was Created

I've created a **separate web-based admin application** for managing your sponsorship business. This keeps admin functionality completely separate from the user-facing Electron app.

### Architecture

```
admin-panel/
├── server/                 # Express.js API server
│   ├── index.ts           # Main server file
│   ├── database.ts        # DuckDB connection
│   └── routes/
│       ├── sponsors.ts    # Sponsor CRUD endpoints
│       ├── resources.ts   # Resource CRUD endpoints
│       └── analytics.ts   # Analytics & reporting endpoints
├── client/                 # React web app
│   ├── src/
│   │   ├── App.tsx       # Main UI component
│   │   ├── api.ts        # API client
│   │   └── main.tsx      # Entry point
│   └── index.html
├── package.json           # Dependencies & scripts
└── README.md             # Full documentation
```

## Quick Start

### 1. Install Dependencies

```bash
cd admin-panel
npm install
```

This installs:

- **Server**: Express, better-sqlite3 (SQLite), CORS
- **Client**: React, Vite, Tailwind CSS
- **TypeScript** for both

### 2. Run in Development Mode

```bash
npm run dev
```

This starts:

- **API Server** on http://localhost:3001
- **Web Interface** on http://localhost:5173

### 3. Access the Admin Panel

Open your browser to:

```
http://localhost:5173
```

You'll see:

- Sponsors tab (list, create, edit, delete)
- Resources tab (manage sponsored content)
- Analytics tab (click metrics, revenue reports)

## How It Works

### Database Connection

The admin panel connects **directly to your Homeschool app's SQLite database**:

```
~/.homeschool/homeschool.db
```

**Important:**

- The main Electron app and admin panel can both read the database simultaneously
- For writes, only one should be active at a time to avoid SQLite locking
- Consider running the admin panel when the main app is closed
- On first run, the admin panel automatically creates the sponsorship tables (sponsors, sponsored_resources, sponsored_clicks)

### API Endpoints

The Express server provides REST endpoints:

**Sponsors:**

- `GET /api/sponsors` - List all sponsors
- `POST /api/sponsors` - Create new sponsor
- `PUT /api/sponsors/:id` - Update sponsor
- `DELETE /api/sponsors/:id` - Delete sponsor

**Resources:**

- `GET /api/resources` - List all sponsored resources
- `POST /api/resources` - Create new resource
- `PUT /api/resources/:id` - Update resource
- `DELETE /api/resources/:id` - Delete resource

**Analytics:**

- `GET /api/analytics` - Get click metrics by sponsor
- `GET /api/analytics/summary` - Get MRR, total clicks, etc.

### Client Architecture

The React app:

- Uses Vite for fast development (hot reload)
- Styled with Tailwind CSS
- Calls the Express API via `fetch()`
- TypeScript for type safety

## Production Deployment

### Build for Production

```bash
npm run build
```

This creates:

- `/dist/server/` - Compiled TypeScript server
- `/dist/public/` - Built React app

### Run in Production

```bash
npm start
```

The production server:

- Serves the React app at `http://localhost:3001`
- Provides API endpoints at `http://localhost:3001/api`

### Deploy to Server

1. Copy the entire `admin-panel/` directory to your server
2. Run `npm install --production`
3. Run `npm run build`
4. Run `npm start`

**Or use PM2:**

```bash
npm install -g pm2
pm2 start dist/server/index.js --name "homeschool-admin"
```

## Security Considerations

**CRITICAL: This admin panel has NO authentication by default.**

For production use, you MUST add authentication. Options:

### Option 1: Basic Auth (Quick)

Add middleware to `server/index.ts`:

```typescript
import basicAuth from "express-basic-auth";

app.use(
  basicAuth({
    users: { admin: process.env.ADMIN_PASSWORD || "changeme" },
    challenge: true,
  }),
);
```

### Option 2: JWT Authentication (Better)

1. Add `jsonwebtoken` package
2. Create login endpoint
3. Protect routes with JWT middleware
4. Store token in client localStorage

### Option 3: OAuth (Best for teams)

Integrate with Google OAuth, GitHub, or Auth0 for team access.

### Network Security

**For local use only:**

- Keep it running on `localhost:3001`
- Access only from your machine

**For team access:**

- Run behind a VPN
- Use SSH tunneling: `ssh -L 3001:localhost:3001 user@server`
- Or use Tailscale/ZeroTier for secure network

**For internet access:**

- **DO NOT** expose without authentication
- Use HTTPS with Let's Encrypt
- Add rate limiting
- Consider Cloudflare Tunnel

## Customization

### Add More Admin Features

The starter UI is minimal. You can add:

1. **Form Modals**: Create/edit forms for sponsors and resources
2. **Data Tables**: Sortable, filterable tables with pagination
3. **Charts**: Revenue graphs, click trends over time
4. **CSV Export**: Download analytics reports
5. **Batch Operations**: Bulk activate/deactivate resources

### Use UI Libraries

Consider adding:

- **shadcn/ui**: Modern React components
- **React Table**: Advanced data tables
- **Recharts**: Beautiful charts
- **React Hook Form**: Form management

### Add Authentication

See Security Considerations above.

## Troubleshooting

### "Cannot find module 'better-sqlite3'"

```bash
# Reinstall dependencies (uses Node.js 20 from Flox)
flox activate -- npm install
```

### "EADDRINUSE: address already in use"

Port 3001 is in use. Either:

- Stop the other process
- Change the port: `PORT=3002 npm run dev`

### "Database is locked"

- Close the main Homeschool Electron app
- Or run admin panel in read-only mode (requires code changes)

### "Failed to fetch"

- Ensure the server is running (`npm run dev:server`)
- Check the API URL in `client/src/api.ts`
- Look for CORS errors in browser console

## Next Steps

1. **Run it**: `cd admin-panel && npm install && npm run dev`
2. **Add authentication** before deploying
3. **Customize the UI** with your preferred components
4. **Add forms** for creating/editing sponsors and resources
5. **Expand analytics** with charts and export features

## Removing Old Admin Pages from Electron App

Since you now have a separate admin panel, you can optionally remove the admin pages from the main Electron app:

```bash
# Remove these files from the main app:
rm src/renderer/src/pages/admin/SponsorManagement.tsx
rm src/renderer/src/pages/admin/SponsoredResourceManagement.tsx
rm src/renderer/src/pages/admin/SponsorAnalytics.tsx
```

Then remove the routes from your Electron app's router configuration.

## Support

Questions? Check:

- `README.md` - Full documentation
- `server/routes/` - API implementation
- `client/src/api.ts` - API client examples

---

**You now have a professional, separate admin panel for your sponsorship business!**
