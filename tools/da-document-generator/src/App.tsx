import { useState } from 'react';
import GeneratorTab from './components/GeneratorTab';
import DocumentManagerTab from './components/DocumentManagerTab';

type Tab = 'generate' | 'manage';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('generate');
  // Mount each tab lazily on first visit, then keep it mounted so its React
  // state survives tab switches (only the active tab is shown).
  const [mountedTabs, setMountedTabs] = useState<Set<Tab>>(() => new Set<Tab>(['generate']));

  function selectTab(tab: Tab) {
    setActiveTab(tab);
    setMountedTabs((prev) => (prev.has(tab) ? prev : new Set(prev).add(tab)));
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6 flex flex-col gap-4">
        <h1 className="text-2xl font-semibold text-gray-900">DA Document Generator</h1>

        <div className="flex gap-1.5">
          <TabButton active={activeTab === 'generate'} onClick={() => selectTab('generate')}>
            Generate
          </TabButton>
          <TabButton active={activeTab === 'manage'} onClick={() => selectTab('manage')}>
            Document Manager
          </TabButton>
        </div>

        {mountedTabs.has('generate') && (
          <div className={activeTab === 'generate' ? 'flex flex-col gap-4' : 'hidden'}>
            <GeneratorTab />
          </div>
        )}
        {mountedTabs.has('manage') && (
          <div className={activeTab === 'manage' ? undefined : 'hidden'}>
            <DocumentManagerTab />
          </div>
        )}
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
