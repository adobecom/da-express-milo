import { useEffect } from 'react';

/**
 * Show the browser's native "Leave site? / Changes you made may not be saved"
 * dialog before the user closes the tab, reloads, or navigates to another page —
 * but only while `enabled` is true (i.e. there is unsaved, in-progress work).
 *
 * Notes:
 * - The dialog's wording is controlled by the browser and cannot be customized;
 *   we can only trigger it.
 * - It fires only on a real page unload (tab/window close, reload, navigation),
 *   not on the in-app Generate/Document Manager tab switches.
 */
export function useBeforeUnload(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Legacy Chrome/Edge require returnValue to be set to trigger the prompt.
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [enabled]);
}
