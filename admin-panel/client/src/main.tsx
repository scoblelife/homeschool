import React from 'react'
import ReactDOM from 'react-dom/client'
import { ConvexProvider } from 'convex/react'
import App from './App'
import './index.css'
import { convex } from './convex'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConvexProvider client={convex}>
      <App />
    </ConvexProvider>
  </React.StrictMode>
)
