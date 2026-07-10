import { useState } from 'react';
import GeneratorTab from './components/GeneratorTab';
import DocumentManagerTab from './components/DocumentManagerTab';

type Tab = 'generate' | 'manage';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('generate');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6 flex flex-col gap-4">
        <h1 className="text-2xl font-semibold text-gray-900">DA Document Generator</h1>

        <div className="flex gap-1.5">
          <TabButton active={activeTab === 'generate'} onClick={() => setActiveTab('generate')}>
            Generate
          </TabButton>
          <TabButton active={activeTab === 'manage'} onClick={() => setActiveTab('manage')}>
            Document Manager
          </TabButton>
        </div>

        {activeTab === 'generate' ? <GeneratorTab /> : <DocumentManagerTab />}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-medium cursor-pointer transition-colors ${
        active
          ? 'bg-gray-900 text-white'
          : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
      }`}
    >
      {children}
    </button>
  );
}
