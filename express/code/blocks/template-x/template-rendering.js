/* eslint-disable no-underscore-dangle */
import { getLibs, getIconElementDeprecated } from '../../scripts/utils.js';
import { trackSearch, updateImpressionCache } from '../../scripts/template-search-api-v3.js';
import { getTrackingAppendedURL } from '../../scripts/branchlinks.js';
import BlockMediator from '../../scripts/block-mediator.min.js';

let createTag; let getConfig;
let getMetadata; let replaceKeyArray;
let tagCopied; let editThisTemplate;
let free;
let variants;
let props;
let sharePlaceholder;
let mv;
let sdid;
let source;
let action;

function containsVideo(pages) {
  return pages.some((page) => !!page?.rendition?.video?.thumbnail?.componentId);
}

function isVideo(iterator) {
  return iterator.current().rendition?.video?.thumbnail?.componentId;
}

export function getTemplateTitle(template) {
  if (template['dc:title']?.['i-default']) {
    return template['dc:title']['i-default'];
  }

  if (template.moods?.length && template.task?.name) {
    return `${template.moods.join(', ')} ${template.task.name}`;
  }

  if (getMetadata('tasks-x')?.trim() && getMetadata('topics-x')?.trim()) {
    return `${getMetadata('topics-x').trim()} ${getMetadata('tasks-x').trim()}`;
  }

  return '';
}

function extractRenditionLinkHref(template) {
  return template._links?.['http://ns.adobe.com/adobecloud/rel/rendition']?.href;
}

function extractComponentLinkHref(template) {
  return template._links?.['http://ns.adobe.com/adobecloud/rel/component']?.href;
}

function extractImageThumbnail(page) {
  return page?.rendition?.image?.thumbnail;
}

function getImageThumbnailSrc(renditionLinkHref, componentLinkHref, page) {
  const thumbnail = extractImageThumbnail(page);
  if (!thumbnail) {
    // webpages
    return renditionLinkHref.replace('{&page,size,type,fragment}', '');
  }
  const {
    mediaType,
    componentId,
    width,
    height,
    hzRevision,
  } = thumbnail;
  if (mediaType === 'image/webp') {
    // webp only supported by componentLink
    return componentLinkHref.replace(
      '{&revision,component_id}',
      `&revision=${hzRevision || 0}&component_id=${componentId}`,
    );
  }

  return renditionLinkHref.replace(
    '{&page,size,type,fragment}',
    `&size=${Math.max(width, height)}&type=${mediaType}&fragment=id=${componentId}`,
  );
}

const videoMetadataType = 'application/vnd.adobe.ccv.videometadata';

/* c8 ignore next */
async function getVideoUrls(renditionLinkHref, componentLinkHref, page) {
  const videoThumbnail = page.rendition?.video?.thumbnail;
  const { componentId } = videoThumbnail;
  const preLink = renditionLinkHref.replace(
    '{&page,size,type,fragment}',
    `&type=${videoMetadataType}&fragment=id=${componentId}`,
  );
  const backupPosterSrc = getImageThumbnailSrc(renditionLinkHref, componentLinkHref, page);
  try {
    const response = await fetch(preLink);
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    const { renditionsStatus: { state }, posterframe, renditions } = await response.json();
    if (state !== 'COMPLETED') throw new Error('Video not ready');

    const mp4Rendition = renditions.find((r) => r.videoContainer === 'MP4');
    if (!mp4Rendition?.url) throw new Error('No MP4 rendition found');

    return { src: mp4Rendition.url, poster: posterframe?.url || backupPosterSrc };
  } catch (err) {
    // use componentLink as backup
    return {
      src: componentLinkHref.replace(
        '{&revision,component_id}',
        `&revision=0&component_id=${componentId}`,
      ),
      poster: backupPosterSrc,
    };
  }
}
/* c8 ignore next */
async function share(branchUrl, tooltip, timeoutId, liveRegion, text) {
  const urlWithTracking = await getTrackingAppendedURL(branchUrl, {
    placement: 'template-x',
    isSearchOverride: true,
  });
  await navigator.clipboard.writeText(urlWithTracking);
  tooltip.classList.add('display-tooltip');

  const rect = tooltip.getBoundingClientRect();
  const tooltipRightEdgePos = rect.left + rect.width;
  if (tooltipRightEdgePos > window.innerWidth) {
    tooltip.classList.add('flipped');
  }
  // Update ARIA-live region
  liveRegion.textContent = text;
  clearTimeout(timeoutId);
  return setTimeout(() => {
    tooltip.classList.remove('display-tooltip');
    tooltip.classList.remove('flipped');
  }, 2500);
}
/* c8 ignore next */
function renderShareWrapper(templateInfo) {
  const { templateTitle, branchUrl } = templateInfo;
  const text = tagCopied === 'tag copied' ? 'Copied to clipboard' : tagCopied;
  const wrapper = createTag('div', { class: 'share-icon-wrapper' });
  const shareIcon = getIconElementDeprecated('share-arrow');
  shareIcon.setAttribute('tabindex', 0);
  shareIcon.setAttribute('role', 'button');
  shareIcon.setAttribute('aria-label', `${sharePlaceholder === 'share' ? 'Share' : sharePlaceholder} ${templateTitle}`);
  const tooltip = createTag('div', {
    class: 'shared-tooltip',
    'aria-label': text,
    role: 'tooltip',
    tabindex: '-1',
  });
  const liveRegion = createTag('div', {
    'aria-live': 'polite',
    class: 'sr-only',
  });
  wrapper.append(liveRegion);

  let timeoutId = null;
  shareIcon.addEventListener('click', async (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    timeoutId = await share(branchUrl, tooltip, timeoutId, liveRegion, text);
  });
  shareIcon.addEventListener('keypress', async (e) => {
    if (e.key !== 'Enter') return;
    timeoutId = await share(branchUrl, tooltip, timeoutId, liveRegion, text);
  });
  const checkmarkIcon = getIconElementDeprecated('checkmark-green');
  tooltip.append(checkmarkIcon);
  const textEl = createTag('span', { class: 'text' });
  textEl.textContent = text;
  tooltip.append(textEl);
  wrapper.append(shareIcon);
  wrapper.append(tooltip);
  return wrapper;
}

