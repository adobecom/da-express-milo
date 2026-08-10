// Small icons shared by the GMC preview row and the post-submit error table (same "View image"
// affordance in both places).
export function ImageIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="w-3.5 h-3.5 shrink-0" aria-hidden="true">
      <rect x="2.5" y="3.5" width="15" height="13" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="7" cy="8" r="1.5" fill="currentColor" />
      <path d="M4 15l4-4 3 3 3-3 2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
