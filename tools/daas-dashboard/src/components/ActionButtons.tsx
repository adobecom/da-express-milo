import { useDashboard } from '../hooks/useDashboard'

export default function ActionButtons() {
  const { state, dispatch } = useDashboard()
  const hasSelection = state.selectedPages.size > 0
  const hasActiveFilters = state.urlFilter || state.templateFilter || state.statusFilter
  const canUseBirdsEye = !!state.templateFilter

  const handleEdit = () => console.log('Edit clicked', Array.from(state.selectedPages))
  const handlePreview = () => console.log('Preview clicked', Array.from(state.selectedPages))
  const handlePublish = () => console.log('Publish clicked', Array.from(state.selectedPages))
  const handleDelete = () => console.log('Delete clicked', Array.from(state.selectedPages))
  const handleOpenBirdsEye = () => {
    dispatch({ type: 'SET_VIEW_MODE', payload: 'birds-eye' })
  }
  const handleClearFilters = () => {
    dispatch({ type: 'CLEAR_ALL_FILTERS' })
  }

  return (
    <div className="flex gap-2 items-center flex-wrap">
      <button
        onClick={handleOpenBirdsEye}
        disabled={!canUseBirdsEye}
        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
        </svg>
        Bird's Eye View
      </button>
      <button
        onClick={handleClearFilters}
        disabled={!hasActiveFilters}
        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
        Clear Filters
      </button>
      <div className="h-8 w-px bg-gray-300"></div>
      <button 
        onClick={handleEdit}
        disabled={!hasSelection}
        className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        Edit
      </button>
      <button 
        onClick={handlePreview}
        disabled={!hasSelection}
        className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        Preview
      </button>
      <button 
        onClick={handlePublish}
        disabled={!hasSelection}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        Publish
      </button>
      <button 
        onClick={handleDelete}
        disabled={!hasSelection}
        className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        Delete
      </button>
    </div>
  )
}

