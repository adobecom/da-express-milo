import { useState } from 'react';
import { DerivedOutput, ImageItem, UseCaseSection } from '../types.ts';

type Feedback = 'up' | 'down' | null;

interface Props {
  output: DerivedOutput;
  primaryKeyword: string;
  destinationFolder: string;
  onStartAnother: () => void;
}

export function GeneratedPreview({ output }: Props) {
  return (
    <div className="fade-in space-y-3">
      {/* SEO Meta — single column */}
      <ReviewSection title="SEO Meta" placeholder="e.g. Shorten the title, use a stronger keyword match...">
        {(isRegenerating) =>
          isRegenerating ? <RegeneratingShimmer lines={3} /> : (
            <div className="space-y-4">
              <MetaRow label="Title" charCount={output.seoTitle.length} max={60}>
                <span className="text-sm font-semibold text-slate-900">{output.seoTitle}</span>
              </MetaRow>
              <MetaRow label="Meta description" charCount={output.metaDescription.length} max={155}>
                <span className="text-sm text-slate-700">{output.metaDescription}</span>
              </MetaRow>
              <MetaRow label="H1">
                <span className="text-base font-bold text-slate-900">{output.h1}</span>
              </MetaRow>
            </div>
          )
        }
      </ReviewSection>

      {/* Intro — paired with hero image */}
      <ReviewSection
        title="Intro Paragraph"
        placeholder="e.g. Make it more conversational, mention specific use cases..."
        image={output.heroImage}
      >
        {(isRegenerating) =>
          isRegenerating ? <RegeneratingShimmer lines={4} /> : (
            <p className="text-sm text-slate-700 leading-relaxed">{output.introText}</p>
          )
        }
      </ReviewSection>

      {/* How It Works — single column */}
      <ReviewSection title="How It Works" placeholder="e.g. Simplify step 3, add a note about file size limits...">
        {(isRegenerating) =>
          isRegenerating ? <RegeneratingShimmer lines={5} /> : (
            <ol className="space-y-3">
              {output.howItWorksSteps.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm text-slate-700">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          )
        }
      </ReviewSection>

      {/* Use Cases — each section paired with its image */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Use Case Sections</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>
        {output.useCaseSections.map((section, i) => (
          <UseCaseSectionCard key={i} section={section} />
        ))}
      </div>

      {/* FAQ — single column */}
      <ReviewSection title="FAQ" placeholder="e.g. Add a question about supported file types, shorten answers...">
        {(isRegenerating) =>
          isRegenerating ? <RegeneratingShimmer lines={5} /> : (
            <div className="space-y-4">
              {output.faqItems.map((item, i) => (
                <div key={i}>
                  <p className="text-sm font-semibold text-slate-700">{item.q}</p>
                  <p className="text-sm text-slate-500 mt-1 leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          )
        }
      </ReviewSection>

      {/* Internal Linking */}
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500">Internal Linking</p>
          <p className="text-xs text-slate-400 mt-0.5">Hub page link + related use case links will be auto-inserted on publish</p>
        </div>
        <span className="text-xs text-slate-400 bg-white border border-slate-200 px-2 py-0.5 rounded-full">Placeholder</span>
      </div>
    </div>
  );
}

// ─── Use Case with paired image ───────────────────────────────────────────────

function UseCaseSectionCard({ section }: { section: UseCaseSection }) {
  const [instructions, setInstructions] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [_feedback, setFeedback] = useState<Feedback>(null);

  const handleAction = () => {
    setIsRegenerating(true);
    setTimeout(() => {
      setIsRegenerating(false);
      setInstructions('');
      setFeedback(null);
    }, 1200);
  };

  const hasInstructions = instructions.trim().length > 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{section.title}</span>
        <div className="flex items-center gap-1">
          <FeedbackButton active={_feedback === 'up'} onClick={() => setFeedback((v) => v === 'up' ? null : 'up')} type="up" />
          <FeedbackButton active={_feedback === 'down'} onClick={() => setFeedback((v) => v === 'down' ? null : 'down')} type="down" />
        </div>
      </div>

      {/* Split body: text left, image right */}
      <div className="grid grid-cols-[3fr_2fr] divide-x divide-slate-100">
        {/* Content + controls */}
        <div className="flex flex-col">
          <div className="px-5 py-4 flex-1">
            {isRegenerating ? <RegeneratingShimmer lines={3} /> : (
              <p className="text-sm text-slate-700 leading-relaxed">{section.description}</p>
            )}
          </div>
          <div className="px-5 pb-5 pt-3 border-t border-slate-100">
            <div className="flex gap-2 items-end">
              <textarea
                value={instructions}
                onChange={(e) => {
                  setInstructions(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                placeholder="e.g. Focus more on enterprise marketers, add a specific workflow example..."
                rows={2}
                className="flex-1 px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent resize-none leading-relaxed transition-shadow"
              />
              <button
                onClick={handleAction}
                disabled={isRegenerating}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  hasInstructions
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {isRegenerating ? <SpinnerIcon /> : <RegenerateIcon />}
                {isRegenerating ? 'Working...' : hasInstructions ? 'Apply' : 'Regenerate'}
              </button>
            </div>
          </div>
        </div>

        {/* Image panel */}
        <ImagePanel image={section.image} />
      </div>
    </div>
  );
}

// ─── Review Section (text-only, full width) ───────────────────────────────────

function ReviewSection({
  title,
  placeholder,
  image,
  children,
}: {
  title: string;
  placeholder: string;
  image?: ImageItem;
  children: (isRegenerating: boolean) => React.ReactNode;
}) {
  const [instructions, setInstructions] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [_feedback, setFeedback] = useState<Feedback>(null);

  const handleAction = () => {
    setIsRegenerating(true);
    setTimeout(() => {
      setIsRegenerating(false);
      setInstructions('');
      setFeedback(null);
    }, 1200);
  };

  const hasInstructions = instructions.trim().length > 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Header — always full width */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{title}</span>
        <div className="flex items-center gap-1">
          <FeedbackButton active={_feedback === 'up'} onClick={() => setFeedback((v) => v === 'up' ? null : 'up')} type="up" />
          <FeedbackButton active={_feedback === 'down'} onClick={() => setFeedback((v) => v === 'down' ? null : 'down')} type="down" />
        </div>
      </div>

      {image ? (
        /* Split layout: content left, image right */
        <div className="grid grid-cols-[3fr_2fr] divide-x divide-slate-100">
          <div className="flex flex-col">
            <div className="px-5 py-4 flex-1">{children(isRegenerating)}</div>
            <div className="px-5 pb-5 pt-3 border-t border-slate-100">
              <div className="flex gap-2 items-end">
                <textarea
                  value={instructions}
                  onChange={(e) => {
                    setInstructions(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = `${e.target.scrollHeight}px`;
                  }}
                  placeholder={placeholder}
                  rows={2}
                  className="flex-1 px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent resize-none leading-relaxed transition-shadow"
                />
                <button
                  onClick={handleAction}
                  disabled={isRegenerating}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    hasInstructions
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                      : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {isRegenerating ? <SpinnerIcon /> : <RegenerateIcon />}
                  {isRegenerating ? 'Working...' : hasInstructions ? 'Apply' : 'Regenerate'}
                </button>
              </div>
            </div>
          </div>
          <ImagePanel image={image} />
        </div>
      ) : (
        /* Single column layout */
        <div>
          <div className="px-5 py-4">{children(isRegenerating)}</div>
          <div className="px-5 pb-5 pt-3 border-t border-slate-100">
            <div className="flex gap-2 items-end">
              <textarea
                value={instructions}
                onChange={(e) => {
                  setInstructions(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                placeholder={placeholder}
                rows={2}
                className="flex-1 px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent resize-none leading-relaxed transition-shadow"
              />
              <button
                onClick={handleAction}
                disabled={isRegenerating}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  hasInstructions
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {isRegenerating ? <SpinnerIcon /> : <RegenerateIcon />}
                {isRegenerating ? 'Working...' : hasInstructions ? 'Apply' : 'Regenerate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Image Panel ──────────────────────────────────────────────────────────────

function ImagePanel({ image }: { image: ImageItem }) {
  const [instructions, setInstructions] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [bust, setBust] = useState('');

  const handleAction = () => {
    setIsRegenerating(true);
    setTimeout(() => {
      setBust(`?t=${Date.now()}`);
      setIsRegenerating(false);
      setInstructions('');
    }, 1500);
  };

  const hasInstructions = instructions.trim().length > 0;

  return (
    <div className="flex flex-col bg-slate-50/50">
      {/* Image */}
      <div className="relative aspect-video bg-slate-100 flex-shrink-0">
        {isRegenerating ? (
          <div className="w-full h-full shimmer" />
        ) : (
          <img
            src={`${image.url}${bust}`}
            alt={image.caption}
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/50 text-white text-xs font-medium backdrop-blur-sm">
          {image.caption}
        </div>
      </div>

      {/* Prompt */}
      <div className="px-4 py-3 border-t border-slate-100 flex-1">
        <p className="text-xs font-medium text-slate-400 mb-1">AI prompt</p>
        <p className="text-xs text-slate-500 leading-relaxed">{image.prompt}</p>
      </div>

      {/* Image controls */}
      <div className="px-4 pb-4 pt-3 border-t border-slate-100">
        <p className="text-xs font-medium text-slate-400 mb-2">Image adjustments</p>
        <textarea
          value={instructions}
          onChange={(e) => {
            setInstructions(e.target.value);
            e.target.style.height = 'auto';
            e.target.style.height = `${e.target.scrollHeight}px`;
          }}
          placeholder="e.g. More vibrant colors, show before/after comparison, focus on the texture detail..."
          rows={3}
          className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent resize-none leading-relaxed transition-shadow"
        />
        <button
          onClick={handleAction}
          disabled={isRegenerating}
          className={`mt-2 w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            hasInstructions
              ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
              : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          {isRegenerating ? <SpinnerIcon /> : <RegenerateIcon />}
          {isRegenerating ? 'Working...' : hasInstructions ? 'Apply & regenerate' : 'Regenerate image'}
        </button>
      </div>
    </div>
  );
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function FeedbackButton({ active, onClick, type }: { active: boolean; onClick: () => void; type: 'up' | 'down' }) {
  return (
    <button
      onClick={onClick}
      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
        active
          ? type === 'up' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-500'
          : 'text-slate-300 hover:text-slate-500 hover:bg-slate-100'
      }`}
    >
      {type === 'up' ? <ThumbUpIcon /> : <ThumbDownIcon />}
    </button>
  );
}

function RegeneratingShimmer({ lines }: { lines: number }) {
  return (
    <div className="space-y-2 py-1">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-3 rounded shimmer"
          style={{ width: i === lines - 1 ? '55%' : i % 3 === 1 ? '85%' : '100%' }} />
      ))}
    </div>
  );
}

function MetaRow({ label, charCount, max, children }: { label: string; charCount?: number; max?: number; children: React.ReactNode }) {
  const pct = charCount !== undefined && max ? charCount / max : 0;
  const badgeColor = pct > 1 ? 'bg-red-100 text-red-600' : pct > 0.85 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700';
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs text-slate-400 font-medium">{label}</span>
        {charCount !== undefined && max && (
          <span className={`px-1.5 py-0.5 rounded text-xs font-mono font-semibold ${badgeColor}`}>
            {charCount}/{max}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function RegenerateIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M8 16H3v5" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="animate-spin">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

function ThumbUpIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M7 10v12" />
      <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88z" />
    </svg>
  );
}

function ThumbDownIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 14V2" />
      <path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88z" />
    </svg>
  );
}
