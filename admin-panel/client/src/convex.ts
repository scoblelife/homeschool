import { ConvexReactClient } from "convex/react";

// Get Convex URL from environment variable
const CONVEX_URL = import.meta.env.VITE_CONVEX_URL;

if (!CONVEX_URL) {
  console.warn('VITE_CONVEX_URL not set. Run `npx convex dev` to get your deployment URL.');
}

export const convex = new ConvexReactClient(CONVEX_URL || '');
