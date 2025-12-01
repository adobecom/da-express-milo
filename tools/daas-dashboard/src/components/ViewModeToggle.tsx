import { useDashboard } from '../hooks/useDashboard'
import type { ViewMode } from '../types'

export default function ViewModeToggle() {
  const { state, dispatch } = useDashboard()

  const handleModeChange = (mode: ViewMode) => {
    dispatch({ type: 'SET_VIEW_MODE', payload: mode })
  }

  return (
    <div className="flex bg-gray-100 rounded-lg p-1">
      <button
        onClick={() => handleModeChange('urls')}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
          state.viewMode === 'urls'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        URLs
      </button>
      <button
        onClick={() => handleModeChange('templates')}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
          state.viewMode === 'templates'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        Templates
      </button>
    </div>
  )
}

