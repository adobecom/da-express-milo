interface ActionButtonsProps {
  selectedCount: number
  onBirdsEyeView: () => void
  onEdit: () => void
  onPreview: () => void
  onPublish: () => void
  onDelete: () => void
}

export default function ActionButtons({
  selectedCount,
  onBirdsEyeView,
  onEdit,
  onPreview,
  onPublish,
  onDelete
}: ActionButtonsProps) {
  const hasSelection = selectedCount > 0

  return (
    <div className="flex gap-2">
      <button 
        onClick={onBirdsEyeView}
        className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        Bird's Eye View
      </button>
      <button 
        onClick={onEdit}
        disabled={!hasSelection}
        className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Edit
      </button>
      <button 
        onClick={onPreview}
        disabled={!hasSelection}
        className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Preview
      </button>
      <button 
        onClick={onPublish}
        disabled={!hasSelection}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Publish
      </button>
      <button 
        onClick={onDelete}
        disabled={!hasSelection}
        className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Delete
      </button>
    </div>
  )
}

