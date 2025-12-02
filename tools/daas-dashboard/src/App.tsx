import { DashboardProvider } from './context/DashboardContext'
import {
  ActionButtons,
  PageTable,
  ResultsSummary
} from './components'
import './App.css'

function DashboardContent() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Document Authoring @ Scale
        </h1>

        <div className="mb-4">
          <ActionButtons />
        </div>

        <PageTable />

        <div className="mt-4">
          <ResultsSummary />
        </div>
      </div>
    </div>
  )
}

function App() {
  return (
    <DashboardProvider>
      <DashboardContent />
    </DashboardProvider>
  )
}

export default App
