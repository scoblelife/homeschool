# ⚡ Quick Deploy Instructions

Your admin panel is **almost ready**! The React components are updated to use Convex, but the schema and functions need to be deployed.

## Run This One Command

Open a terminal and run:

```bash
cd /Users/sscoble/Projects/homeschool/admin-panel
npx convex dev
```

**What will happen:**

1. It will detect your existing deployment: `REDACTED_CONVEX_URL`
2. It will ask: **"What would you like to configure?"**
   - Choose: **"Use existing project"** or just press Enter
3. It will deploy your schema and functions (sponsors, resources, analytics)
4. It will start watching for changes
5. Your app at http://localhost:5173 will start working!

## Why This is Needed

- ✅ All React components updated to use Convex hooks
- ✅ Convex deployment exists and is running
- ✅ Client configured with correct URL
- ❌ **Schema and functions not deployed yet** ← You need to do this

The deployment belongs to your account, so only you can push code to it (I can't do it for you).

## Expected Output

You should see:

```
✓ Synced types
✓ Deployed your Convex functions to https://REDACTED_CONVEX_URL
```

Once you see that, your admin panel will work perfectly with:

- Real-time updates
- No Express server needed
- Automatic reactivity

## Current Status

- 🟢 Server running on http://localhost:3001 (old REST API - not being used)
- 🟢 Client running on http://localhost:5173 (trying to use Convex)
- 🟡 Convex deployment exists but schema not deployed

**Just run `npx convex dev` and you're done!** 🎯
