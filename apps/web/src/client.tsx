/// <reference types="vinxi/types/client" />
import { hydrateRoot } from 'react-dom/client'
import { StartClient } from '@tanstack/start'
import { createRouter } from './router'

// PostHog is initialized via PostHogProvider in __root.tsx
// using environment variables VITE_PUBLIC_POSTHOG_KEY and VITE_PUBLIC_POSTHOG_HOST

const router = createRouter()

hydrateRoot(document.getElementById('root')!, <StartClient router={router} />)
