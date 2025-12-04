import { useState } from 'react'
import { createPortal } from 'react-dom'

interface BulkEditModalProps {
  isOpen: boolean
  onClose: () => void
  fieldKey: string
  fieldType: string
  selectedCount: number
  onSave: (newValue: string) => Promise<void>
}

export default function BulkEditModal({ 
  isOpen, 
  onClose, 
  fieldKey, 
  fieldType,
  selectedCount,
  onSave 
}: BulkEditModalProps) {
  const [value, setValue] = useState('')
  const [isSaving, setIsSaving] = useState(false)

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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden m-4">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            Bulk Edit Field
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Update <span className="font-mono text-blue-600">{fieldLabel}</span> for {selectedCount} selected page{selectedCount > 1 ? 's' : ''}
          </p>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            New Value
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
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Saving...
              </>
            ) : (
              `Update ${selectedCount} Page${selectedCount > 1 ? 's' : ''}`
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

