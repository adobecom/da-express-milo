import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'

interface BulkEditModalProps {
  isOpen: boolean
  onClose: () => void
  fieldKey: string
  fieldType: string
  selectedCount: number
  currentValues: string[] // Array of current values from selected pages
  onSave: (newValue: string) => Promise<void>
}

export default function BulkEditModal({ 
  isOpen, 
  onClose, 
  fieldKey, 
  fieldType,
  selectedCount,
  currentValues,
  onSave 
}: BulkEditModalProps) {
  const [value, setValue] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Check if all selected pages have the same value - memoize to prevent infinite loops
  const uniqueValues = useMemo(() => 
    [...new Set(currentValues.filter(v => v))], 
    [currentValues]
  )
  const hasUniformValue = uniqueValues.length === 1
  const hasMixedValues = uniqueValues.length > 1

  // Pre-populate with existing value when modal opens
  useEffect(() => {
    if (isOpen) {
      if (hasUniformValue && uniqueValues[0]) {
        setValue(uniqueValues[0])
      } else {
        setValue('')
      }
    }
  }, [isOpen]) // Only run when modal opens/closes

  if (!isOpen) return null

  const handleSave = async () => {
    if (!value.trim()) return
    
    setIsSaving(true)
    try {
      await onSave(value)
      setValue('')
      onClose()
    } catch (error) {
      console.error('Save failed:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleClose = () => {
    if (!isSaving) {
      setValue('')
      onClose()
    }
  }

  const fieldLabel = fieldKey.split('.').pop() || fieldKey

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative glass rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden m-4 border-2 border-white/50 animate-slide-in-up">
        {/* Header with Gradient */}
        <div className="px-6 py-5 border-b border-white/30 bg-gradient-to-r from-purple-500/10 to-blue-500/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold gradient-text">
                Bulk Edit Field
              </h2>
              <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                <span className="px-2 py-0.5 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full text-xs font-medium">
                  {selectedCount}
                </span>
                Update <span className="font-mono font-semibold text-purple-600">{fieldLabel}</span> across {selectedCount} page{selectedCount > 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          {/* Show current values info */}
          {hasMixedValues && (
            <div className="mb-4 flex flex-wrap gap-1">
              <span className="text-xs text-gray-500 mr-1">Pick existing:</span>
              {uniqueValues.slice(0, 3).map((v, i) => (
                <button
                  key={i}
                  onClick={() => setValue(v)}
                  className="px-2 py-1 text-xs bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 transition-colors cursor-pointer max-w-[200px] truncate"
                  title={v}
                >
                  {v.length > 30 ? `${v.substring(0, 30)}...` : v}
                </button>
              ))}
              {uniqueValues.length > 3 && (
                <span className="px-2 py-1 text-xs text-gray-400">+{uniqueValues.length - 3} more</span>
              )}
            </div>
          )}

          <label className="block text-sm font-medium text-gray-700 mb-2">
            Value
          </label>
          
          {fieldType === 'image' ? (
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Enter image URL..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
              disabled={isSaving}
            />
          ) : fieldType === 'longtext' ? (
            <textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Enter new content..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm resize-none"
              disabled={isSaving}
            />
          ) : (
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Enter new content..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
              disabled={isSaving}
            />
          )}
          
          <p className="text-xs text-gray-400 mt-2">
            This will replace the existing value on all selected pages.
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={handleClose}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !value.trim()}
            className="btn-gradient px-6 py-2.5 text-sm font-semibold text-white rounded-lg disabled:opacity-50 cursor-pointer flex items-center gap-2 ripple shadow-lg"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Saving Changes...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Update {selectedCount} Page{selectedCount > 1 ? 's' : ''}
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

