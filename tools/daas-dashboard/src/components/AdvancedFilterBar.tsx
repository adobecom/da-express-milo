import { useDashboard } from '../hooks/useDashboard'

export default function AdvancedFilterBar() {
  const { state, dispatch, allTemplates, allStatuses } = useDashboard()

  const hasActiveFilters = state.urlFilter || state.templateFilter || state.statusFilter

  const handleClearFilters = () => {
    dispatch({ type: 'CLEAR_ALL_FILTERS' })
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center gap-4 flex-wrap">
        {/* URL Filter */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Filter by URL
          </label>
          <input
            type="text"
            placeholder="Search page paths..."
            value={state.urlFilter}
            onChange={(e) => dispatch({ type: 'SET_URL_FILTER', payload: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>

        {/* Template Filter */}
        <div className="w-64">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Filter by Template
          </label>
          <select
            value={state.templateFilter || ''}
            onChange={(e) => dispatch({ 
              type: 'SET_TEMPLATE_FILTER', 
              payload: e.target.value || null 
            })}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
          >
            <option value="">All Templates</option>
            {allTemplates.map((template) => (
              <option key={template} value={template}>
                {template}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="w-48">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Filter by Status
          </label>
          <select
            value={state.statusFilter || ''}
            onChange={(e) => dispatch({ 
              type: 'SET_STATUS_FILTER', 
              payload: (e.target.value || null) as any
            })}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
          >
            <option value="">All Statuses</option>
            {allStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <div className="flex items-end">
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

