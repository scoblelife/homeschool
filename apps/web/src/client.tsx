/// <reference types="vinxi/types/client" />
import { hydrateRoot } from 'react-dom/client'
import { StartClient } from '@tanstack/start'
import posthog from 'posthog-js'
import { createRouter } from './router'

posthog.init('phc_fyGzmXCbRYcf32kSvxbV1TvOBQDgsJkQ4IVdTU9AkRj', {
  api_host: 'https://us.i.posthog.com',
  capture_pageview: true,
  capture_pageleave: true,
})

const router = createRouter()

hydrateRoot(document.getElementById('root')!, <StartClient router={router} />)
