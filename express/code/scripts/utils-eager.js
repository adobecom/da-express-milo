/*
 * Copyright 2022 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

/**
 * Eager critical-path subset of utils.js — loaded by scripts.js before LCP.
 * Keep this module small; defer everything else via dynamic import of utils.js.
 */

/**
 * The decision engine for where to get Milo's libs from.
 */
export const [setLibs, getLibs] = (() => {
  let libs;
  return [
    (prodLibs, location) => {
      libs = (() => {
        const { hostname, search } = location || window.location;
        if (!['.aem.', '.hlx.', '.stage.', 'local', '.da.'].some((i) => hostname.includes(i))) return prodLibs;
        const branch = new URLSearchParams(search).get('milolibs') || 'main';
        if (!/^[a-zA-Z0-9_-]+$/.test(branch)) throw new Error('Invalid branch name.');
        if (branch === 'local') return 'http://localhost:6456/libs';
        if (branch === 'main' && hostname.includes('.stage.')) return '/libs';
        return branch.includes('--') ? `https://${branch}.aem.live/libs` : `https://${branch}--milo--adobecom.aem.live/libs`;
      })();
      return libs;
    }, () => libs,
  ];
})();

const cachedMetadata = [];
export const getMetadata = (name, doc = document) => {
  const attr = name && name.includes(':') ? 'property' : 'name';
  const meta = doc.head.querySelector(`meta[${attr}="${name}"]`);
  return meta && meta.content;
};

export function getCachedMetadata(name) {
  if (cachedMetadata[name] === undefined) cachedMetadata[name] = getMetadata(name);
  return cachedMetadata[name];
}

export function getContentRoot(location) {
  const { hostname } = location || window.location;
  if (['--express-color--', 'color.stage.adobe.com', 'color.adobe.com'].some((i) => hostname.includes(i))) return '';
  return '/express';
}

export function getMobileOperatingSystem() {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;

  // Windows Phone must come first because its UA also contains "Android"
  if (/windows phone/i.test(userAgent)) {
    return 'Windows Phone';
  }

  if (/android/i.test(userAgent)) {
    return 'Android';
  }

  if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
    return 'iOS';
  }

  return 'unknown';
}

export function toClassName(name) {
  return name && typeof name === 'string'
    ? name.toLowerCase().replace(/[^0-9a-z]/gi, '-')
    : '';
}

export function readBlockConfig(block) {
  const config = {};
  block.querySelectorAll(':scope>div').forEach(($row) => {
    if ($row.children) {
      const $cols = [...$row.children];
      if ($cols[1]) {
        const $value = $cols[1];
        const name = toClassName($cols[0].textContent.trim());
        let value;
        if ($value.querySelector('a')) {
          const $as = [...$value.querySelectorAll('a')];
          if ($as.length === 1) {
            value = $as[0].href;
          } else {
            value = $as.map(($a) => $a.href);
          }
        } else if ($value.querySelector('p')) {
          const $ps = [...$value.querySelectorAll('p')];
          if ($ps.length === 1) {
            value = $ps[0].textContent.trim();
          } else {
            value = $ps.map(($p) => $p.textContent.trim());
          }
        } else value = $row.children[1].textContent.trim();
        config[name] = value;
      }
    }
  });
  return config;
}

export function hideQuickActionsOnDevices(userAgent) {
  if (getMetadata('fqa-off') || !!getMetadata('fqa-on')) return;
  document.body.dataset.device = userAgent.includes('Mobile') ? 'mobile' : 'desktop';
  const fqaMeta = document.createElement('meta');
  fqaMeta.setAttribute('content', 'on');
  const isMobile = document.body.dataset.device === 'mobile';
  const isQualifiedBrowser = !/Safari/.test(userAgent) || /Chrome|CriOS|FxiOS|Edg|OPR|Opera|OPiOS|Vivaldi|YaBrowser|Avast|VivoBrowser|GSA/.test(userAgent);
  if (isMobile || !isQualifiedBrowser) {
    fqaMeta.setAttribute('name', 'fqa-off'); // legacy setup for mobile or desktop_safari
  } else {
    fqaMeta.setAttribute('name', 'fqa-on'); // legacy setup for desktop or non_safari
  }
  // latest setup that supports safari frictionless, enabled by metadata
  // fqa-non-qualified: always removed. (before: safari)
  // fqa-qualified-ios: iOS mobile only.
  // fqa-qualified-android: Android mobile only.
  // fqa-qualified-mobile: mobile only. (before: non-safari mobile) — kept for backwards compat
  // fqa-qualified-desktop: desktop only. (before: non-safari desktop)
  const audienceFqaMeta = document.createElement('meta');
  audienceFqaMeta.setAttribute('content', 'on');
  if (getMetadata('frictionless-safari')?.toLowerCase() === 'on' || isQualifiedBrowser) {
    if (isMobile) {
      const os = getMobileOperatingSystem();
      audienceFqaMeta.setAttribute('name', os === 'Android' ? 'fqa-qualified-android' : 'fqa-qualified-ios');
      // also inject fqa-qualified-mobile so sections targeting both iOS + Android still show
      const mobileFqaMeta = document.createElement('meta');
      mobileFqaMeta.setAttribute('name', 'fqa-qualified-mobile');
      mobileFqaMeta.setAttribute('content', 'on');
      document.head.append(mobileFqaMeta);
    } else {
      audienceFqaMeta.setAttribute('name', 'fqa-qualified-desktop');
    }
  } else {
    audienceFqaMeta.setAttribute('name', 'fqa-non-qualified');
  }
  document.head.append(fqaMeta, audienceFqaMeta);
}

