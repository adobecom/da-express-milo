import { useState, useEffect } from 'react'
import { useDashboard } from '../hooks/useDashboard'
import { getTemplateFields } from '../data/templateFields'
import { generateHtmlFromTemplate, postDoc, loadPagesData, savePagesData } from '../utils'
import type { PageData } from '../types'
import templateHtml from '../template.html?raw'

interface EditModalProps {
  page: PageData
  onClose: () => void
}

export default function EditModal({ page, onClose }: EditModalProps) {
  const { refreshPagesData } = useDashboard()
  const fields = getTemplateFields(page.template)
  
  const [formValues, setFormValues] = useState<Record<string, string>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')

  // Initialize form values from JSON data
  useEffect(() => {
    const loadFieldValues = async () => {
      try {
        const pagesData = await loadPagesData()
        const existingValues = pagesData.fieldValues[page.id] || {}
        console.log('📋 Loading field values for page:', page.id, existingValues)
        setFormValues(existingValues)
      } catch (error) {
        console.error('Error loading field values:', error)
        setFormValues({})
      }
    }
    loadFieldValues()
  }, [page.id])

  const handleInputChange = (fieldKey: string, value: string) => {
    setFormValues(prev => ({
      ...prev,
      [fieldKey]: value
    }))
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      setSaveStatus('idle')

      // 1. Generate HTML from template with field values
      const generatedHtml = generateHtmlFromTemplate(templateHtml, formValues)
      
      // 2. Post HTML to CMS using the page's URL path
      const htmlResponse = await postDoc(page.url, generatedHtml)
      
      if (!htmlResponse.ok) {
        setSaveStatus('error')
        return
      }

      // 3. Load existing pages data
      console.log('📥 Loading existing pages data...')
      const pagesData = await loadPagesData()
      console.log('📄 Loaded pages data:', pagesData)
      
      // 4. Update the field values for this page
      console.log('✏️ Updating field values for page:', page.id, formValues)
      pagesData.fieldValues[page.id] = formValues
      
      // 5. Update the page's lastUpdate timestamp
      const pageIndex = pagesData.pages.findIndex(p => p.id === page.id)
      if (pageIndex !== -1) {
        pagesData.pages[pageIndex].lastUpdate = new Date().toISOString().split('T')[0].replace(/-/g, '/')
        console.log('📅 Updated lastUpdate for page:', page.id)
      }
      
      // 6. Save the updated pages data back to JSON
      console.log('💾 Saving updated pages data...')
      const jsonResponse = await savePagesData(pagesData)
      
      if (jsonResponse.ok) {
        setSaveStatus('success')
        
        // 7. Refresh the dashboard data
        await refreshPagesData()
        
        setTimeout(() => {
          onClose()
        }, 1500)
      } else {
        setSaveStatus('error')
      }
    } catch (error) {
      console.error('Error saving page:', error)
      setSaveStatus('error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Edit Page</h2>
            <p className="text-sm text-gray-500 mt-1">{page.url}</p>
            <p className="text-xs text-gray-400 mt-0.5">Template: {page.template}</p>
          </div>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form Content */}
        <div className="px-6 py-4 overflow-y-auto flex-1">
          <div className="space-y-4">
            {fields.map((field) => (
              <div key={field.key}>
                <label 
                  htmlFor={field.key}
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  {field.label}
                  <span className="text-xs text-gray-400 font-mono ml-2">[[{field.key}]]</span>
                </label>
                
                {field.type === 'longtext' ? (
                  <textarea
                    id={field.key}
                    value={formValues[field.key] || ''}
                    onChange={(e) => handleInputChange(field.key, e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-y"
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                  />
                ) : field.type === 'image' ? (
                  <div>
                    <input
                      id={field.key}
                      type="text"
                      value={formValues[field.key] || ''}
                      onChange={(e) => handleInputChange(field.key, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="Image URL or path"
                    />
                    <p className="text-xs text-gray-500 mt-1">Enter image URL or path</p>
                  </div>
                ) : (
                  <input
                    id={field.key}
                    type="text"
                    value={formValues[field.key] || ''}
                    onChange={(e) => handleInputChange(field.key, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Status Messages */}
          {saveStatus === 'success' && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm font-medium">Page saved successfully!</span>
            </div>
          )}
          
          {saveStatus === 'error' && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span className="text-sm font-medium">Error saving page. Please try again.</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
          <button
            onClick={handleCancel}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Saving...</span>
              </>
            ) : (
              <span>Save to CMS</span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

