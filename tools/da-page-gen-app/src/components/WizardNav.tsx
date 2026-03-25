import type { WizardStep } from '../types.js';

const STEPS: { id: WizardStep; label: string }[] = [
  { id: 'source', label: '1. Content' },
  { id: 'template', label: '2. Template' },
  { id: 'bindings', label: '3. Bindings' },
  { id: 'generate', label: '4. Generate' },
];

interface Props {
  current: WizardStep;
  completed: Set<WizardStep>;
}

export function WizardNav({ current, completed }: Props) {
  return (
    <nav className="flex gap-1 mb-8 flex-wrap">
      {STEPS.map(({ id, label }, i) => {
        const isCurrent = id === current;
        const isDone = completed.has(id);
        return (
          <div key={id} className="flex items-center gap-1">
            {i > 0 && <span className="text-gray-300 mx-1">›</span>}
            <span
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isCurrent
                  ? 'bg-purple-600 text-white'
                  : isDone
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-gray-100 text-gray-400'
              }`}
            >
              {isDone && !isCurrent ? '✓ ' : ''}{label}
            </span>
          </div>
        );
      })}
    </nav>
  );
}
