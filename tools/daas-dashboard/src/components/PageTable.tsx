import { useDashboard } from '../hooks/useDashboard'
import PageTableRow from './PageTableRow'
import SortableTableHeader from './SortableTableHeader'

export default function PageTable() {
  const { state, dispatch, filteredPages } = useDashboard()

  const allSelected = filteredPages.length > 0 && state.selectedPages.size === filteredPages.length

  const handleToggleSelectAll = () => {
    if (allSelected) {
      dispatch({ type: 'SET_SELECTED_PAGES', payload: new Set<string>() })
    } else {
      dispatch({ type: 'SET_SELECTED_PAGES', payload: new Set(filteredPages.map(p => p.id)) })
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="w-12 px-4 py-3 text-left">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={handleToggleSelectAll}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
            </th>
            <SortableTableHeader field="url" label="URLs" />
            <SortableTableHeader field="template" label="Template" />
            <SortableTableHeader field="lastUpdate" label="Last Update" />
            <SortableTableHeader field="generated" label="Generated" />
            <SortableTableHeader field="status" label="Status" />
            <th className="w-12 px-4 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {filteredPages.map((page) => (
            <PageTableRow key={page.id} page={page} />
          ))}
        </tbody>
      </table>

      {/* Empty State */}
      {filteredPages.length === 0 && (
        <div className="text-center py-12">
          <svg 
            className="mx-auto h-12 w-12 text-gray-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No pages found</h3>
          <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter criteria.</p>
        </div>
      )}
    </div>
  )
}

