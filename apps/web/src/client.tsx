/// <reference types="vinxi/types/client" />
import { hydrateRoot } from 'react-dom/client'
import { StartClient } from '@tanstack/start'
import posthog from 'posthog-js'
import { createRouter } from './router'

posthog.init('phc_fyGzmXCbRYcf32kSvxbV1TvOBQDgsJkQ4IVdTU9AkRj', {
  api_host: '/ingest',
  ui_host: 'https://us.i.posthog.com',
  defaults: '2026-01-30',
  capture_exceptions: true,
})

const router = createRouter()

hydrateRoot(document.getElementById('root')!, <StartClient router={router} />)
