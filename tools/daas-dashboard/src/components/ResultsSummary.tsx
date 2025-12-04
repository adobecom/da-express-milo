import { useDashboard } from '../hooks/useDashboard'

export default function ResultsSummary() {
  const { state, filteredPages, allPages } = useDashboard()

  return (
    <div className="text-sm text-gray-600">
      Showing {filteredPages.length} of {allPages.length} pages
      {state.selectedPages.size > 0 && (
        <span className="ml-2 text-blue-600 font-medium">
          ({state.selectedPages.size} selected)
        </span>
      )}
    </div>
  )
}

