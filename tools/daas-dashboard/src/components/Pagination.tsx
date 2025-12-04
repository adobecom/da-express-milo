import { useDashboard } from '../hooks/useDashboard'

export default function Pagination() {
  const { state, dispatch, filteredPages, totalPages, startIndex, endIndex } = useDashboard()
  
  const currentPage = state.currentPage
  const pageSize = state.pageSize
  const totalItems = filteredPages.length

  const handlePageChange = (page: number) => {
    dispatch({ type: 'SET_PAGE', payload: page })
  }

  const handlePageSizeChange = (size: number) => {
    dispatch({ type: 'SET_PAGE_SIZE', payload: size })
  }

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxButtons = 7
    
    if (totalPages <= maxButtons) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Show first, last, and pages around current
      pages.push(1)
      
      if (currentPage > 3) {
        pages.push('...')
      }
      
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i)
      }
      
      if (currentPage < totalPages - 2) {
        pages.push('...')
      }
      
      pages.push(totalPages)
    }
    
    return pages
  }

  if (totalItems === 0) return null

  return (
    <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200">
      {/* Left: Page size selector */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600 font-medium">Show</span>
        <select
          value={pageSize}
          onChange={(e) => handlePageSizeChange(Number(e.target.value))}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white hover:border-purple-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all cursor-pointer"
        >
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={totalItems}>All</option>
        </select>
        <span className="text-sm text-gray-600">
          Showing <span className="font-semibold text-gray-900">{startIndex + 1}</span> to{' '}
          <span className="font-semibold text-gray-900">{endIndex}</span> of{' '}
          <span className="font-semibold text-gray-900">{totalItems}</span> pages
        </span>
      </div>

      {/* Right: Page navigation */}
      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          {/* Previous button */}
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 hover:border-purple-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300 transition-all"
          >
            Previous
          </button>

          {/* Page numbers */}
          <div className="flex items-center gap-1">
            {getPageNumbers().map((page, index) => {
              if (page === '...') {
                return (
                  <span key={`ellipsis-${index}`} className="px-3 py-2 text-gray-500">
                    ...
                  </span>
                )
              }

              const pageNum = page as number
              const isActive = pageNum === currentPage

              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`
                    min-w-[40px] px-3 py-2 text-sm font-medium rounded-lg transition-all
                    ${isActive
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg scale-105'
                      : 'text-gray-700 bg-white border border-gray-300 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 hover:border-purple-400'
                    }
                  `}
                >
                  {pageNum}
                </button>
              )
            })}
          </div>

          {/* Next button */}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 hover:border-purple-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300 transition-all"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}

