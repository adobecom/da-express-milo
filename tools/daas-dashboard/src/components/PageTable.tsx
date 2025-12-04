import { useDashboard } from '../hooks/useDashboard'
import PageTableRow from './PageTableRow'
import SortableTableHeader from './SortableTableHeader'
import TableFilters from './TableFilters'
import Pagination from './Pagination'

export default function PageTable() {
  const { state, dispatch, filteredPages, paginatedPages } = useDashboard()

  const allSelected = filteredPages.length > 0 && state.selectedPages.size === filteredPages.length

  const handleToggleSelectAll = () => {
    if (allSelected) {
      dispatch({ type: 'SET_SELECTED_PAGES', payload: new Set<string>() })
    } else {
      dispatch({ type: 'SET_SELECTED_PAGES', payload: new Set(filteredPages.map(p => p.id)) })
    }
  }

  return (
    <div className="glass rounded-xl shadow-xl border-2 border-white/50 overflow-hidden animate-slide-in-up">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              {/* Column Headers with Sorting */}
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3"></th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={handleToggleSelectAll}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                <SortableTableHeader field="url" label="URLs" />
                <SortableTableHeader field="template" label="Template" />
                <SortableTableHeader field="lastUpdate" label="Last Update" />
                <SortableTableHeader field="generated" label="Generated" />
                <SortableTableHeader field="status" label="Status" />
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Edit
                </th>
              </tr>
              
              {/* Filter Row */}
              <TableFilters />
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedPages.map((page, index) => (
                <PageTableRow key={page.id} page={page} index={index} />
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filteredPages.length === 0 && (
          <div className="text-center py-16 animate-fade-in">
            <div className="relative inline-block">
              <svg 
                className="mx-auto h-16 w-16 text-purple-300 animate-pulse" 
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
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full animate-ping"></div>
            </div>
            <h3 className="mt-4 text-lg font-semibold gradient-text">No pages found</h3>
            <p className="mt-2 text-sm text-gray-500">Try adjusting your filters or create a new page.</p>
          </div>
        )}

        {/* Pagination */}
        {filteredPages.length > 0 && <Pagination />}
    </div>
  )
}

