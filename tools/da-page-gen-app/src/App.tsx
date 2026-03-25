import { useState } from 'react';
import type { WizardStep, Binding, ResolvedItem, TemplateResolveResponse } from './types.js';
import { resolveBindings } from './api/serverApi.js';
import { WizardNav } from './components/WizardNav.js';
import { ContentSourceStep } from './components/ContentSourceStep.js';
import { TemplateStep } from './components/TemplateStep.js';
import { BindingsStep } from './components/BindingsStep.js';
import { GenerateStep } from './components/GenerateStep.js';

export function App() {
  const [step, setStep] = useState<WizardStep>('source');
  const [completed, setCompleted] = useState<Set<WizardStep>>(new Set());
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState('');

  const [records, setRecords] = useState<unknown[]>([]);
  const [templateResult, setTemplateResult] = useState<TemplateResolveResponse | null>(null);
  const [bindings, setBindings] = useState<Binding[]>([]);
  const [destPathPattern, setDestPathPattern] = useState('');
  const [resolvedItems, setResolvedItems] = useState<ResolvedItem[]>([]);

  function complete(s: WizardStep) {
    setCompleted((prev) => new Set([...prev, s]));
  }

  function handleSourceConfirm(r: unknown[]) {
    setRecords(r);
    complete('source');
    setStep('template');
  }

  function handleTemplateConfirm(result: TemplateResolveResponse) {
    setTemplateResult(result);
    complete('template');
    setStep('bindings');
  }

  async function handleBindingsConfirm(b: Binding[], pattern: string) {
    setBindings(b);
    setDestPathPattern(pattern);
    setResolving(true);
    setResolveError('');
    try {
      const items = await resolveBindings(records, b, pattern);
      setResolvedItems(items);
      complete('bindings');
      setStep('generate');
    } catch (e) {
      setResolveError(e instanceof Error ? e.message : 'Failed to resolve bindings');
    } finally {
      setResolving(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            DA Page Gen
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Provide JSON data, a template, and field bindings — then bulk-generate DA pages.
          </p>
        </header>

        <WizardNav current={step} completed={completed} />

        <div className="bg-white/80 backdrop-blur rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
          {step === 'source' && (
            <ContentSourceStep onConfirm={handleSourceConfirm} />
          )}

          {step === 'template' && (
            <TemplateStep
              onConfirm={handleTemplateConfirm}
              onBack={() => setStep('source')}
            />
          )}

          {step === 'bindings' && templateResult && (
            <BindingsStep
              placeholders={templateResult.placeholders}
              records={records}
              initialBindings={bindings.length > 0 ? bindings : undefined}
              onConfirm={handleBindingsConfirm}
              onBack={() => setStep('template')}
              loading={resolving}
              error={resolveError}
            />
          )}

          {step === 'generate' && templateResult && (
            <GenerateStep
              items={resolvedItems}
              records={records}
              bindings={bindings}
              destPathPattern={destPathPattern}
              templateSourcePath={templateResult.sourcePath}
              onBack={() => setStep('bindings')}
            />
          )}
        </div>

        {step !== 'source' && (
          <div className="mt-4 flex flex-wrap gap-3 text-xs text-gray-400">
            <span>
              <span className="font-medium text-gray-600">{records.length}</span> records
            </span>
            {templateResult && (
              <span className="font-mono truncate max-w-xs" title={templateResult.sourcePath}>
                template: {templateResult.sourcePath}
              </span>
            )}
            {destPathPattern && (
              <span className="font-mono truncate max-w-xs">
                dest: {destPathPattern}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
