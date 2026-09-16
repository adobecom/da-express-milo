import {
  getLibs,
  decorateButtonsDeprecated,
  getIconElementDeprecated,
  fixIcons,
} from '../../scripts/utils.js';
import trackBranchParameters from '../../scripts/branchlinks.js';

const DROPZONE_ICON_SRC = new URL('../../icons/upload-document.png', import.meta.url).href;

function getBrandingLogo() {
  const logo = getIconElementDeprecated('adobe-express-logo');
  logo.classList.add('express-logo');
  return logo;
}

async function loadPlaceholders() {
  window.mph = window.mph || {};
  const alreadyLoaded = Object.keys(window.mph).some((key) => key.startsWith('verb-'));
  if (alreadyLoaded) return;
  const { getConfig } = await import(`${getLibs()}/utils/utils.js`);
  const { locale } = getConfig();
  try {
    const response = await fetch(`${locale.contentRoot}/placeholders.json`);
    if (response.ok) {
      const { data } = await response.json();
      data.forEach(({ key, value }) => {
        window.mph[key] = value.replace(/\u00A0/g, ' ');
      });
    }
  } catch (error) {
    window.lana?.log(`Failed to load placeholders: ${error?.message}`, { tags: 'verb-express-marquee', severity: 'error' });
  }
}

function buildDropzone() {
  const dropzone = document.createElement('div');
  dropzone.className = 'mini-dropzone';
  dropzone.setAttribute('aria-hidden', 'true');

  const icon = document.createElement('img');
  icon.className = 'mini-dropzone-icon';
  icon.src = DROPZONE_ICON_SRC;
  icon.alt = '';

  const heading = document.createElement('p');
  heading.className = 'mini-dropzone-heading';
  heading.textContent = window.mph?.['verb-dropzone-resume-builder-upload-cta'] || '';

  const sub = document.createElement('p');
  sub.className = 'mini-dropzone-sub';
  sub.textContent = window.mph?.['verb-widget-resume-builder-file-limit'] || '';

  const content = document.createElement('div');
  content.className = 'mini-dropzone-content';
  content.append(heading, sub);

  dropzone.append(icon, content);
  return dropzone;
}

// Builds a paragraph from placeholder text, swapping known label substrings
// for real links, without using innerHTML.
function buildLinkedParagraph(text, links) {
  const p = document.createElement('p');
  let remaining = text || '';
  links.forEach(([label, url]) => {
    const idx = label ? remaining.indexOf(label) : -1;
    if (idx === -1) return;
    p.append(document.createTextNode(remaining.slice(0, idx)));
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener';
    a.className = 'legal-url';
    a.textContent = label;
    p.append(a);
    remaining = remaining.slice(idx + label.length);
  });
  p.append(document.createTextNode(remaining));
  return p;
}

function buildLegalCopy(locale) {
  const footer = document.createElement('div');
  footer.className = 'legal-copy';

  const legalPart1 = window.mph?.['verb-dropzone-legal'];
  const legalPart2 = window.mph?.['verb-dropzone-legal-2-ai'];
  const touLabel = window.mph?.['verb-widget-terms-of-use'];
  const ppLabel = window.mph?.['verb-widget-privacy-policy'];
  const touURL = window.mph?.['verb-widget-terms-of-use-url'] || `https://www.adobe.com${locale.prefix}/legal/terms.html`;
  const ppURL = window.mph?.['verb-widget-privacy-policy-url'] || `https://www.adobe.com${locale.prefix}/privacy/policy.html`;

  const line1 = document.createElement('div');
  line1.className = 'legal-line';
  const line1Text = document.createElement('p');
  line1Text.textContent = legalPart1 || '';
  line1.append(line1Text);

  const tooltipContent = window.mph?.['verb-widget-tool-tip'] || '';
  const infoIcon = document.createElement('button');
  infoIcon.type = 'button';
  infoIcon.className = 'info-icon milo-tooltip top';
  if (tooltipContent) {
    infoIcon.setAttribute('aria-label', tooltipContent);
    infoIcon.setAttribute('data-tooltip', tooltipContent);
  }
  infoIcon.append(getIconElementDeprecated('info'));
  line1.append(infoIcon);

  const line2 = buildLinkedParagraph(legalPart2, [
    [touLabel, touURL],
    [ppLabel, ppURL],
  ]);

  footer.append(line1, line2);
  return footer;
}

export default async function decorate(block) {
  const [row] = block.children;
  const [textCell, imageCell] = row.children;
  const picture = imageCell.querySelector('picture');

  decorateButtonsDeprecated(block);

  const heading = textCell.querySelector('h1, h2, h3, h4, h5, h6');
  const ctaPara = [...textCell.querySelectorAll('p')].find((p) => p.querySelector('a'));
  const bodyParas = [...textCell.querySelectorAll('p')].filter((p) => p !== ctaPara);

  const { getConfig } = await import(`${getLibs()}/utils/utils.js`);
  const { locale } = getConfig();
  await loadPlaceholders();

  const copy = document.createElement('div');
  copy.className = 'copy';
  if (heading) copy.append(heading);
  bodyParas.forEach((p) => copy.append(p));

  const ctaDropzone = document.createElement('div');
  ctaDropzone.className = 'cta-dropzone';
  if (ctaPara) ctaDropzone.append(ctaPara);
  ctaDropzone.append(buildDropzone());

  const copyColumn = document.createElement('div');
  copyColumn.className = 'copy-column';
  copyColumn.append(getBrandingLogo(), copy, ctaDropzone, buildLegalCopy(locale));

  const imageColumn = document.createElement('div');
  imageColumn.className = 'image-column';
  if (picture) imageColumn.append(picture);

  const foreground = document.createElement('div');
  foreground.className = 'foreground';
  foreground.append(copyColumn, imageColumn);

  block.textContent = '';
  block.append(foreground);

  fixIcons(block);

  const ctaLink = ctaPara?.querySelector('a');
  if (ctaLink) await trackBranchParameters([ctaLink]);
}
