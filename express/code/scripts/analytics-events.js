/* global _satellite */

// Kept intentionally free of a static/eager dependency on instrument.js so it can be
// attached before block decoration runs (blocks like floating-button dispatch
// 'linkspopulated' synchronously while decorating) without pulling in the rest of
// martech's heavier tracking logic on the critical path. Each listener lazily imports
// only what it needs once the event actually fires.
export default function decorateAnalyticsEvents() {
  const d = document;

  // for tracking all of the links
  d.addEventListener('click', async (event) => {
    if (event.target.tagName === 'A' || event.target.dataset.ll?.length) {
      const { trackButtonClick } = await import('./instrument.js');
      trackButtonClick(event.target);
    }
  });

  // for tracking split action block notch and underlay background
  d.addEventListener('splitactionloaded', async () => {
    const $notch = d.querySelector('main .split-action .notch');
    const $underlay = d.querySelector('main .split-action .underlay');
    if (!$notch && !$underlay) return;

    const { trackButtonClick } = await import('./instrument.js');

    if ($notch) {
      $notch.addEventListener('click', () => {
        trackButtonClick($notch);
      });
    }

    if ($underlay) {
      $underlay.addEventListener('click', () => {
        trackButtonClick($underlay);
      });
    }
  });

  // Tracking any link or links that is added after page loaded.
  d.addEventListener('linkspopulated', async (e) => {
    const [{ default: trackBranchParameters }, { trackButtonClick }] = await Promise.all([
      import('./branchlinks.js'),
      import('./instrument.js'),
    ]);
    await trackBranchParameters(e.detail);
    e.detail.forEach(($link) => {
      $link.addEventListener('click', () => {
        trackButtonClick($link);
      });
    });
  });

  // tracking videos loaded asynchronously.
  d.addEventListener('videoloaded', async (e) => {
    const { trackVideoAnalytics } = await import('./instrument.js');
    trackVideoAnalytics(e.detail.parameters);
    _satellite.track('videoloaded');
  });

  d.addEventListener('videoclosed', async (e) => {
    const { sendEventToAnalytics } = await import('./instrument.js');
    sendEventToAnalytics(`adobe.com:express:cta:learn:columns:${e.detail.parameters.videoId}:videoClosed`);
  });
}