export function preDecorateSections(area) {
  if (!area) return;
  const selector = area === document ? 'body > main > div' : ':scope > div';
  area.querySelectorAll(selector).forEach((section) => {
    const sectionMetaBlock = section.querySelector('div.section-metadata');
    if (sectionMetaBlock) {
      const sectionMeta = readBlockConfig(sectionMetaBlock);

      // section meant for different device
      let sectionRemove = !!(sectionMeta.audience
        && sectionMeta.audience.toLowerCase() !== document.body.dataset?.device);

      // section visibility steered over metadata
      if (!sectionRemove && sectionMeta.showwith !== undefined) {
        let showWithSearchParam = null;
        if (!['www.adobe.com'].includes(window.location.hostname)) {
          const urlParams = new URLSearchParams(window.location.search);
          showWithSearchParam = urlParams.get(`${sectionMeta.showwith.toLowerCase()}`)
            || urlParams.get(`${sectionMeta.showwith}`);
        }
        const showwith = sectionMeta.showwith.toLowerCase();
        if (['fqa-off', 'fqa-on', 'fqa-non-qualified', 'fqa-qualified-mobile', 'fqa-qualified-desktop', 'fqa-qualified-ios', 'fqa-qualified-android'].includes(showwith)) hideQuickActionsOnDevices(navigator.userAgent);
        sectionRemove = showWithSearchParam !== null ? showWithSearchParam !== 'on' : getMetadata(showwith) !== 'on';
      }
      if (sectionRemove) section.remove();
      else if (sectionMeta.anchor) section.id = sectionMeta.anchor;
      else if (sectionMeta.padding) section.setAttribute('data-padding', 'none');
    }
  });

  area.querySelectorAll(`${selector} > .billing-radio, ${selector} > .split-action`).forEach((el) => el.remove());

  // floating CTA vs page CTA with same text or link logics
  if (['yes', 'y', 'true', 'on'].includes(getMetadata('show-floating-cta')?.toLowerCase())) {
    const { device } = document.body.dataset;
    const textToTarget = getMetadata(`${device}-floating-cta-text`)?.trim() || getMetadata('main-cta-text')?.trim();
    const linkToTarget = getMetadata(`${device}-floating-cta-link`)?.trim() || getMetadata('main-cta-link')?.trim();
    if (textToTarget || linkToTarget) {
      let linkToTargetURL = null;
      try {
        linkToTargetURL = new URL(linkToTarget);
      } catch (error) {
        window.lana?.log(`${error?.message || error?.detail || error}`, { tags: 'utils', severity: 'error' });
      }
      const sameUrlCTAs = Array.from(area.querySelectorAll('a:any-link'))
        .filter((a) => {
          try {
            const currURL = new URL(a.href);
            const sameText = a.textContent.trim() === textToTarget;
            const samePathname = currURL.pathname === linkToTargetURL?.pathname;
            const sameHash = currURL.hash === linkToTargetURL?.hash;
            const isNotInFloatingCta = !a.closest('.block')?.classList.contains('floating-button');
            const notFloatingCtaIgnore = !a.classList.contains('floating-cta-ignore');
            const isNotInCtaCarousel = !a.closest('.cta-carousel');

            return (sameText || (samePathname && sameHash))
              && isNotInFloatingCta && notFloatingCtaIgnore && isNotInCtaCarousel;
          } catch (error) {
            window.lana?.log(`${error?.message || error?.detail || error}`, { tags: 'utils', severity: 'error' });
            return false;
          }
        });

      sameUrlCTAs.forEach((cta) => {
        cta.classList.add('same-fcta');
      });
    }
  }
}
