# Homeschool Admin Panel

Separate web-based admin application for managing sponsors, sponsored resources, and analytics.

## Overview

This admin panel is a standalone application that connects directly to your Homeschool app's DuckDB database. It provides a web interface for:

- **Sponsor Management**: Create, edit, and manage sponsorship partners
- **Resource Management**: Configure sponsored resources linked to sponsors
- **Analytics Dashboard**: View click metrics, revenue data, and export reports

## Architecture

- **Backend**: Express.js server (Node.js + TypeScript)
- **Database**: Direct connection to `~/.homeschool/homeschool.db`
- **Frontend**: React with Vite
- **API**: RESTful JSON API on port 3001

## Prerequisites

- Node.js 18+ installed
- The main Homeschool app must be installed (database at `~/.homeschool/homeschool.db`)

## Installation

```bash
cd admin-panel
npm install
```

## Development

Run both the server and client in development mode:

```bash
npm run dev
```

This starts:

- **API Server** on http://localhost:3001
- **Web Interface** on http://localhost:5173 (Vite default)

### Run individually:

```bash
# Server only
npm run dev:server

# Client only (requires server running)
npm run dev:client
```

## Production Build

```bash
# Build both server and client
npm run build

# Start production server
npm start
```

The production server serves both the API and the built React app.

## API Endpoints

### Sponsors

- `GET /api/sponsors` - Get all sponsors
- `GET /api/sponsors?activeOnly=true` - Get active sponsors only
- `GET /api/sponsors/:id` - Get single sponsor
- `POST /api/sponsors` - Create sponsor
- `PUT /api/sponsors/:id` - Update sponsor
- `DELETE /api/sponsors/:id` - Delete sponsor

### Resources

- `GET /api/resources` - Get all resources
- `GET /api/resources?activeOnly=true` - Get active resources only
- `GET /api/resources/:id` - Get single resource
- `POST /api/resources` - Create resource
- `PUT /api/resources/:id` - Update resource
- `DELETE /api/resources/:id` - Delete resource

### Analytics

- `GET /api/analytics` - Get sponsor analytics
- `GET /api/analytics?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` - Filter by date range
- `GET /api/analytics/summary` - Get summary stats (MRR, clicks, etc.)

## Environment Variables

Create `.env` file in admin-panel directory:

```env
PORT=3001
VITE_API_URL=http://localhost:3001/api
```

## Security Notes

**IMPORTANT: This admin panel has NO authentication.**

For production use:

1. Add authentication middleware (JWT, session-based, etc.)
2. Run behind a VPN or firewall
3. Use HTTPS with proper certificates
4. Restrict database file permissions

Example authentication middleware (to be added):

```typescript
// server/middleware/auth.ts
export function requireAuth(req, res, next) {
  const apiKey = req.headers["x-api-key"];
  if (apiKey !== process.env.ADMIN_API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}
```

## Database Access

The server connects directly to:

```
~/.homeschool/homeschool.db
```

**Concurrent Access:**

- DuckDB supports multiple read connections
- Only one write connection at a time
- If the main Electron app is running, writes may block briefly

## Troubleshooting

### "Database is locked"

- Close the main Homeschool app before making changes
- Or ensure both use read-only mode (admin panel could be read-only for safety)

### Port 3001 already in use

```bash
# Change port in .env or:
PORT=3002 npm run dev
```

### Cannot connect to database

- Ensure the main Homeschool app has been run at least once
- Check that `~/.homeschool/homeschool.db` exists
- Check file permissions

## Deployment

### Local Network (for team access)

1. Build the production version:

```bash
npm run build
npm start
```

2. Find your local IP:

```bash
# macOS/Linux
ifconfig | grep "inet "

# Windows
ipconfig
```

3. Access from other devices:

```
http://YOUR_IP_ADDRESS:3001
```

### Cloud Deployment (not recommended without auth)

If you must deploy to cloud:

1. Add authentication (see Security Notes)
2. Use environment variables for database path
3. Consider SSH tunnel or VPN for database access
4. Never expose without authentication

## Development Notes

- The client uses Vite for fast hot-reload development
- API routes are in `server/routes/`
- React components can be added to `client/src/`
- Database queries use promisified DuckDB API
- All TypeScript is compiled to JavaScript for production

## Next Steps

1. **Add Authentication**: Implement JWT or session-based auth
2. **Add UI Components**: Port remaining admin pages from main app
3. **Add Tests**: Unit tests for API routes, integration tests
4. **Add Logging**: Winston or Pino for structured logging
5. **Add Validation**: Zod or Joi for request validation

## License

Proprietary - Same license as main Homeschool application
