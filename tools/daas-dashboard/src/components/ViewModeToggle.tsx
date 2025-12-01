import type { ViewMode } from '../types'

interface ViewModeToggleProps {
  mode: ViewMode
  onChange: (mode: ViewMode) => void
}

export default function ViewModeToggle({ mode, onChange }: ViewModeToggleProps) {
  return (
    <div className="flex bg-gray-100 rounded-lg p-1">
      <button
        onClick={() => onChange('urls')}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
          mode === 'urls'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        URLs
      </button>
      <button
        onClick={() => onChange('templates')}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
          mode === 'templates'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        Templates
      </button>
    </div>
  )
}

