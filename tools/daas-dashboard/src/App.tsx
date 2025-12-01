import { useState, useMemo } from 'react'
import type { ViewMode } from './types'
import { mockPages, templates } from './data/mockData'
import {
  FilterBar,
  TemplateFilter,
  ActionButtons,
  PageTable,
  ResultsSummary
} from './components'
import './App.css'

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('urls')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [selectedPages, setSelectedPages] = useState<Set<string>>(new Set())

  // Filter templates based on search when in templates mode
  const filteredTemplates = useMemo(() => {
    if (viewMode === 'templates' && searchQuery) {
      return templates.filter(template =>
        template.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    return templates
  }, [viewMode, searchQuery])

  // Filter pages based on search mode and selected template
  const filteredPages = useMemo(() => {
    return mockPages.filter(page => {
      // Search based on current view mode
      const matchesSearch = viewMode === 'urls'
        ? page.url.toLowerCase().includes(searchQuery.toLowerCase())
        : page.template.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesTemplate = !selectedTemplate || page.template === selectedTemplate
      return matchesSearch && matchesTemplate
    })
  }, [searchQuery, selectedTemplate, viewMode])

  const togglePageSelection = (id: string) => {
    const newSelected = new Set(selectedPages)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedPages(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedPages.size === filteredPages.length) {
      setSelectedPages(new Set())
    } else {
      setSelectedPages(new Set(filteredPages.map(p => p.id)))
    }
  }

  // Action handlers
  const handleBirdsEyeView = () => console.log('Bird\'s Eye View clicked')
  const handleEdit = () => console.log('Edit clicked', Array.from(selectedPages))
  const handlePreview = () => console.log('Preview clicked', Array.from(selectedPages))
  const handlePublish = () => console.log('Publish clicked', Array.from(selectedPages))
  const handleDelete = () => console.log('Delete clicked', Array.from(selectedPages))
  const handleEditPage = (id: string) => console.log('Edit page', id)
  
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode)
    setSearchQuery('') // Clear search when switching modes
  }

  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
    // Clear selected template if it's no longer in filtered templates
    if (viewMode === 'templates' && selectedTemplate) {
      const wouldBeFiltered = !templates
        .filter(t => t.toLowerCase().includes(query.toLowerCase()))
        .includes(selectedTemplate)
      if (wouldBeFiltered) {
        setSelectedTemplate(null)
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Document Authoring @ Scale</h1>

        {/* Filter Bar */}
        <div className="mb-6">
          <FilterBar
            viewMode={viewMode}
            searchQuery={searchQuery}
            onViewModeChange={handleViewModeChange}
            onSearchChange={handleSearchChange}
          />
        </div>

        {/* Template Filter */}
        <div className="mb-6">
          <TemplateFilter
            templates={filteredTemplates}
            selectedTemplate={selectedTemplate}
            onSelectTemplate={setSelectedTemplate}
          />
        </div>

        {/* Action Buttons */}
        <div className="mb-4">
          <ActionButtons
            selectedCount={selectedPages.size}
            onBirdsEyeView={handleBirdsEyeView}
            onEdit={handleEdit}
            onPreview={handlePreview}
            onPublish={handlePublish}
            onDelete={handleDelete}
          />
        </div>

        {/* Data Table */}
        <PageTable
          pages={filteredPages}
          selectedPages={selectedPages}
          onToggleSelect={togglePageSelection}
          onToggleSelectAll={toggleSelectAll}
          onEditPage={handleEditPage}
        />

        {/* Results Summary */}
        <div className="mt-4">
          <ResultsSummary
            filteredCount={filteredPages.length}
            totalCount={mockPages.length}
            selectedCount={selectedPages.size}
          />
        </div>
      </div>
    </div>
  )
}

export default App
