import { useState, useRef, useEffect } from 'react';
import { FormState, SearchIntent, DerivedOutput, SAMPLE_DERIVED } from './types.ts';
import { FeaturePageInput } from './components/FeaturePageInput.tsx';
import { BriefSection } from './components/BriefSection.tsx';
import { SeoInputs } from './components/SeoInputs.tsx';
import { GeneratedPreview } from './components/GeneratedPreview.tsx';

type Project = 'doodlebug' | 'pdp';
type Phase = 'form' | 'generating' | 'generated';

const INITIAL_FORM: FormState = {
  featurePageUrl: 'https://www.adobe.com/products/firefly/features/image-upscaler.html',
  brief: '',
  primaryKeyword: '',
  secondaryKeywords: [],
  searchIntent: '',
  targetFeature: '',
  destinationFolder: 'drafts/jingle/test',
};

export default function App() {
  const [project, setProject] = useState<Project>('doodlebug');
  const [showProjectMenu, setShowProjectMenu] = useState(false);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [output, setOutput] = useState<DerivedOutput | null>(null);
  const [phase, setPhase] = useState<Phase>('form');
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowProjectMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleGenerateContent = () => {
    if (!form.primaryKeyword.trim()) return;
    setPhase('generating');
    setTimeout(() => {
      setOutput(SAMPLE_DERIVED);
      setPhase('generated');
      setTimeout(() => {
        document.getElementById('review-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }, 2200);
  };

  const handleStartAnother = () => {
    setForm(INITIAL_FORM);
    setOutput(null);
    setPhase('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isContentReady = form.primaryKeyword.trim().length > 0;
  const isPublishReady = form.destinationFolder.trim().length > 0;

  const PROJECT_LABELS: Record<Project, string> = { doodlebug: 'Doodlebug', pdp: 'PDP' };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Nav */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
            <span className="font-semibold text-slate-900 text-sm">ContentScaler</span>

            {/* Project dropdown */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowProjectMenu((v) => !v)}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-100 hover:bg-violet-200 text-violet-700 text-xs font-medium transition-colors"
              >
                {PROJECT_LABELS[project]}
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
              {showProjectMenu && (
                <div className="absolute top-full left-0 mt-1.5 w-36 bg-white rounded-xl border border-slate-200 shadow-lg py-1 fade-in">
                  {(['doodlebug', 'pdp'] as Project[]).map((p) => (
                    <button
                      key={p}
                      onClick={() => { setProject(p); setShowProjectMenu(false); }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-medium hover:bg-slate-50 transition-colors ${
                        project === p ? 'text-indigo-700' : 'text-slate-600'
                      }`}
                    >
                      {project === p && (
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      )}
                      {project !== p && <span className="w-[11px]" />}
                      {PROJECT_LABELS[p]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            UI Prototype
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* Form — constrained to narrow column */}
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900">One page at a time.</h1>
            <p className="text-slate-500 mt-1.5 text-sm leading-relaxed">
              Generate a supporting SEO page for a Firefly feature you just launched. Each run produces one focused, keyword-targeted page.
            </p>
          </div>

          {/* Step 1: Feature Page */}
          <Step number="1" title="Feature page" description="URL of the page you just launched">
            <FeaturePageInput url={form.featurePageUrl} onChange={(v) => update('featurePageUrl', v)} />
          </Step>

          {/* Step 2: Brief */}
          <Step number="2" title="Brief" description="What angle does this supporting page cover?">
            <BriefSection brief={form.brief} onChange={(v) => update('brief', v)} />
          </Step>

          {/* Step 3: SEO Inputs */}
          <Step number="3" title="SEO inputs" description="Keywords, intent, and product feature">
            <SeoInputs
              brief={form.brief}
              primaryKeyword={form.primaryKeyword}
              secondaryKeywords={form.secondaryKeywords}
              searchIntent={form.searchIntent as SearchIntent}
              targetFeature={form.targetFeature}
              onPrimaryChange={(v) => update('primaryKeyword', v)}
              onSecondaryChange={(v) => update('secondaryKeywords', v)}
              onIntentChange={(v) => update('searchIntent', v)}
              onFeatureChange={(v) => update('targetFeature', v)}
            />
          </Step>

          {/* Generate content button */}
          {phase === 'form' && (
            <div className="space-y-2">
              <button
                onClick={handleGenerateContent}
                disabled={!isContentReady}
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-sm"
              >
                <SparkleIcon />
                Generate content
              </button>
              {!isContentReady && (
                <p className="text-center text-xs text-slate-400">Add a primary keyword to generate content</p>
              )}
            </div>
          )}

          {/* Generating state */}
          {phase === 'generating' && <GeneratingState />}
        </div>

        {/* Review sections — full width */}
        {phase === 'generated' && output && (
          <div className="mt-8 space-y-4">
            <div id="review-section">
              <div className="flex items-center gap-2 px-1 pt-2 pb-4">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Review & Revise</span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>
              <GeneratedPreview
                output={output}
                primaryKeyword={form.primaryKeyword}
                destinationFolder={form.destinationFolder}
                onStartAnother={handleStartAnother}
              />
            </div>

            {/* Step 4: Publish — back to narrow */}
            <div className="max-w-2xl mx-auto space-y-1 pt-2">
              <div className="flex items-center gap-2 px-1 pb-3">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Create Page</span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>
              <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-xs font-bold flex items-center justify-center">4</span>
                  <div>
                    <span className="text-sm font-semibold text-slate-900">Destination</span>
                    <span className="text-xs text-slate-400 ml-2">Where in DA should this page be created?</span>
                  </div>
                </div>
                <div className="px-6 py-5 space-y-4">
                  <div className="space-y-1.5">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400 text-sm select-none">/</div>
                      <input
                        type="text"
                        value={form.destinationFolder}
                        onChange={(e) => update('destinationFolder', e.target.value)}
                        className="w-full pl-6 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono transition-shadow"
                      />
                    </div>
                    {form.primaryKeyword && form.destinationFolder && (
                      <p className="text-xs text-slate-400 font-mono fade-in">
                        → /{form.destinationFolder}/{form.primaryKeyword.replace(/\s+/g, '-')}
                      </p>
                    )}
                  </div>
                  <button
                    disabled={!isPublishReady}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-sm"
                  >
                    <PublishIcon />
                    Create page in DA
                  </button>
                  <div className="flex justify-center">
                    <button
                      onClick={handleStartAnother}
                      className="flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-indigo-600 transition-colors"
                    >
                      <PlusIcon />
                      Start another supporting page
                    </button>
                  </div>
                </div>
              </section>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function Step({ number, title, description, children }: {
  number: string; title: string; description: string; children: React.ReactNode;
}) {
  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-xs font-bold flex items-center justify-center">
          {number}
        </span>
        <div>
          <span className="text-sm font-semibold text-slate-900">{title}</span>
          <span className="text-xs text-slate-400 ml-2">{description}</span>
        </div>
      </div>
      <div className="px-6 py-5">{children}</div>
    </section>
  );
}

function GeneratingState() {
  const steps = ['Analyzing brief and keywords', 'Generating SEO metadata', 'Writing content sections', 'Building FAQ schema'];
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-6 py-8 fade-in">
      <div className="flex flex-col items-center gap-5">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"
            className="animate-spin" style={{ animationDuration: '1.5s' }}>
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-800">Generating content</p>
          <p className="text-xs text-slate-400 mt-1">This takes a few seconds</p>
        </div>
        <div className="w-full max-w-sm space-y-2.5">
          {steps.map((step, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="shimmer w-4 h-4 rounded-full flex-shrink-0" />
              <div className="shimmer h-3 rounded flex-1" style={{ width: `${75 + i * 5}%` }} />
              <span className="text-xs text-slate-400 flex-shrink-0 w-36 text-right">{step}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SparkleIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M12 3l1.9 5.1 5.1 1.9-5.1 1.9L12 17l-1.9-5.1L5 9.9l5.1-1.9z" />
      <path d="M5 3l.8 2.2L8 6l-2.2.8L5 9l-.8-2.2L2 6l2.2-.8z" />
    </svg>
  );
}

function PublishIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="12" y1="18" x2="12" y2="12" />
      <line x1="9" y1="15" x2="12" y2="12" />
      <line x1="15" y1="15" x2="12" y2="12" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
