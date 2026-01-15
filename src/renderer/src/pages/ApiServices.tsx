import { useState, useEffect, useCallback } from 'react'
import { Dialog } from '@headlessui/react'

// Types
interface AIConfig {
  apiKey: string | null
  enabled: boolean
  cacheEnabled: boolean
}

interface ServiceStatus {
  name: string
  status: 'connected' | 'disconnected' | 'error' | 'loading'
  message?: string
}

/**
 * Render the API Services settings UI for managing AI (Claude) and Google Calendar integrations.
 *
 * The component displays service status cards, controls to add/update/remove an AI API key,
 * enable/disable and test the AI integration, clear AI cache, and configure/connect/disconnect
 * Google OAuth credentials. It also includes modals for entering the Claude API key and
 * Google OAuth client credentials and shows contextual status messages and action buttons.
 *
 * @returns The settings UI as a JSX element containing status panels, action controls, and modals.
 */
export default function ApiServices(): JSX.Element {
  // AI Service state
  const [aiConfig, setAIConfig] = useState<AIConfig | null>(null)
  const [aiStatus, setAIStatus] = useState<ServiceStatus>({ name: 'AI', status: 'loading' })
  const [showApiKeyModal, setShowApiKeyModal] = useState(false)
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [aiTestResult, setAITestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [isTesting, setIsTesting] = useState(false)

  // Google Calendar state
  const [googleStatus, setGoogleStatus] = useState<ServiceStatus>({ name: 'Google Calendar', status: 'loading' })
  const [googleAuthStatus, setGoogleAuthStatus] = useState<'connected' | 'disconnected' | 'no_credentials'>('disconnected')
  const [showGoogleModal, setShowGoogleModal] = useState(false)
  const [googleClientId, setGoogleClientId] = useState('')
  const [googleClientSecret, setGoogleClientSecret] = useState('')

  // Load all service statuses
  const loadServiceStatuses = useCallback(async () => {
    // Load AI status
    try {
      await window.api.aiInitialize()
      const config = await window.api.aiGetConfig()
      setAIConfig(config)
      const isAvailable = await window.api.aiIsAvailable()
      setAIStatus({
        name: 'AI',
        status: isAvailable ? 'connected' : config.apiKey ? 'error' : 'disconnected',
        message: isAvailable
          ? 'Claude API connected'
          : config.apiKey
            ? 'API key set but service disabled'
            : 'No API key configured'
      })
    } catch (err) {
      setAIStatus({ name: 'AI', status: 'error', message: 'Failed to load AI service' })
    }

    // Load Google Calendar status
    try {
      const hasCredentials = await window.api.hasGoogleCredentials()
      if (hasCredentials) {
        const authStatus = await window.api.getGoogleAuthStatus()
        const status = authStatus.isAuthenticated ? 'connected' : 'disconnected'
        setGoogleAuthStatus(status)
        setGoogleStatus({
          name: 'Google Calendar',
          status: status === 'connected' ? 'connected' : 'disconnected',
          message: status === 'connected'
            ? 'Google Calendar connected'
            : 'Credentials set but not connected'
        })
      } else {
        setGoogleAuthStatus('no_credentials')
        setGoogleStatus({
          name: 'Google Calendar',
          status: 'disconnected',
          message: 'No Google credentials configured'
        })
      }
    } catch (err) {
      setGoogleStatus({ name: 'Google Calendar', status: 'error', message: 'Failed to load Google status' })
    }
  }, [])

  useEffect(() => {
    loadServiceStatuses()
  }, [loadServiceStatuses])

  // AI Service handlers
  const handleSaveApiKey = async () => {
    try {
      await window.api.aiSetApiKey(apiKeyInput || null)
      setShowApiKeyModal(false)
      setApiKeyInput('')
      await loadServiceStatuses()
    } catch (err) {
      console.error('Failed to save API key:', err)
    }
  }

  const handleRemoveApiKey = async () => {
    if (!confirm('Are you sure you want to remove your API key?')) return
    try {
      await window.api.aiSetApiKey(null)
      await loadServiceStatuses()
    } catch (err) {
      console.error('Failed to remove API key:', err)
    }
  }

  const handleToggleAI = async () => {
    if (!aiConfig) return
    try {
      await window.api.aiSetEnabled(!aiConfig.enabled)
      await loadServiceStatuses()
    } catch (err) {
      console.error('Failed to toggle AI:', err)
    }
  }

  const handleClearCache = async () => {
    try {
      await window.api.aiClearCache()
      alert('AI response cache cleared')
    } catch (err) {
      console.error('Failed to clear cache:', err)
    }
  }

  const handleTestAI = async () => {
    setIsTesting(true)
    setAITestResult(null)
    try {
      const result = await window.api.aiComplete('Say "Hello from Claude!" in exactly those words.', {
        maxTokens: 50,
        temperature: 0
      })
      if (result.success && result.response) {
        setAITestResult({ success: true, message: `Response: "${result.response.trim()}"` })
      } else {
        setAITestResult({ success: false, message: result.error || 'No response received' })
      }
    } catch (err) {
      setAITestResult({ success: false, message: err instanceof Error ? err.message : 'Test failed' })
    } finally {
      setIsTesting(false)
    }
  }

  // Google Calendar handlers
  const handleSaveGoogle = async () => {
    if (!googleClientId || !googleClientSecret) return
    try {
      await window.api.saveGoogleCredentials({
        client_id: googleClientId,
        client_secret: googleClientSecret
      })
      setShowGoogleModal(false)
      setGoogleClientId('')
      setGoogleClientSecret('')
      await loadServiceStatuses()
    } catch (err) {
      console.error('Failed to save Google credentials:', err)
    }
  }

  const handleGoogleConnect = async () => {
    try {
      await window.api.connectGoogleCalendar()
      await loadServiceStatuses()
    } catch (err) {
      console.error('Failed to connect Google:', err)
    }
  }

  const handleGoogleDisconnect = async () => {
    try {
      await window.api.disconnectGoogleCalendar()
      await loadServiceStatuses()
    } catch (err) {
      console.error('Failed to disconnect Google:', err)
    }
  }

  const getStatusColor = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800'
      case 'disconnected':
        return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600'
      case 'error':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800'
      case 'loading':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800'
    }
  }

  const getStatusDot = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'connected':
        return 'bg-green-500'
      case 'disconnected':
        return 'bg-gray-400'
      case 'error':
        return 'bg-red-500'
      case 'loading':
        return 'bg-blue-500 animate-pulse'
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">API Services</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Manage integrations with AI and calendar services
        </p>
      </div>

      {/* Service Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {[aiStatus, googleStatus].map((service) => (
          <div
            key={service.name}
            className={`rounded-lg border p-4 ${getStatusColor(service.status)}`}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-2.5 h-2.5 rounded-full ${getStatusDot(service.status)}`} />
              <span className="font-medium">{service.name}</span>
            </div>
            <p className="text-sm opacity-80">{service.message || 'Loading...'}</p>
          </div>
        ))}
      </div>

      {/* AI Service Section */}
      <div className="card mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <span className="text-xl">🤖</span> AI Service (Claude)
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Powers weekly summaries, activity suggestions, and smart categorization
            </p>
          </div>
          {aiConfig?.apiKey && (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              aiConfig.enabled ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            }`}>
              {aiConfig.enabled ? 'Enabled' : 'Disabled'}
            </span>
          )}
        </div>

        <div className="space-y-4">
          {/* API Key Status */}
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div>
              <span className="font-medium text-gray-900 dark:text-white">API Key</span>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {aiConfig?.apiKey
                  ? `••••••••${aiConfig.apiKey.slice(-4)}`
                  : 'Not configured'}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowApiKeyModal(true)}
                className="btn btn-secondary text-sm"
              >
                {aiConfig?.apiKey ? 'Update' : 'Add Key'}
              </button>
              {aiConfig?.apiKey && (
                <button
                  onClick={handleRemoveApiKey}
                  className="btn btn-secondary text-sm text-red-600 hover:text-red-700"
                >
                  Remove
                </button>
              )}
            </div>
          </div>

          {/* Controls */}
          {aiConfig?.apiKey && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                onClick={handleToggleAI}
                className={`p-3 rounded-lg border text-left ${
                  aiConfig.enabled
                    ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/30'
                    : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50'
                }`}
              >
                <div className="font-medium text-gray-900 dark:text-white">
                  {aiConfig.enabled ? 'Disable AI' : 'Enable AI'}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Toggle AI features on/off
                </p>
              </button>

              <button
                onClick={handleTestAI}
                disabled={!aiConfig.enabled || isTesting}
                className="p-3 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/30 text-left disabled:opacity-50"
              >
                <div className="font-medium text-gray-900 dark:text-white">
                  {isTesting ? 'Testing...' : 'Test Connection'}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Send a test request to Claude
                </p>
              </button>

              <button
                onClick={handleClearCache}
                className="p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-left"
              >
                <div className="font-medium text-gray-900 dark:text-white">Clear Cache</div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Remove cached AI responses
                </p>
              </button>
            </div>
          )}

          {/* Test Result */}
          {aiTestResult && (
            <div className={`p-3 rounded-lg ${
              aiTestResult.success ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800'
            }`}>
              <p className={`text-sm ${aiTestResult.success ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                {aiTestResult.success ? '✓ ' : '✗ '}{aiTestResult.message}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Google Calendar Section */}
      <div className="card mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <span className="text-xl">📅</span> Google Calendar
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Sync weekly plan milestones to Google Calendar
            </p>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            googleAuthStatus === 'connected'
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
          }`}>
            {googleAuthStatus === 'connected'
              ? 'Connected'
              : googleAuthStatus === 'disconnected'
                ? 'Not Connected'
                : 'Not Configured'}
          </span>
        </div>

        <div className="space-y-4">
          {googleAuthStatus === 'no_credentials' ? (
            <div className="p-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg">
              <p className="text-sm text-amber-800 dark:text-amber-300 mb-3">
                Google OAuth credentials are not configured. You'll need to create a project
                in Google Cloud Console and enable the Calendar API.
              </p>
              <button
                onClick={() => setShowGoogleModal(true)}
                className="btn btn-primary text-sm"
              >
                Configure Google
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div>
                <span className="font-medium text-gray-900 dark:text-white">Connection Status</span>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {googleAuthStatus === 'connected'
                    ? 'Ready to sync calendars'
                    : 'Credentials set, connect to authorize'}
                </p>
              </div>
              <div className="flex gap-2">
                {googleAuthStatus === 'connected' ? (
                  <button onClick={handleGoogleDisconnect} className="btn btn-secondary text-sm">
                    Disconnect
                  </button>
                ) : (
                  <>
                    <button onClick={handleGoogleConnect} className="btn btn-primary text-sm">
                      Connect
                    </button>
                    <button
                      onClick={() => setShowGoogleModal(true)}
                      className="btn btn-secondary text-sm"
                    >
                      Update
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Usage Tips */}
      <div className="card bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 border-blue-100 dark:border-blue-800">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Getting Started</h3>
        <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
          <li className="flex items-start gap-2">
            <span className="text-blue-500 dark:text-blue-400">1.</span>
            <span><strong>AI Service:</strong> Get a Claude API key from <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">console.anthropic.com</a></span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 dark:text-blue-400">2.</span>
            <span><strong>Google Calendar:</strong> Set up OAuth credentials in <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">Google Cloud Console</a></span>
          </li>
        </ul>
      </div>

      {/* API Key Modal */}
      <Dialog
        open={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
            <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Configure Claude API Key
            </Dialog.Title>
            <div className="space-y-4">
              <div>
                <label className="label">API Key</label>
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  className="input"
                  placeholder="sk-ant-..."
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Your API key is stored locally and never sent to our servers.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowApiKeyModal(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button onClick={handleSaveApiKey} className="btn btn-primary">
                Save
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Google Modal */}
      <Dialog
        open={showGoogleModal}
        onClose={() => setShowGoogleModal(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
            <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Configure Google OAuth
            </Dialog.Title>
            <div className="space-y-4">
              <div>
                <label className="label">Client ID</label>
                <input
                  type="text"
                  value={googleClientId}
                  onChange={(e) => setGoogleClientId(e.target.value)}
                  className="input"
                  placeholder="xxxx.apps.googleusercontent.com"
                />
              </div>
              <div>
                <label className="label">Client Secret</label>
                <input
                  type="password"
                  value={googleClientSecret}
                  onChange={(e) => setGoogleClientSecret(e.target.value)}
                  className="input"
                  placeholder="GOCSPX-..."
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Create OAuth credentials in Google Cloud Console with Calendar API enabled.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowGoogleModal(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button
                onClick={handleSaveGoogle}
                disabled={!googleClientId || !googleClientSecret}
                className="btn btn-primary"
              >
                Save
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  )
}