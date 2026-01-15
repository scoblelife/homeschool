import { useEffect, useState } from 'react'

/**
 * Render a platform-aware draggable title bar with window control buttons.
 *
 * On mount the component queries the host platform and current maximized state,
 * polls the maximized state periodically, and exposes handlers that call `window.api`
 * to minimize, maximize/restore, and close the window. The layout adapts for macOS
 * (left-side traffic-light area) versus Windows/Linux (right-side control buttons).
 *
 * @returns The JSX element for the title bar.
 */
export function TitleBar(): JSX.Element {
  const [platform, setPlatform] = useState<string>('darwin')
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    // Get platform on mount
    window.api.windowGetPlatform().then(setPlatform)
    window.api.windowIsMaximized().then(setIsMaximized)

    // Listen for maximize/restore changes (check periodically)
    const interval = setInterval(async () => {
      const maximized = await window.api.windowIsMaximized()
      setIsMaximized(maximized)
    }, 500)

    return () => clearInterval(interval)
  }, [])

  const handleMinimize = () => window.api.windowMinimize()
  const handleMaximize = () => window.api.windowMaximize()
  const handleClose = () => window.api.windowClose()
  const handleDoubleClick = () => window.api.windowMaximize()

  const isMac = platform === 'darwin'

  return (
    <div
      className="h-10 flex items-center justify-between bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 select-none"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      onDoubleClick={handleDoubleClick}
    >
      {/* Left side - macOS traffic lights area */}
      <div className={`flex items-center ${isMac ? 'pl-20' : 'pl-4'}`}>
        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
          Homeschool
        </span>
      </div>

      {/* Right side - Windows/Linux controls */}
      {!isMac && (
        <div
          className="flex items-center"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <button
            onClick={handleMinimize}
            className="w-12 h-10 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Minimize"
          >
            <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" viewBox="0 0 12 12">
              <rect x="2" y="5.5" width="8" height="1" fill="currentColor" />
            </svg>
          </button>
          <button
            onClick={handleMaximize}
            className="w-12 h-10 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title={isMaximized ? 'Restore' : 'Maximize'}
          >
            {isMaximized ? (
              <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" viewBox="0 0 12 12">
                <rect x="2.5" y="4" width="6" height="5.5" fill="none" stroke="currentColor" strokeWidth="1" />
                <path d="M4 4V2.5h6V8h-1.5" fill="none" stroke="currentColor" strokeWidth="1" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" viewBox="0 0 12 12">
                <rect x="2" y="2" width="8" height="8" fill="none" stroke="currentColor" strokeWidth="1" />
              </svg>
            )}
          </button>
          <button
            onClick={handleClose}
            className="w-12 h-10 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors group"
            title="Close"
          >
            <svg className="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover:text-white" viewBox="0 0 12 12">
              <path d="M2.5 2.5l7 7M9.5 2.5l-7 7" stroke="currentColor" strokeWidth="1.2" />
            </svg>
          </button>
        </div>
      )}

      {/* Empty right side for macOS (symmetry) */}
      {isMac && <div className="pr-4" />}
    </div>
  )
}