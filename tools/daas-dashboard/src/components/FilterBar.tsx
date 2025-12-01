import type { ViewMode } from '../types'
import ViewModeToggle from './ViewModeToggle'
import SearchBar from './SearchBar'

interface FilterBarProps {
  viewMode: ViewMode
  searchQuery: string
  onViewModeChange: (mode: ViewMode) => void
  onSearchChange: (query: string) => void
}

export default function FilterBar({ 
  viewMode, 
  searchQuery, 
  onViewModeChange, 
  onSearchChange 
}: FilterBarProps) {
  const placeholder = viewMode === 'urls' 
    ? 'Search by page path...' 
    : 'Search by template name...'

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center gap-4">
        <ViewModeToggle mode={viewMode} onChange={onViewModeChange} />
        <SearchBar 
          value={searchQuery} 
          onChange={onSearchChange}
          placeholder={placeholder}
        />
      </div>
    </div>
  )
}

