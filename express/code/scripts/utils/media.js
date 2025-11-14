import { createTag, getLibs, readBlockConfig } from '../utils.js';

/** Adding a backup here for the rootPath for createAccessibilityVideoControls function */
const federatedAccessibilityIconsPath = 'https://main--federal--adobecom.aem.live';

export function createOptimizedPicture(src, alt = '', eager = false, breakpoints = [{ media: '(min-width: 600px)', width: '2000' }, { width: '750' }]) {
  const url = new URL(src, window.location.href);
  const picture = document.createElement('picture');
  const { pathname } = url;
  const ext = pathname.substring(pathname.lastIndexOf('.') + 1);

  // webp
  breakpoints.forEach((br) => {
    const source = document.createElement('source');
    if (br.media) source.setAttribute('media', br.media);
    source.setAttribute('type', 'image/webp');
    source.setAttribute('srcset', `${pathname}?width=${br.width}&format=webply&optimize=medium`);
    picture.appendChild(source);
  });

  // fallback
  breakpoints.forEach((br, i) => {
    if (i < breakpoints.length - 1) {
      const source = document.createElement('source');
      if (br.media) source.setAttribute('media', br.media);
      source.setAttribute('srcset', `${pathname}?width=${br.width}&format=${ext}&optimize=medium`);
      picture.appendChild(source);
    } else {
      const img = document.createElement('img');
      img.setAttribute('loading', eager ? 'eager' : 'lazy');
      img.setAttribute('alt', alt);
      picture.appendChild(img);
      img.setAttribute('src', `${pathname}?width=${br.width}&format=${ext}&optimize=medium`);
    }
  });

  return picture;
}

export function toggleVideo(target) {
  const video = target?.closest('.hero-animation-overlay')?.querySelector('video');
  const paused = video ? video.paused : false;

  if (paused) {
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // ignore
      });
    }
  } else video?.pause();
}

export function addAnimationToggle(target) {
  target.addEventListener('click', () => {
    toggleVideo(target);
  }, true);
  target.addEventListener('keypress', (e) => {
    if (e.key !== 'Enter' && e.keyCode !== 32 && e.key !== ' ') {
      return;
    }
    e.preventDefault();
    toggleVideo(target);
  }, true);
}

export async function createAccessibilityVideoControls(videoElement) {
  const videoContainer = createTag('div', { class: 'video-container' });
  const videoAnimation = videoElement?.closest('.hero-animation-overlay');
  const { getFederatedContentRoot } = await import(`${getLibs()}/utils/utils.js`);

  /** Localization for video labels */
  const { replaceKeyArray } = await import(`${getLibs()}/features/placeholders.js`);
  const { getConfig } = await import(`${getLibs()}/utils/utils.js`);
  const [playAnimation, pauseAnimation] = await replaceKeyArray(['play-animation', 'pause-animation'], getConfig());
  const videoLabels = {
    playMotion: playAnimation || 'Play',
    pauseMotion: pauseAnimation || 'Pause',
  };

  const federatedRootPath = getFederatedContentRoot() || federatedAccessibilityIconsPath;

  const controlsWrapper = createTag('div', {
    class: 'video-controls-wrapper',
    tabIndex: '0',
    role: 'button',
    'aria-pressed': 'true',
    'aria-label': videoLabels.pauseMotion,
  });

  // Add play and pause icons
  controlsWrapper.append(
    createTag('img', { alt: '', src: `${federatedRootPath}/federal/assets/svgs/accessibility-pause.svg`, class: 'accessibility-control icon-pause-video' }),
    createTag('img', { alt: '', src: `${federatedRootPath}/federal/assets/svgs/accessibility-play.svg`, class: 'accessibility-control icon-play-video isHidden' }),
  );

  // Add keyboard support
  controlsWrapper.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'Enter') {
      e.preventDefault();
      controlsWrapper.click();
    }
  });

  // Update button state when video state changes
  videoElement.addEventListener('play', () => {
    controlsWrapper.setAttribute('aria-pressed', 'true');
    controlsWrapper.setAttribute('aria-label', videoLabels.pauseMotion);
  });

  videoElement.addEventListener('pause', () => {
    controlsWrapper.setAttribute('aria-pressed', 'false');
    controlsWrapper.setAttribute('aria-label', videoLabels.playMotion);
  });

  videoContainer.appendChild(videoElement);
  videoContainer.appendChild(controlsWrapper);
  videoAnimation.appendChild(videoContainer);
  addAnimationToggle(controlsWrapper);
  return videoElement;
}

export function transformLinkToAnimation($a, $videoLooping = true, hasControls = true) {
  try {
    const sectionMetadata = $a?.closest('.section')?.querySelector('.section-metadata');
    const metadataConfig = sectionMetadata ? readBlockConfig(sectionMetadata) : {};
    const { 'animation-alt-text': animationAltText } = metadataConfig || {};
    const videoTitle = animationAltText?.trim();

    if (!$a || !$a.href || !$a.href.endsWith('.mp4')) {
      return null;
    }

    let params;
    let videoUrl;
    try {
      params = new URL($a.href).searchParams;
      videoUrl = new URL($a.href);
    } catch (urlError) {
      window.lana?.log('Invalid video URL in transformLinkToAnimation:', urlError);
      return null;
    }

    const attribs = {};
    const dataAttr = $videoLooping ? ['playsinline', 'autoplay', 'loop', 'muted'] : ['playsinline', 'autoplay', 'muted'];
    dataAttr.forEach((p) => {
      if (params.get(p) !== 'false') attribs[p] = '';
    });

    // use closest picture as poster
    const $poster = $a.closest('div').querySelector('picture source');
    if ($poster) {
      attribs.poster = $poster.srcset;
      $poster.parentNode.remove();
    }

    // replace anchor with video element
    const isLegacy = videoUrl.hostname.includes('hlx.blob.core') || videoUrl.hostname.includes('aem.blob.core') || videoUrl.pathname.includes('media_');
    const $video = createTag('video', attribs);

    if (videoTitle) {
      $video?.setAttribute('title', videoTitle);
    }

    // Use createTag instead of innerHTML
    if (isLegacy) {
      const helixId = videoUrl.hostname.includes('hlx.blob.core') || videoUrl.hostname.includes('aem.blob.core') ? videoUrl.pathname.split('/')[2] : videoUrl.pathname.split('media_')[1].split('.')[0];
      const videoHref = `./media_${helixId}.mp4`;
      const source = createTag('source', { src: videoHref, type: 'video/mp4' });
      $video.appendChild(source);
    } else {
      const source = createTag('source', { src: videoUrl, type: 'video/mp4' });
      $video.appendChild(source);
    }

    const $innerDiv = $a.closest('div');
    $innerDiv.prepend($video);
    $innerDiv.classList.add('hero-animation-overlay');
    $video.setAttribute('tabindex', 0);
    $a.replaceWith($video);

    // autoplay animation
    $video.addEventListener('canplay', () => {
      $video.muted = true;
      const playPromise = $video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // ignore
        });
      }
    });

    // TODO: make this authorable or edit all blocks that use this func
    if (hasControls) createAccessibilityVideoControls($video);

    return $video;
  } catch (error) {
    window.lana?.log('Error in transformLinkToAnimation:', error);
    return null;
  }
}

export function linkImage($elem) {
  const $a = $elem.querySelector('a');
  if ($a) {
    const $parent = $a.closest('div');
    $a.remove();
    $a.className = '';
    $a.innerHTML = '';
    $a.append(...$parent.children);
    $parent.append($a);
  }
}
