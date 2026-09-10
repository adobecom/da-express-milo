import {
  getIconElementDeprecated,
  fixIcons,
  getMetadata,
  formatDynamicCartLink,
  getLibs,
} from '../../scripts/utils.js';
import trackBranchParameters from '../../scripts/branchlinks.js';
import isDarkOverlayReadable from '../../scripts/color-tools.js';

// Mirror the existing marquee branding-logo injection (see grid-marquee):
// authors opt in via `inject-branding-logo` (explicit icon name) or the
// `marquee-inject-acrobat-logo` toggle; default to the Adobe Express logo.
function getBrandingLogo() {
  const brandingLogoName = getMetadata('inject-branding-logo')?.trim()
    || (['on', 'yes'].includes(getMetadata('marquee-inject-acrobat-logo')?.toLowerCase()) && 'cobrand-lockup-acrobat-express')
    || 'adobe-express-logo';
  const logo = getIconElementDeprecated(brandingLogoName);
  logo.classList.add('express-logo');
  return logo;
}

// A CTA is "long" when the buttons can't sit on a single line, so they stack.
// Measure each button's natural (nowrap) width off-screen — a clone keeps the
// check independent of any width the .long-cta rule applies, so toggling never
// changes the measurement and can't oscillate.
function ctasFitOneLine(buttonGroup, buttons) {
  const available = buttonGroup.clientWidth;
  if (!available) return true;
  const styles = getComputedStyle(buttonGroup);
  const gap = parseFloat(styles.columnGap || styles.gap) || 0;
  let total = gap * Math.max(buttons.length - 1, 0);
  buttons.forEach((btn) => {
    const clone = btn.cloneNode(true);
    clone.style.cssText = 'position:absolute;visibility:hidden;width:auto;max-width:none;white-space:nowrap;';
    buttonGroup.append(clone);
    total += clone.getBoundingClientRect().width;
    clone.remove();
  });
  return total <= available;
}

// On mobile a long CTA forces the buttons to stack; when that happens both fill
// the foreground width (see .long-cta in the CSS) instead of one full-width and
// one content-width button. Re-run on resize so the state tracks the viewport.
function watchStackedCtas(buttonGroup) {
  const sync = () => {
    const buttons = [...buttonGroup.querySelectorAll('a.con-button')];
    buttonGroup.classList.toggle('long-cta', buttons.length > 0 && !ctasFitOneLine(buttonGroup, buttons));
  };
  sync();
  new ResizeObserver(sync).observe(buttonGroup);
  document.fonts?.ready.then(sync);
}

export default async function decorate(block) {
  const rows = [...block.children];
  const [textCell, bgCell] = [...rows[0].children];
  const imageCell = rows[1]?.children[0];

  // Single-value cell (EDS delivers no <p> wrapper): read textContent as fallback
  const bgColor = bgCell?.querySelector('p')?.textContent?.trim() ?? bgCell?.textContent?.trim();
  const picture = imageCell?.querySelector('picture');

  const textEls = [...textCell.children];
  const heading = textEls.find((el) => /^H[1-6]$/.test(el.tagName));
  const paras = textEls.filter((el) => el.tagName === 'P');

  // Link-bearing paragraphs are CTAs (milo decorateButtons turns them into
  // con-buttons). No-link paragraphs before the first CTA are body copy; a
  // no-link paragraph after the CTAs is the disclaimer line.
  const firstCtaIdx = paras.findIndex((p) => p.querySelector('a'));

  const bodyParas = [];
  const ctaParas = [];
  const disclaimerParas = [];
  paras.forEach((p, i) => {
    if (p.querySelector('a')) {
      ctaParas.push(p);
    } else if (firstCtaIdx === -1 || i < firstCtaIdx) {
      bodyParas.push(p);
    } else {
      disclaimerParas.push(p);
    }
  });

  const textContainer = document.createElement('div');
  textContainer.className = 'text-container';
  if (heading) textContainer.append(heading);
  bodyParas.forEach((p) => textContainer.append(p));

  const textContent = document.createElement('div');
  textContent.className = 'text-content';
  textContent.append(getBrandingLogo());
  textContent.append(textContainer);

  const mainContainer = document.createElement('div');
  mainContainer.className = 'main-container';
  mainContainer.append(textContent);

  let buttonGroup = null;
  if (ctaParas.length || disclaimerParas.length) {
    const ctaContainer = document.createElement('div');
    ctaContainer.className = 'cta-container';

    if (ctaParas.length) {
      buttonGroup = document.createElement('div');
      buttonGroup.className = 'button-group';
      ctaParas.forEach((p) => buttonGroup.append(p));

      // Milo styles: a <strong>-wrapped link becomes the primary (blue) button,
      // an <em>-wrapped link the secondary (outline) button, sized to button-l.
      const { decorateButtons } = await import(`${getLibs()}/utils/decorate.js`);
      decorateButtons(buttonGroup, 'button-l');
      // decorateButtons tags each action-area's next sibling as supplemental
      // text; when two CTAs are adjacent that mis-tags the second button's
      // paragraph, so clear it within our own button group.
      buttonGroup.querySelectorAll('.supplemental-text')
        .forEach((el) => el.classList.remove('supplemental-text', 'body-xl'));

      ctaContainer.append(buttonGroup);
    }

    disclaimerParas.forEach((p) => {
      p.classList.add('disclaimer');
      ctaContainer.append(p);
    });

    mainContainer.append(ctaContainer);
  }

  const imageContainer = document.createElement('div');
  imageContainer.className = 'image-container';
  if (picture) imageContainer.append(picture);

  const foreground = document.createElement('div');
  foreground.className = 'foreground';
  foreground.append(mainContainer, imageContainer);

  block.textContent = '';
  if (bgColor) {
    block.style.background = bgColor;
    // isDarkOverlayReadable(bg) is true when a dark overlay is legible on the
    // background, i.e. the background is light — so flip to the .light
    // (dark-text) treatment; otherwise use the .dark (light-text) treatment.
    const light = isDarkOverlayReadable(bgColor);
    block.classList.toggle('light', light);
    block.classList.toggle('dark', !light);
  }
  block.append(foreground);

  fixIcons(block);

  // Now the block is in the DOM, classify the CTAs so long ones fill the width
  // when they stack (mobile).
  if (buttonGroup) watchStackedCtas(buttonGroup);

  const ctaLinks = [...block.querySelectorAll('.button-group a.con-button')];
  if (ctaLinks.length) {
    await trackBranchParameters(ctaLinks);
    const primaryLink = block.querySelector('.button-group a.con-button.blue');
    if (primaryLink) await formatDynamicCartLink(primaryLink);
  }
}
