import { useDashboard } from '../hooks/useDashboard'
import type { SortField } from '../types'

interface SortableTableHeaderProps {
  field: SortField
  label: string
  className?: string
}

export default function SortableTableHeader({ 
  field, 
  label, 
  className = '' 
}: SortableTableHeaderProps) {
  const { state, dispatch } = useDashboard()

  const isSorted = state.sortField === field
  const isAsc = state.sortDirection === 'asc'

  const handleClick = () => {
    dispatch({ type: 'TOGGLE_SORT', payload: field })
  }

  return (
    <th 
      className={`px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors ${className}`}
      onClick={handleClick}
    >
      <div className="flex items-center gap-2">
        <span>{label}</span>
        <div className="flex flex-col">
          {/* Up arrow */}
          <svg 
            className={`w-3 h-3 -mb-1 ${isSorted && isAsc ? 'text-blue-600' : 'text-gray-400'}`}
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path d="M10 3l5 7H5l5-7z" />
          </svg>
          {/* Down arrow */}
          <svg 
            className={`w-3 h-3 ${isSorted && !isAsc ? 'text-blue-600' : 'text-gray-400'}`}
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path d="M10 17l-5-7h10l-5 7z" />
          </svg>
        </div>
      </div>
    </th>
  )
}