export const buildiFrameContent = (template) => {
  const { branchUrl } = template.customLinks;
  const taskID = props?.taskid;
  const zazzleUrl = props?.zazzleurl;
  const { lang } = document.documentElement;
  const iFrame = createTag('iframe', {
    src: `${zazzleUrl}?TD=${template.id}&taskID=${taskID}&shortcode=${branchUrl.split('/').pop()}&lang=${lang}`,
    title: 'Edit this template',
    tabindex: '-1',
  });

  iFrame.allowfullscreen = true;
  return iFrame;
};
/* c8 ignore next */
const showModaliFrame = async (template) => {
  const { getModal } = await import(`${getLibs()}/blocks/modal/modal.js`);

  const iFrameContent = buildiFrameContent(template);
  const modal = await getModal(null, {
    id: template.id.replace(/:/g, '-'),
    class: 'print-iframe',
    content: iFrameContent,
    closeEvent: 'closeModal',
  });

  return modal;
};

/* c8 ignore next */
function renderPrintCTA(template) {
  const btnTitle = 'Customize design';
  const btnEl = createTag('a', {
    href: '#modal',
    title: btnTitle,
    class: 'button accent small',
    target: '_self',
  });

  btnEl.addEventListener('click', async (e) => {
    e.preventDefault();
    await showModaliFrame(template);
  });

  btnEl.textContent = btnTitle;
  return btnEl;
}

function renderPrintCTALink(template) {
  const link = createTag('a', {
    href: '#modal',
    title: 'Customize design',
    class: 'cta-link',
  });

  link.addEventListener('click', async (e) => {
    e.preventDefault();
    await showModaliFrame(template);
  });

  return link;
}

function renderCTA(branchUrl) {
  const btnTitle = editThisTemplate === 'edit this template' ? 'Edit this template' : editThisTemplate;
  const btnEl = createTag('a', {
    href: `${branchUrl}${mv}${sdid}${source}${action}`,
    title: btnTitle,
    class: 'button accent small',
  });
  btnEl.textContent = btnTitle;
  return btnEl;
}

function renderCTALink(branchUrl, template) {
  const btnTitle = editThisTemplate === 'edit this template' ? 'Edit this template' : editThisTemplate;
  const linkEl = createTag('a', {
    href: `${branchUrl}${mv}${sdid}${source}${action}`,
    class: 'cta-link',
    tabindex: '-1',
    'aria-label': `${btnTitle} ${getTemplateTitle(template)}`,
  });
  return linkEl;
}

