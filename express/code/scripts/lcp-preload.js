/*
 * Copyright 2025 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

/*
 * Eager LCP-image preload — intentionally has NO imports.
 *
 * This module is loaded from head.html BEFORE scripts.js. Because scripts.js statically
 * imports the ~26KB utils.js, its module body (and the old in-line LCP preload) could not
 * run until utils.js downloaded + evaluated (~700ms under throttle). The LCP preload needs
 * only DOM APIs, so keeping it import-less lets it execute at parse-complete (~DCL) instead,
 * starting the hero image fetch much earlier. Keep this file dependency-free.
 */

const eagerLoad = (img) => {
  img?.setAttribute('loading', 'eager');
  img?.setAttribute('fetchpriority', 'high');
};

function preloadLCPImage(img) {
  const picture = img?.closest('picture');
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.fetchPriority = 'high';

  if (picture) {
    const sources = [...picture.querySelectorAll('source')];
    // Pick the source that matches THIS viewport. The old code always used sources[0]
    // (the desktop `media="(min-width: 600px)"` variant) and copied its media query onto
    // the preload, so on mobile the preload never matched and the real image loaded at
    // Low priority. A source without a media attribute matches everything.
    const match = sources.find(
      (source) => !source.media || window.matchMedia(source.media).matches,
    );
    if (match) {
      link.type = match.type || '';
      link.imageSrcset = match.srcset || '';
      if (match.sizes) link.imageSizes = match.sizes;
      // deliberately no link.media: we already resolved the match for this viewport
    } else {
      link.href = img.src;
    }
  } else {
    link.href = img.src;
  }

  const key = link.href || link.imageSrcset;
  const alreadyExists = key && (
    document.querySelector(`link[rel="preload"][href="${key}"]`)
    || document.querySelector(`link[rel="preload"][imagesrcset="${key}"]`)
  );
  if (key && !alreadyExists) {
    document.head.appendChild(link);
  }
}

(function decorateLCPImage() {
  const firstSection = document.querySelector('body > main > div:nth-child(1)');
  if (!firstSection) return;

  const images = firstSection.querySelectorAll('img');
  if (images.length > 0) {
    images.forEach(eagerLoad);
    preloadLCPImage(images[0]);
  } else {
    const lcpImg = document.querySelector('img');
    if (lcpImg) {
      eagerLoad(lcpImg);
      preloadLCPImage(lcpImg);
    }
  }
}());
