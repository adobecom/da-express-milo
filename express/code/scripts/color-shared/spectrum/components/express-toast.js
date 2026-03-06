const TOAST_DURATION = 2000;
const TOAST_CLASS = 'express-toast';

let activeToast = null;

export function showExpressToast({ message, variant = 'positive', timeout = TOAST_DURATION, anchor } = {}) {
  if (activeToast && activeToast.parentNode) {
    activeToast.remove();
  }

  const toast = document.createElement('div');
  toast.className = `${TOAST_CLASS} ${TOAST_CLASS}--${variant}`;
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  toast.textContent = message;

  Object.assign(toast.style, {
    position: 'fixed',
    bottom: '24px',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#fff',
    background: variant === 'positive' ? '#0a8a0a' : '#505050',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    zIndex: '10000',
    transition: 'opacity 0.2s ease',
    opacity: '1',
    pointerEvents: 'none',
  });

  const parent = anchor || document.body;
  parent.appendChild(toast);
  activeToast = toast;

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => {
      if (toast.parentNode) toast.remove();
      if (activeToast === toast) activeToast = null;
    }, 200);
  }, timeout);

  return toast;
}