function getPageIterator(pages) {
  return {
    i: 0,
    next() {
      this.i = (this.i + 1) % pages.length;
    },
    reset() {
      this.i = 0;
    },
    current() {
      return pages[this.i];
    },
    all() {
      return pages;
    },
  };
}
async function renderRotatingMedias(
  wrapper,
  pages,
  { templateTitle, renditionLinkHref, componentLinkHref },
) {
  const pageIterator = getPageIterator(pages);
  let imgTimeoutId;

  const constructVideo = async () => {
    if (!containsVideo(pages)) return null;
    const { src, poster } = await getVideoUrls(
      renditionLinkHref,
      componentLinkHref,
      pageIterator.current(),
    );
    const video = createTag('video', {
      muted: true,
      playsinline: '',
      title: templateTitle,
      poster,
      class: 'unloaded hidden',
    });
    const videoSource = createTag('source', {
      src,
      type: 'video/mp4',
    });

    video.append(videoSource);

    return video;
  };
  const constructImg = () => createTag('img', {
    src: '',
    alt: templateTitle,
    class: 'hidden',
  });

  const img = constructImg();
  if (img) wrapper.prepend(img);

  const video = await constructVideo();
  if (video) wrapper.prepend(video);

  const dispatchImgEndEvent = () => {
    img.dispatchEvent(new CustomEvent('imgended', { detail: this }));
  };

  const playImage = () => {
    img.classList.remove('hidden');
    img.src = getImageThumbnailSrc(renditionLinkHref, componentLinkHref, pageIterator.current());

    imgTimeoutId = setTimeout(dispatchImgEndEvent, 2000);
  };

  const playVideo = async () => {
    if (video) {
      const videoSource = video.querySelector('source');
      video.classList.remove('hidden');
      const { src, poster } = await getVideoUrls(
        renditionLinkHref,
        componentLinkHref,
        pageIterator.current(),
      );
      video.poster = poster;
      videoSource.src = src;
      video.load();
      video.muted = true;
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // ignore
        });
      }
    }
  };

  const playMedia = () => {
    if (isVideo(pageIterator)) {
      if (img) img.classList.add('hidden');
      playVideo();
    } else {
      if (video) video.classList.add('hidden');
      playImage();
    }
  };

  const cleanup = () => {
    if (video) {
      video.pause();
      video.currentTime = 0;
    }

    if (imgTimeoutId) {
      clearTimeout(imgTimeoutId);
    }

    pageIterator.reset();
  };

  if (video) {
    video.addEventListener('ended', () => {
      if (pageIterator.all().length > 1) {
        pageIterator.next();
        playMedia();
      }
    });
  }

  if (img) {
    img.addEventListener('imgended', () => {
      if (pageIterator.all().length > 1) {
        pageIterator.next();
        playMedia();
      }
    });
  }

  return { cleanup, hover: playMedia };
}

let currentHoveredElement;

function renderMediaWrapper(template) {
  const mediaWrapper = createTag('div', { class: 'media-wrapper' });

  // TODO: reduce memory with LRU cache or memoization with ttl
  let renderedMedia = null;

  const templateTitle = getTemplateTitle(template);
  const renditionLinkHref = extractRenditionLinkHref(template);
  const componentLinkHref = extractComponentLinkHref(template);
  const { branchUrl } = template.customLinks;
  const templateInfo = {
    templateTitle,
    branchUrl,
    renditionLinkHref,
    componentLinkHref,
  };

  const enterHandler = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!renderedMedia) {
      renderedMedia = await renderRotatingMedias(mediaWrapper, template.pages, templateInfo);
    }
    renderedMedia.hover();
    currentHoveredElement?.classList.remove('singleton-hover');
    currentHoveredElement = e.target;
    currentHoveredElement?.classList.add('singleton-hover');
    document.activeElement.blur();
  };

  const leaveHandler = () => {
    if (renderedMedia) renderedMedia.cleanup();
  };

  const focusHandler = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!renderedMedia) {
      renderedMedia = await renderRotatingMedias(mediaWrapper, template.pages, templateInfo);
      renderedMedia.hover();
    }
    currentHoveredElement?.classList.remove('singleton-hover');
    currentHoveredElement = e.target;
    currentHoveredElement?.classList.add('singleton-hover');
  };

  return { mediaWrapper, enterHandler, leaveHandler, focusHandler };
}

