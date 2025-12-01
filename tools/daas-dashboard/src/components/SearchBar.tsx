import { useDashboard } from '../hooks/useDashboard'
import { useEffect } from 'react'

interface SearchBarProps {
  placeholder?: string
}

export default function SearchBar({ placeholder = 'Search...' }: SearchBarProps) {
  const { state, dispatch, allTemplates } = useDashboard()

  // Clear selected template if it gets filtered out
  useEffect(() => {
    if (state.viewMode === 'templates' && state.selectedTemplate && state.searchQuery) {
      const isTemplateVisible = allTemplates
        .filter(t => t.toLowerCase().includes(state.searchQuery.toLowerCase()))
        .includes(state.selectedTemplate)
      
      if (!isTemplateVisible) {
        dispatch({ type: 'SET_SELECTED_TEMPLATE', payload: null })
      }
    }
  }, [state.viewMode, state.selectedTemplate, state.searchQuery, allTemplates, dispatch])

  return (
    <div className="flex-1 relative">
      <input
        type="text"
        placeholder={placeholder}
        value={state.searchQuery}
        onChange={(e) => dispatch({ type: 'SET_SEARCH_QUERY', payload: e.target.value })}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
      />
      <svg
        className="absolute right-3 top-2.5 h-5 w-5 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
    </div>
  )
}

