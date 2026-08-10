import { useEffect, type ReactNode } from 'react';

type ModalSize = 'auto' | 'sm' | 'md' | 'lg' | 'xl' | 'full';

interface Props {
  title?: ReactNode;
  children: ReactNode;
  /** Rendered in a bottom bar, right-aligned (typically action buttons). Omit for no footer. */
  footer?: ReactNode;
  onClose: () => void;
  /** Allow Escape / overlay-click to dismiss. Default true. Set false during in-flight work. */
  dismissable?: boolean;
  /** Card width. Default 'md'. */
  size?: ModalSize;
  /** Overlay stacking — bump when nesting a modal above another (e.g. a confirm). Default 'z-50'. */
  zClassName?: string;
}

const SIZE: Record<ModalSize, string> = {
  auto: 'w-max max-w-[90vw]',
  sm: 'w-[420px] max-w-[90vw]',
  md: 'w-[560px] max-w-[90vw]',
  lg: 'w-[820px] max-w-[92vw]',
  xl: 'w-[1120px] max-w-[95vw]',
  full: 'w-[95vw]',
};

/**
 * Shared modal shell: dimmed overlay + centered white card with an optional titled header
 * (with a close affordance), a scrollable body, and an optional footer bar. Escape and
 * overlay-click dismiss when `dismissable`. Reused by ConfirmModal and the GMC submit dialog
 * so the overlay/card chrome lives in exactly one place.
 */
export default function Modal({
  title,
  children,
  footer,
  onClose,
  dismissable = true,
  size = 'md',
  zClassName = 'z-50',
}: Props) {
  useEffect(() => {
    if (!dismissable) return undefined;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dismissable, onClose]);

  return (
    <div
      className={`fixed inset-0 bg-black/40 flex items-center justify-center ${zClassName}`}
      onClick={dismissable ? onClose : undefined}
    >
      <div
        className={`bg-white rounded-2xl border border-gray-200 shadow-xl flex flex-col max-h-[90vh] ${SIZE[size]}`}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || dismissable) && (
          <div className="flex items-center gap-3 px-6 pt-5 pb-3 border-b border-gray-100 shrink-0">
            {title && <h3 className="font-semibold text-gray-900 text-base flex-1">{title}</h3>}
            {dismissable && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="text-gray-400 hover:text-gray-700 cursor-pointer shrink-0"
              >
                <CloseIcon />
              </button>
            )}
          </div>
        )}
        {/* min-h-0 is required so this flex child can shrink below its content height and actually
            scroll (instead of growing the card past max-h-[90vh]). */}
        <div className="px-6 py-4 overflow-auto flex-1 min-h-0 flex flex-col gap-4">{children}</div>
        {footer && <div className="flex gap-3 justify-end px-6 py-4 border-t border-gray-100 shrink-0">{footer}</div>}
      </div>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M4.4 4.4a1 1 0 0 1 1.4 0L10 8.6l4.2-4.2a1 1 0 1 1 1.4 1.4L11.4 10l4.2 4.2a1 1 0 0 1-1.4 1.4L10 11.4l-4.2 4.2a1 1 0 0 1-1.4-1.4L8.6 10 4.4 5.8a1 1 0 0 1 0-1.4Z"
        clipRule="evenodd"
      />
    </svg>
  );
}