function renderHoverWrapper(template) {
  let cta;
  let ctaLink;

  const btnContainer = createTag('div', { class: 'button-container' });

  const {
    mediaWrapper,
    enterHandler,
    leaveHandler,
    focusHandler,
  } = renderMediaWrapper(template);

  if (variants?.includes('flyer')
  || variants?.includes('t-shirt')
  || variants?.includes('print')) {
    cta = renderPrintCTA(template);
    ctaLink = renderPrintCTALink(template);
  } else {
    mv = props?.mv ? `?mv=${props.mv}` : '';
    sdid = props?.sdid ? `&sdid=${props.sdid}` : '';
    source = props?.source ? `&source=${props.source}` : '';
    action = props?.action ? `&action=${props.action}` : '';
    cta = renderCTA(template.customLinks.branchUrl);
    ctaLink = renderCTALink(template.customLinks.branchUrl, template);
  }

  cta.setAttribute('aria-label', `${editThisTemplate} ${getTemplateTitle(template)}`);
  ctaLink.append(mediaWrapper);

  // Create shareWrapper separately
  const templateTitle = getTemplateTitle(template);
  const { branchUrl } = template.customLinks;
  const templateInfo = {
    templateTitle,
    branchUrl,
    renditionLinkHref: extractRenditionLinkHref(template),
    componentLinkHref: extractComponentLinkHref(template),
  };
  const shareWrapper = renderShareWrapper(templateInfo);

  btnContainer.append(cta);
  btnContainer.append(ctaLink);
  btnContainer.append(shareWrapper);

  btnContainer.addEventListener('mouseenter', enterHandler);
  btnContainer.addEventListener('mouseleave', leaveHandler);

  cta.addEventListener('focusin', focusHandler);
  const ctaClickHandler = () => {
    updateImpressionCache({
      content_id: template.id,
      status: template.licensingCategory,
      task: getMetadata('tasksx') || getMetadata('tasks') || '',
      search_keyword: getMetadata('q') || getMetadata('topics-x') || getMetadata('topics') || '',
      collection: getMetadata('tasksx') || getMetadata('tasks') || '',
      collection_path: window.location.pathname,
    });
    trackSearch('select-template', BlockMediator.get('templateSearchSpecs')?.search_id);
  };

  const ctaClickHandlerTouchDevice = (ev) => {
    // If it is a mobile device with a touch screen, do not jump over to the Edit page,
    // but allow the user to preview the template instead
    if (window.matchMedia('(pointer: coarse)').matches) {
      ev.preventDefault();
    }
  };

  cta.addEventListener('click', ctaClickHandler, { passive: true });
  ctaLink.addEventListener('click', ctaClickHandler, { passive: true });
  ctaLink.addEventListener('click', ctaClickHandlerTouchDevice);
  return btnContainer;
}

function getStillWrapperIcons(template) {
  let planIcon = null;
  if (template.licensingCategory === 'free') {
    planIcon = createTag('span', { class: 'free-tag' });
    planIcon.append(free === 'free' ? 'Free' : free);
  } else {
    planIcon = getIconElementDeprecated('premium');
  }
  let videoIcon = '';
  if (!containsVideo(template.pages) && template.pages.length > 1) {
    videoIcon = getIconElementDeprecated('multipage-static-badge');
  }

  if (containsVideo(template.pages) && template.pages.length === 1) {
    videoIcon = getIconElementDeprecated('video-badge');
  }

  if (containsVideo(template.pages) && template.pages.length > 1) {
    videoIcon = getIconElementDeprecated('multipage-video-badge');
  }
  if (videoIcon) videoIcon.classList.add('media-type-icon');
  return { planIcon, videoIcon };
}

function renderStillWrapper(template) {
  const stillWrapper = createTag('div', { class: 'still-wrapper' });

  const templateTitle = getTemplateTitle(template);
  const renditionLinkHref = extractRenditionLinkHref(template);
  const componentLinkHref = extractComponentLinkHref(template);

  const thumbnailImageHref = getImageThumbnailSrc(
    renditionLinkHref,
    componentLinkHref,
    template.pages[0],
  );

  const imgWrapper = createTag('div', { class: 'image-wrapper' });

  const img = createTag('img', {
    src: thumbnailImageHref,
    alt: templateTitle,
  });
  imgWrapper.append(img);

  const { planIcon, videoIcon } = getStillWrapperIcons(template);
  img.onload = (e) => {
    if (e.eventPhase >= Event.AT_TARGET) {
      imgWrapper.append(planIcon);
      imgWrapper.append(videoIcon);
    }
  };

  stillWrapper.append(imgWrapper);
  return stillWrapper;
}

export default async function renderTemplate(template, variant, properties) {
  variants = variant;
  props = properties;
  await Promise.all([import(`${getLibs()}/utils/utils.js`), import(`${getLibs()}/features/placeholders.js`)]).then(([utils, placeholders]) => {
    ({ createTag, getConfig, getMetadata } = utils);
    ({ replaceKeyArray } = placeholders);
  });
  [tagCopied, editThisTemplate, free, sharePlaceholder] = await replaceKeyArray(['tag-copied', 'edit-this-template', 'free', 'share'], getConfig());

  const tmpltEl = createTag('div');
  if (template.assetType === 'Webpage_Template') {
    // webpage_template has no pages
    template.pages = [{}];
  }

  tmpltEl.append(renderStillWrapper(template));
  tmpltEl.append(renderHoverWrapper(template));
  return tmpltEl;
}
