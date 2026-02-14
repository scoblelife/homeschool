# PostHog post-wizard report

The wizard has completed a deep integration of your TanStack Start project. PostHog analytics have been set up with both client-side and server-side event tracking, using `PostHogProvider` from `@posthog/react` for the frontend and `posthog-node` for server-side events. The integration includes:

- **PostHog Provider**: Added to `__root.tsx` to wrap the entire application
- **Environment Variables**: PostHog API key and host are configured via `VITE_PUBLIC_POSTHOG_KEY` and `VITE_PUBLIC_POSTHOG_HOST` in `.env`
- **Client-side Events**: Custom events tracked on user interactions (votes, clicks, searches, filters)
- **Server-side Events**: Content moderation events tracked via `posthog-node`
- **Exception Capture**: Enabled via `capture_exceptions: true` in PostHogProvider options

## Events Implemented

| Event Name                | Description                                            | File                                |
| ------------------------- | ------------------------------------------------------ | ----------------------------------- |
| `lesson_plan_voted`       | User votes (+1) on a lesson plan                       | `src/components/VoteButton.tsx`     |
| `lesson_plan_draft_saved` | User saves a lesson plan as draft                      | `src/routes/plans/new.tsx`          |
| `lesson_plan_published`   | User publishes a lesson plan                           | `src/routes/plans/new.tsx`          |
| `lesson_plan_forked`      | User forks an existing lesson plan                     | `src/routes/plans/$planId.tsx`      |
| `lesson_plan_search`      | User searches for lesson plans (3+ chars)              | `src/components/PlanFilters.tsx`    |
| `lesson_plan_filtered`    | User applies grade level or activity type filter       | `src/components/PlanFilters.tsx`    |
| `lesson_plan_clicked`     | User clicks on a lesson plan card to view details      | `src/components/LessonPlanCard.tsx` |
| `content_flagged`         | Content is flagged for moderation review (server-side) | `src/lib/moderation.ts`             |

## Files Modified

- `src/routes/__root.tsx` - Added `PostHogProvider` wrapper with environment variables
- `src/client.tsx` - Removed hardcoded PostHog initialization (now handled by provider)
- `src/components/VoteButton.tsx` - Added vote tracking with `usePostHog` hook
- `src/components/LessonPlanCard.tsx` - Added click tracking with `usePostHog` hook
- `src/components/PlanFilters.tsx` - Added search and filter tracking
- `src/routes/plans/new.tsx` - Added draft/publish tracking
- `src/routes/plans/$planId.tsx` - Added fork tracking
- `src/lib/moderation.ts` - Added server-side content flagged event
- `src/lib/posthog-server.ts` - Created server-side PostHog client singleton

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

### Dashboard

- **Analytics basics**: https://us.posthog.com/project/313620/dashboard/1278907

### Insights

- **Lesson Plan Engagement**: https://us.posthog.com/project/313620/insights/oNXBekok
- **Lesson Plan Creation Funnel**: https://us.posthog.com/project/313620/insights/XtfZS6pw
- **Search Behavior**: https://us.posthog.com/project/313620/insights/KVwapZNV
- **Content Moderation Activity**: https://us.posthog.com/project/313620/insights/RwkGBfKv
- **Daily Active Users**: https://us.posthog.com/project/313620/insights/Jjj8qZvH

### User Identification

When you implement authentication, add user identification by calling:

```typescript
import { usePostHog } from "@posthog/react";

const posthog = usePostHog();

// On login/signup
posthog.identify(userId, {
  email: user.email,
  name: user.displayName,
});

// On logout
posthog.reset();
```

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/posthog-integration-react-tanstack-router-file-based/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.
