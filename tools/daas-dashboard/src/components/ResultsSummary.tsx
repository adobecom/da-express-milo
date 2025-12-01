interface ResultsSummaryProps {
  filteredCount: number
  totalCount: number
  selectedCount: number
}

export default function ResultsSummary({ 
  filteredCount, 
  totalCount, 
  selectedCount 
}: ResultsSummaryProps) {
  return (
    <div className="text-sm text-gray-600">
      Showing {filteredCount} of {totalCount} pages
      {selectedCount > 0 && (
        <span className="ml-2 text-blue-600 font-medium">
          ({selectedCount} selected)
        </span>
      )}
    </div>
  )
}

