# Convex Setup Guide

This admin panel uses Convex as its backend database. Follow these steps to complete the setup.

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- A Convex account (free tier available at https://convex.dev)

## Setup Steps

### 1. Initialize Convex Deployment

Run the Convex CLI in interactive mode to create and configure your deployment:

```bash
cd /Users/sscoble/Projects/homeschool/admin-panel
npx convex dev
```

This will:

1. Prompt you to log in to Convex (creates account if needed)
2. Ask if you want to create a new project or use existing
3. Generate a deployment URL
4. Push your schema and functions to Convex
5. Start watching for file changes

### 2. Configure Environment Variables

After running `npx convex dev`, you'll receive a deployment URL. Add it to your environment:

**For the client** (create or update `/admin-panel/client/.env.local`):

```
VITE_CONVEX_URL=https://support.homeschool.scoble.life
```

Replace `your-deployment-name` with your actual Convex deployment URL.

### 3. Verify Schema Deployment

Once `npx convex dev` completes, verify your schema is deployed:

```bash
npx convex dashboard
```

This opens the Convex dashboard where you can see:

- Your three tables: `sponsors`, `sponsoredResources`, `sponsoredClicks`
- All functions available: `sponsors:list`, `sponsors:create`, etc.

### 4. Migrate Existing Data (Optional)

If you have existing data in SQLite that you want to migrate to Convex:

1. Export data from SQLite:

```bash
cd /Users/sscoble/Projects/homeschool/admin-panel
sqlite3 ~/.homeschool/homeschool.db ".mode json" ".output sponsors.json" "SELECT * FROM sponsors;"
sqlite3 ~/.homeschool/homeschool.db ".mode json" ".output resources.json" "SELECT * FROM sponsored_resources;"
sqlite3 ~/.homeschool/homeschool.db ".mode json" ".output clicks.json" "SELECT * FROM sponsored_clicks;"
```

2. Create a migration script (optional - can be done manually via dashboard):

```typescript
// convex/migrate.ts
import { mutation } from "./_generated/server";

export const importSponsors = mutation({
  args: {},
  handler: async (ctx) => {
    // Import logic here
  },
});
```

3. Run migration:

```bash
npx convex run migrate:importSponsors
```

### 5. Start Development

Once Convex is configured, you can run the admin panel:

**Terminal 1 - Keep Convex dev running:**

```bash
npx convex dev
```

**Terminal 2 - Run the client:**

```bash
cd client
npm run dev
```

The app will now use Convex for all database operations instead of the Express API.

## Database Schema

Your Convex deployment includes these tables:

### `sponsors`

- Stores sponsor information (name, tier, contact details, billing)
- Indexes: `by_active`, `by_tier`

### `sponsoredResources`

- Stores sponsored content (resources linked to sponsors)
- Indexes: `by_sponsor`, `by_active`, `by_priority`

### `sponsoredClicks`

- Tracks anonymous clicks on sponsored content
- Indexes: `by_resource`, `by_location`, `by_time`

## Available Functions

### Queries (read data):

- `sponsors:list` - Get all sponsors
- `sponsors:get` - Get one sponsor by ID
- `resources:list` - Get all resources
- `resources:get` - Get one resource by ID
- `analytics:getSummary` - Get aggregate stats
- `analytics:getAnalytics` - Get detailed per-sponsor analytics

### Mutations (write data):

- `sponsors:create` - Create sponsor
- `sponsors:update` - Update sponsor
- `sponsors:remove` - Delete sponsor (cascades to resources and clicks)
- `resources:create` - Create resource
- `resources:update` - Update resource
- `resources:remove` - Delete resource (cascades to clicks)
- `clicks:track` - Track a click event

## Testing Convex Functions

You can test functions directly from the CLI:

```bash
# List all sponsors
npx convex run sponsors:list

# Get analytics summary
npx convex run analytics:getSummary

# Create a test sponsor
npx convex run sponsors:create '{
  "name": "Test Sponsor",
  "tier": "basic",
  "monthlyFee": 500,
  "contactEmail": "test@example.com",
  "isActive": true
}'
```

## Troubleshooting

### "VITE_CONVEX_URL not set" warning

- Make sure you created `client/.env.local` with your deployment URL
- Restart the Vite dev server after adding the env var

### Functions not found

- Make sure `npx convex dev` is running
- Check for TypeScript errors in your Convex functions
- Verify schema is valid with `npx convex dashboard`

### Type errors in client code

- Run `npx convex dev` to regenerate types in `convex/_generated/`
- Restart your TypeScript server in VS Code

## Next Steps

Once Convex is set up:

1. ✅ Remove the Express server (`/admin-panel/server/` directory)
2. ✅ Remove SQLite dependencies (`better-sqlite3`)
3. ✅ Update all components to use Convex hooks
4. ✅ Test all CRUD operations
5. ✅ Verify analytics dashboard works with Convex data

## Resources

- [Convex Docs](https://docs.convex.dev)
- [Convex Dashboard](https://dashboard.convex.dev)
- [React Integration Guide](https://docs.convex.dev/client/react)
